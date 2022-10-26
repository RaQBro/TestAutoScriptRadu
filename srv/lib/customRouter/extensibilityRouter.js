/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const expressPromiseRouter = require("express-promise-router");

/**
 * @fileOverview
 * 
 * Extensibility PLC Router
 * Requests used to call the custom backend services:
 * 
 *		- GET /extensibility/plc/application-token
 *		- POST /extensibility/plc/generate-technical-user-plc-token
 *		- GET /extensibility/plc/check-technical-user-plc-token
 *		- GET /extensibility/plc/check-init-plc-session
 *		- GET /extensibility/plc/user-plc-token
 *		- GET /extensibility/plc/user-details
 *		- GET /extensibility/plc/check-authorization
 *		- GET /extensibility/plc/application-routes
 *		- POST /extensibility/plc/maintain-default-values
 *		- GET /extensibility/plc/get-all-projects
 *		- GET /extensibility/plc/example-service?IS_ONLINE_MODE=true/false
 *							- undefined or true if online mode (web request) - no entries in logs/messages if undefined for web request
 *							- false if fake background job (web request)
 *							- must be undefined in case of background job (job request) - with entries in logs/messages for job request
 *		- GET /extensibility/plc/archive-logs-messages
 *		- GET /extensibility/plc/logout-service
 * 
 * @name extensibilityRouter.js
 */

const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js");
const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js");
const UaaToken = require(global.appRoot + "/lib/util/uaaToken.js");
const helpers = require(global.appRoot + "/lib/util/helpers.js");

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

const sContentType = "application/json";
const sOperation = "Dummy Operation"; // operation of the service / job

const ExampleService = require(global.appRoot + "/lib/service/exampleService.js").doService;
const LogoutService = require(global.appRoot + "/lib/service/logoutService.js").doService;
const ArchiveService = require(global.appRoot + "/lib/service/archiveService.js").doService;

/** @class
 * @classdesc Extensibility PLC router
 * @name ExtensibilityRouter
 */
class ExtensibilityRouter {

	constructor() {

		let router = expressPromiseRouter();

		let UAAToken = new UaaToken();
		let JobSchedulerUtil = new JobScheduler();

		/**
		 * Common function before all routes are processed
		 */
		router.use(async function (request, response, next) {

			await UAAToken.retrieveApplicationUserToken(request);

			next();
		});

		/**
		 * Endpoint for getting X-CSRF-Token of the application
		 */
		router.get("/application-token", function (request, response) {

			response.status(200).send(true);
		});

		/**
		 * Endpoint for generating the X-CSRF-Token from UAA of PLC for technical user
		 */
		router.post("/generate-technical-user-plc-token", function (request, response) {

			let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

			ExtensibilityPlcService.generateTechnicalUserPlcToken(request).then(function (result) {
				response.status(200).type(sContentType).send({
					"technicalUserPlcToken": result
				});
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		/**
		 * Endpoint for checking X-CSRF-Token of PLC for technical user
		 */
		router.get("/check-technical-user-plc-token", function (request, response) {

			let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

			ExtensibilityPlcService.checkTechnicalUserPlcToken().then(function (result) {
				response.status(200).type(sContentType).send({
					"technicalUserPlcToken": result
				});
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		/**
		 * Endpoint for checking if PLC session is active. If not PLC init-session will be performed
		 */
		router.get("/check-init-plc-session", function (request, response) {

			let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

			ExtensibilityPlcService.checkInitPLCSession(request).then(function (result) {
				response.status(200).type(sContentType).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		/**
		 * Endpoint for getting X-CSRF-Token from UAA of PLC
		 */
		router.get("/user-plc-token", function (request, response) {

			let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

			ExtensibilityPlcService.getUserPlcToken(request).then(function (result) {
				response.status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		/**
		 * Endpoint for authenticated user details fetch
		 */
		router.get("/user-details", function (request, response) {

			response.type(sContentType).status(200).send({
				"givenName": request.authInfo.getGivenName(),
				"familyName": request.authInfo.getFamilyName(),
				"userId": request.user.id.toUpperCase()
			});
		});

		router.get("/check-authorization", function (request, response) {

			if (!helpers.isUndefinedNullOrEmptyString(request.query) && !helpers.isUndefinedNullOrEmptyString(request.query.ID)) {
				let sDisplayScope = "$XSAPPNAME." + request.query.ID + "_Display";
				let sMaintainScope = "$XSAPPNAME." + request.query.ID + "_Maintain";

				if (request.authInfo && request.authInfo.checkScope(sDisplayScope) && request.authInfo.checkScope(
						sMaintainScope)) {
					response.type(sContentType).status(200).send({
						"display": true,
						"maintain": true
					});
				}
				if (request.authInfo && request.authInfo.checkScope(sDisplayScope) && !request.authInfo.checkScope(
						sMaintainScope)) {
					response.type(sContentType).status(200).send({
						"display": true,
						"maintain": false
					});
				}
				if (request.authInfo && !request.authInfo.checkScope(sDisplayScope) && !request.authInfo.checkScope(
						sMaintainScope)) {
					response.type(sContentType).status(200).send({
						"display": false,
						"maintain": false
					});
				}
			} else {
				response.type(sContentType).status(401).send();
			}
		});

		/**
		 * Endpoint for plc application routes fetch
		 */
		router.get("/application-routes", function (request, response) {

			response.type(sContentType).status(200).send({
				"web": global.plcWebUrl,
				"xsjs": global.plcXsjsUrl,
				"publicApi": global.plcPublicApiUrl
			});
		});

		/**
		 * Endpoint for maintaining the default values
		 */
		router.post("/maintain-default-values", function (request, response) {

			let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

			ExtensibilityPlcService.maintainDefaultValues(request, response)
				.then(function (resp) {
					response.send(resp);
				}).catch(function (err) {
					response.send(err);
				});
		});

		router.get("/get-all-projects", function (request, response) {

			let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

			ExtensibilityPlcService.getAllProjects().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/example-service", async function (request, response) {

			try {
				// create job log entry
				await JobSchedulerUtil.insertJobLogEntryIntoTable(request);

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {
					// write entry into t_messages only for jobs (real)
					let sMessageInfo = `Job with ID '${request.JOB_ID}' started!`;
					await Message.addLog(request.JOB_ID, sMessageInfo, "message", undefined, sOperation);
					// return special header to jobscheduler to know that it's async job run
					response.status(202).send("ACCEPTED");
				} else {
					// check if should wait for service response or return a JOB_ID
					if (request.IS_ONLINE_MODE === false) {
						// write entry into t_messages only for jobs (fake)
						let sMessageInfo = `Job with ID '${request.JOB_ID}' added to the Job Queue!`;
						await Message.addLog(request.JOB_ID, sMessageInfo, "message", undefined, sOperation);
						// fake/simulate background job
						let oMessage = new Message(sMessageInfo, {
							"JOB_ID": request.JOB_ID
						});
						// return JOB_ID on the service response (in order to avoid session timeout) and continue execution of the service afterwards
						response.status(200).send(oMessage);
					}
				}
			} catch (err) {

				// return error and stop execution of the service
				let oPlcException = await PlcException.createPlcException(err, request.JOB_ID, sOperation);
				response.status(oPlcException.code.responseCode).send(oPlcException);
				return;
			}

			// import service
			let Service = new ExampleService();

			// execute service
			await Service.execute(request)

			// handle success execution of the service
			.then(async function (oServiceResponse) {

				let iStatusCode = oServiceResponse.STATUS_CODE;
				let bOnlineMode = oServiceResponse.IS_ONLINE_MODE;
				let oServiceResponseBody = oServiceResponse.SERVICE_RESPONSE;

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// update run log of schedule
					JobSchedulerUtil.updateRunLogOfSchedule(request, iStatusCode, oServiceResponseBody);
				} else {

					// return service response body for web request
					if (bOnlineMode === true) {

						// get all messages from the job
						let aMessages = await JobSchedulerUtil.getMessagesOfJobWithId(request.JOB_ID);

						// decide what to send as response
						let oResponseBody = request.JOB_ID === undefined ? oServiceResponseBody : aMessages;

						// send response
						response.type(sContentType).status(iStatusCode).send(oResponseBody);
					}
				}
			});
		});

		router.get("/logout-service", async function (request, response) {

			let sCurrentOperation = "Logout Technical User";

			try {
				// create job log entry
				await JobSchedulerUtil.insertJobLogEntryIntoTable(request, true);

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {
					// return special header to jobscheduler to know that it's async job run
					response.status(202).send("ACCEPTED");
				} else {
					// check if should wait for service response or return a JOB_ID
					if (request.IS_ONLINE_MODE === false) {
						// fake/simulate background job
						let oMessage = new Message(`Job with ID '${request.JOB_ID}' started!`, {
							"JOB_ID": request.JOB_ID
						});
						// return JOB_ID on the service response (in order to avoid session timeout) and continue execution of the service afterwards
						response.status(200).send(oMessage);
					}
				}
			} catch (err) {

				// return error and stop execution of the service
				let oPlcException = await PlcException.createPlcException(err, request.JOB_ID, sCurrentOperation);
				response.status(oPlcException.code.responseCode).send(oPlcException);
				return;
			}

			// import service
			let Service = new LogoutService();

			// execute service
			await Service.execute(request)

			// handle success execution of the service
			.then(async function (oServiceResponse) {

				let iStatusCode = oServiceResponse.STATUS_CODE;
				let bOnlineMode = oServiceResponse.IS_ONLINE_MODE;
				let oServiceResponseBody = oServiceResponse.SERVICE_RESPONSE;

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// update run log of schedule
					JobSchedulerUtil.updateRunLogOfSchedule(request, iStatusCode, oServiceResponseBody);
				} else {

					// return service response body for web request
					if (bOnlineMode === true) {

						// get all messages from the job
						let aMessages = await JobSchedulerUtil.getMessagesOfJobWithId(request.JOB_ID);

						// decide what to send as response
						let oResponseBody = request.JOB_ID === undefined ? oServiceResponseBody : aMessages;

						// send response
						response.type(sContentType).status(iStatusCode).send(oResponseBody);
					}
				}
			});
		});

		router.get("/archive-logs-messages", async function (request, response) {

			let sCurrentOperation = "Archive Logs";

			try {
				// create job log entry
				await JobSchedulerUtil.insertJobLogEntryIntoTable(request, true);

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {
					// return special header to jobscheduler to know that it's async job run
					response.status(202).send("ACCEPTED");
				} else {
					// check if should wait for service response or return a JOB_ID
					if (request.IS_ONLINE_MODE === false) {
						// fake/simulate background job
						let oMessage = new Message(`Job with ID '${request.JOB_ID}' started!`, {
							"JOB_ID": request.JOB_ID
						});
						// return JOB_ID on the service response (in order to avoid session timeout) and continue execution of the service afterwards
						response.status(200).send(oMessage);
					}
				}
			} catch (err) {

				// return error and stop execution of the service
				let oPlcException = await PlcException.createPlcException(err, request.JOB_ID, sCurrentOperation);
				response.status(oPlcException.code.responseCode).send(oPlcException);
				return;
			}

			// import service
			let Service = new ArchiveService();

			// execute service
			await Service.execute(request)

			// handle success execution of the service
			.then(async function (oServiceResponse) {

				let iStatusCode = oServiceResponse.STATUS_CODE;
				let bOnlineMode = oServiceResponse.IS_ONLINE_MODE;
				let oServiceResponseBody = oServiceResponse.SERVICE_RESPONSE;

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// update run log of schedule
					JobSchedulerUtil.updateRunLogOfSchedule(request, iStatusCode, oServiceResponseBody);
				} else {

					// return service response body for web request
					if (bOnlineMode === true) {

						// get all messages from the job
						let aMessages = await JobSchedulerUtil.getMessagesOfJobWithId(request.JOB_ID);

						// decide what to send as response
						let oResponseBody = request.JOB_ID === undefined ? oServiceResponseBody : aMessages;

						// send response
						response.type(sContentType).status(iStatusCode).send(oResponseBody);
					}
				}
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}
exports.ExtensibilityRouter = module.exports.ExtensibilityRouter = ExtensibilityRouter;
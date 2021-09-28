/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

/**
 * @fileOverview
 * 
 * Extensibility PLC Router
 * Requests used to call the custom backend services:
 *		- GET /extensibility/plc/token
 *		- GET /extensibility/plc/userDetails
 *		- GET /extensibility/plc/applicationRoutes
 *		- POST /extensibility/plc/maintainDefaultValues
 *		- GET /extensibility/plc/getAllProjects
 *		- GET /extensibility/plc/exampleService?IS_ONLINE_MODE=true/false
 *							- undefined or true if onlime mode (web request) - no entries in logs/messages if undefined for web request
 *							- false if fake background job (web request)
 *							- must be undefined in case of background job (job request) - with entries in logs/messages for job request
 * 
 * @name extensibilityRouter.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js").JobSchedulerUtil;
const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js").Service;

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

/** @class
 * @classdesc Extensibility PLC router
 * @name ExtensibilityRouter
 */
class ExtensibilityRouter {

	constructor() {

		var router = express.Router();

		var ExtensibilityPlcService;
		var JobSchedulerUtil = new JobScheduler();
		const sContentType = "application/json";

		/**
		 * Common function before all routes are processed:
		 *		- generate an autoincrement JOB_ID based on the existing ids
		 */
		router.use(async function (request, response, next) {

			await JobSchedulerUtil.generateJobIdAndJobTimestampAndJobType(request);
			ExtensibilityPlcService = new ExtensibilityService(request);
			next();

		});

		/**
		 * Endpoint for X-CSRF-Token fetch
		 */
		router.get("/token", function (request, response) {
			response.send(true);
		});

		/**
		 * Endpoint for authenticated user details fetch
		 */
		router.get("/userDetails", function (request, response) {
			response.type(sContentType).status(200).send({
				"givenName": request.authInfo.getGivenName(),
				"familyName": request.authInfo.getFamilyName(),
				"userId": request.user.id.toUpperCase()
			});
		});

		/**
		 * Endpoint for plc application routes fetch
		 */
		router.get("/applicationRoutes", function (request, response) {
			response.type(sContentType).status(200).send({
				"web": global.plcWebUrl,
				"xsjs": global.plcXsjsUrl,
				"publicApi": global.plcPublicApiUrl
			});
		});

		/**
		 * Endpoint for maintaining the default values
		 */
		router.post("/maintainDefaultValues", function (request, response) {

			ExtensibilityPlcService.maintainDefaultValues(request, response)
				.then(function (resp) {
					response.send(resp);
				}).catch(function (err) {
					response.send(err);
				});
		});

		router.get("/getAllProjects", function (request, response) {

			ExtensibilityPlcService.getAllProjects().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/exampleService", async function (request, response) {

			// create job log entry
			let oException = await JobSchedulerUtil.insertJobLogEntryIntoTable(request);
			if (oException !== undefined) {
				response.status(oException.code.responseCode).send(oException);
				return;
			}

			// write entry into t_messages only for jobs (fake or real)
			const sMessageInfo = `Job with ID '${request.JOB_ID}' started!`;
			await Message.addLog(request.JOB_ID, sMessageInfo, "message");

			// check if web or job request
			if (helpers.isRequestFromJob(request)) {
				// return special header to jobscheduler to know that it's async job run
				response.status(202).send("ACCEPTED");
			} else {
				// check if should wait for service response or return a JOB_ID
				if (request.IS_ONLINE_MODE === false) {
					// fake/simulate background job
					const oMessage = new Message(sMessageInfo, {
						"JOB_ID": request.JOB_ID
					});
					// return JOB_ID on the service response (in order to avoid session timeout) and continue execution of the service afterwards
					response.status(200).send(oMessage);
				}
			}

			// import service
			require(global.appRoot + "/lib/service/exampleService.js")

			// execute service
			.doService(request)

			// handle success execution of the service
			.then(function (oServiceResponse) {

				const iStatusCode = oServiceResponse.STATUS_CODE;
				const oServiceResponseBody = oServiceResponse.SERVICE_RESPONSE;

				// add service response body to job log entry
				JobSchedulerUtil.updateJobLogEntryFromTable(request, iStatusCode, oServiceResponseBody);

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// update run log of schedule
					JobSchedulerUtil.updateRunLogOfSchedule(request, iStatusCode, oServiceResponseBody);

				} else {

					// return service response body for web request
					if (request.IS_ONLINE_MODE === true) {
						response.type(sContentType).status(iStatusCode).send(oServiceResponseBody);
					}

				}
				Message.addLog(request.JOB_ID, `Job with ID '${request.JOB_ID}' ended!`, "message");
			})

			// handle errors from then function
			.catch(async function (err) {

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// add service response body to job log entry
					JobSchedulerUtil.updateJobLogEntryFromTable(request, 500, err);

					// update run log of schedule
					JobSchedulerUtil.updateRunLogOfSchedule(request, 500, err);

				} else {

					// create error as service response body
					const oPlcException = await PlcException.createPlcException(err, request.JOB_ID);

					// add service response body to job log entry
					JobSchedulerUtil.updateJobLogEntryFromTable(request, oPlcException.code.responseCode, oPlcException);

					// return service response body for web request
					if (request.IS_ONLINE_MODE === true) {
						response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
					}

				}
				Message.addLog(request.JOB_ID, `Job with ID '${request.JOB_ID}' ended!`, "message");
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}
exports.ExtensibilityRouter = module.exports.ExtensibilityRouter = ExtensibilityRouter;
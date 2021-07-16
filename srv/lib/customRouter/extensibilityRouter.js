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
 *		- GET /extensibility/plc/exampleService
 * 
 * @name extensibilityRouter.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;
const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js").JobSchedulerUtil;
const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js").Service;

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
		 *		- generate a an autoincrement JOB_ID based on the existing ids
		 */
		router.use(async function (request, response, next) {

			await JobSchedulerUtil.generateJobIdAndJobTimestamp(request);
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
				"publicApi": global.plcXsjsUrl
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
			}).catch(function (err) {
				const oPlcException = PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/exampleService", function (request, response) {

			// check if web or job request
			if (helpers.isRequestFromJob(request)) {
				// return special header to jobscheduler to know that it's async job run
				response.status(202).send("ACCEPTED");
			}

			// create job log entry
			JobSchedulerUtil.insertJobLogEntryIntoTable(request);

			// import service
			require(global.appRoot + "/lib/service/exampleService.js")

			// execute service
			.doService(request)

			// handle success execution of the service
			.then(function (oServiceResponse) {

				const iStatusCode = oServiceResponse.STATUS_CODE;
				const oServiceResponseBody = oServiceResponse.SERVICE_RESPONSE;

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// update run log of schedule and add service response body to job log entry
					JobSchedulerUtil.updateRunLogOfSchedule(request, iStatusCode, oServiceResponseBody);

				} else {

					// add service response body to job log entry
					JobSchedulerUtil.updateJobLogEntryFromTable(request, oServiceResponseBody);

					// return service response body for web request
					response.type(sContentType).status(iStatusCode).send(oServiceResponseBody);

				}
			})

			// handle errors from then function
			.catch(function (err) {

				// check if web or job request
				if (helpers.isRequestFromJob(request)) {

					// update run log of schedule and add service response body to job log entry
					JobSchedulerUtil.updateRunLogOfSchedule(request, 500, err);

				} else {

					// create error as service response body
					const oPlcException = PlcException.createPlcException(err, request.JOB_ID);

					// add service response body to job log entry
					JobSchedulerUtil.updateJobLogEntryFromTable(request, oPlcException);

					// return service response body for web request
					response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);

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
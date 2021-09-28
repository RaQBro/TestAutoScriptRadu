/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

/**
 * @fileOverview
 * 
 * Job Scheduler Router
 * Requests used to get existing background jobs and to create new schedules for jobs:
 *		- GET /scheduler/job/getAllJobs
 *		- GET /scheduler/job/getJobByName?JOB_NAME=TEMPLATE_APPLICATION_JOB
 *		- POST /scheduler/job/addNewSchedule?JOB_ID=123 + body data @see /config.js file for examples
 *		- POST /scheduler/job/addSchedules?JOB_ID=123 + body data: {
 *			"PROJECT_ID": ["P1", "P2"],
 *			"CALCULATION_ID": [100, 200],
 *			"CALCULATION_VERSION_ID": [1000, 1001] }
 * 
 * @name jobSchedulerRouter.js
 */

const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;
const JobScheduler = require(global.appRoot + "/lib/routerService/jobSchedulerService.js").JobSchedulerService;

/** @class
 * @classdesc Job scheduler router
 * @name JobSchedulerRouter 
 */
class JobSchedulerRouter {

	constructor() {

		var router = express.Router();

		var JobSchedulerService = new JobScheduler();
		const sContentType = "application/json";

		/**
		 * Common function before all routes are processed
		 */
		router.use(function (request, response, next) {
			next();
		});

		router.get("/getAllJobs", function (request, response) {

			JobSchedulerService.getAllJobs().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/getJobByName", function (request, response) {

			const sJobName = request.query.JOB_NAME;

			JobSchedulerService.getJobByName(sJobName).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.post("/addNewSchedule", function (request, response) {

			const iJobId = request.query.JOB_ID;
			const oNewSchedule = request.body;

			JobSchedulerService.addNewSchedule(iJobId, oNewSchedule).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.post("/addSchedules", function (request, response) {

			const iJobId = request.query.JOB_ID;
			const oRequestBody = request.body;

			JobSchedulerService.addSchedules(iJobId, oRequestBody).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}
exports.JobSchedulerRouter = module.exports.JobSchedulerRouter = JobSchedulerRouter;
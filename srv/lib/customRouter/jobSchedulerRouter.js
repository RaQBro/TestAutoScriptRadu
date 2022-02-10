/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

/**
 * @fileOverview
 * 
 * Job Scheduler Router
 * Requests used to get existing background jobs and to create new schedules for jobs:
 *		- GET /scheduler/job/get-all-jobs
 *		- GET /scheduler/job/get-job-by-name?JOB_NAME=TEMPLATE_APPLICATION_JOB
 *		- POST /scheduler/job/add-new-schedule?JOB_ID=123 + body data @see /config.js file for examples
 *		- POST /scheduler/job/add-schedules?JOB_ID=123 + body data: {
 *			"PROJECT_ID": ["P1", "P2"],
 *			"CALCULATION_ID": [100, 200],
 *			"CALCULATION_VERSION_ID": [1000, 1001] }
 * 
 * @name jobSchedulerRouter.js
 */

const JobScheduler = require(global.appRoot + "/lib/routerService/jobSchedulerService.js").JobSchedulerService;
const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;

const sContentType = "application/json";

/** @class
 * @classdesc Job scheduler router
 * @name JobSchedulerRouter 
 */
class JobSchedulerRouter {

	constructor() {

		let router = express.Router();

		let JobSchedulerService = new JobScheduler();

		/**
		 * Common function before all routes are processed
		 */
		router.use(function (request, response, next) {
			next();
		});

		router.get("/get-all-jobs", function (request, response) {

			JobSchedulerService.getAllJobs().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/get-job-by-name", function (request, response) {

			let sJobName = request.query.JOB_NAME;

			JobSchedulerService.getJobByName(sJobName).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.post("/add-new-schedule", function (request, response) {

			let iJobId = request.query.JOB_ID;
			let oNewSchedule = request.body;

			JobSchedulerService.addNewSchedule(iJobId, oNewSchedule).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.post("/add-schedules", function (request, response) {

			let iJobId = request.query.JOB_ID;
			let oRequestBody = request.body;

			JobSchedulerService.addSchedules(iJobId, oRequestBody).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
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
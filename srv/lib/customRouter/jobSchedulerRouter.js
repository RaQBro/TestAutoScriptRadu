/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

const PlcException = require(global.appRoot + "/lib/util/message").PlcException;
const JobSchedulerService = require(global.appRoot + "/lib/routerService/jobSchedulerService.js").JobScheduler;

class JobSchedulerRouter {

	constructor() {

		var router = express.Router();

		// common function before all routes are processed
		router.use(function (request, response, next) {
			next();
		});

		router.get("/getAllJobs", function (request, response) {
			let jobSchedulerService = new JobSchedulerService();

			jobSchedulerService.getAllJobs().then(function (result) {
				response.type("application/json").status(200).send(JSON.stringify(result));
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		router.get("/getJobByName", function (request, response) {
			let jobSchedulerService = new JobSchedulerService();

			jobSchedulerService.getJobByName(request).then(function (result) {
				response.type("application/json").status(200).send(JSON.stringify(result));
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		router.post("/addNewSchedule", function (request, response) {
			let jobSchedulerService = new JobSchedulerService();

			jobSchedulerService.addNewSchedule(request).then(function (result) {
				response.type("application/json").status(200).send(JSON.stringify(result));
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}
exports.JobSchedulerRouter = module.exports.JobSchedulerRouter = JobSchedulerRouter;
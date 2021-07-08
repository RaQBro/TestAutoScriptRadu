/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");
const helpers = require(global.appRoot + "/lib/util/helpers");
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;
const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js").Service;
const JobSchedulerService = require(global.appRoot + "/lib/routerService/jobSchedulerService.js").JobScheduler;

class ExtensibilityRouter {

	constructor() {

		var router = express.Router();

		// common function before all routes are processed
		router.use(function (request, response, next) {
			next();
		});

		router.get("/getAllProjects", function (request, response) {

			let extensibilityService = new ExtensibilityService(request);

			extensibilityService.getAllProjects(request, response)
				.catch(function (err) {
					let oPlcException = PlcException.createPlcException(err);
					response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
				});

		});

		router.post("/maintainDefaultValues", function (request, response) {

			let extensibilityService = new ExtensibilityService(request);

			extensibilityService.maintainDefaultValues(request, response)
				.then(function (resp) {
					response.send(resp);
				}).catch(function (err) {
					response.send(err);
				});
		});

		router.get("/exampleService", function (request, response) {

			require(global.appRoot + "/lib/exampleService")
				.doService(request, response)
				.then(function () {
					if (helpers.isRequestFromJob(request)) {
						let jobSchedulerService = new JobSchedulerService();
						jobSchedulerService.updateRunLogOfSchedule(request, {
							success: true,
							message: "Completed with success!"
						});
					}
				})
				.catch(function (err) {
					let oPlcException = PlcException.createPlcException(err);
					if (helpers.isRequestFromJob(request)) {
						let jobSchedulerService = new JobSchedulerService();
						jobSchedulerService.updateRunLogOfSchedule(request, {
							success: false,
							message: oPlcException.message
						});
					} else {
						response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
					}
				});

			// return special header to jobscheduler to know that it's async job run
			// response.status(202).send("ACCEPTED");

		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}
exports.ExtensibilityRouter = module.exports.ExtensibilityRouter = ExtensibilityRouter;
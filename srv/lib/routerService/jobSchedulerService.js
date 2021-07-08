/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");
const xsenv = require("@sap/xsenv");
const jobsc = require("@sap/jobs-client");

const oConfig = require(global.appRoot + "/config.js").oConfig;
const aConfigJobs = require(global.appRoot + "/config.js").aJobs;

const helpers = require(global.appRoot + "/lib/util/helpers");
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser").TechnicalUser;

const Code = require(global.appRoot + "/lib/util/message").Code;
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;

class JobScheduler {

	// constructor
	constructor() {

		// setup connection to job scheduler REST API
		let jobOptions = xsenv.getServices({
			jobs: {
				tag: "jobscheduler"
			}
		});
		let schedulerOptions = {
			baseURL: jobOptions.jobs.url,
			user: jobOptions.jobs.user,
			password: jobOptions.jobs.password,
			timeout: 15000
		};

		this.scheduler = new jobsc.Scheduler(schedulerOptions);

	}

	getAllJobs() {
		var that = this;
		return new Promise(function (resolve, reject) {
			let oJob = {};
			that.scheduler.fetchAllJobs(oJob, (error, result) => {
				if (error) {
					// console.log("Error fetching jobs: %s", error);
					reject(error);
				} else {
					// console.log("OK fetching jobs: %s", result);
					resolve(result);
				}
			});
		});
	}

	getJobByName(request) {

		let sJobName = request.query.JOB_NAME;

		var that = this;
		return new Promise(function (resolve, reject) {
			if (sJobName === undefined) {
				let sDeveloperInfo = "Please provide URL parameter JOB_NAME. E.g.: ?JOB_NAME=template_application_job";
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
			}
			let oJob = {
				name: sJobName
			};
			that.scheduler.fetchJob(oJob, (error, result) => {
				if (error) {
					// console.log("Error fetching job: %s", error);
					reject(error);
				} else {
					// console.log("OK fetching job: %s", result);
					resolve(result);
				}
			});
		});
	}

	async addNewSchedule(request) {

		// check if user is maintained into default values table (user added into default values table when is added into secure store)
		let technicalUser = new TechnicalUser();
		let sTechnicalUser = await technicalUser.getTechnicalFromDefaultValuesTable();
		if (helpers.isUndefinedNullOrEmptyObject(sTechnicalUser)) {
			let sDeveloperInfo = "Please provide a technical user into administration section of application!";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
		}

		let iJobId = request.query.JOB_ID;
		let oNewSchedule = request.body;

		var that = this;
		return new Promise(function (resolve, reject) {
			if (iJobId === undefined) {
				let sDeveloperInfo = "Please provide URL parameter JOB_ID. E.g.: ?JOB_ID=10";
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
			}
			if (oNewSchedule === undefined) {
				let sDeveloperInfo = "Please provide the request body with job schedule.";
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
			}
			let oJob = {
				jobId: iJobId,
				schedule: oNewSchedule
			};
			that.scheduler.createJobSchedule(oJob, (error, result) => {
				if (error) {
					// console.log("Error adding new job schedule: %s", error);
					reject(error);
				} else {
					// console.log("OK new job schedule job: %s", result);
					resolve(result);
				}
			});
		});
	}

	updateRunLogOfSchedule(request, oData) {

		var iJobId = request.headers["x-sap-job-id"];
		var iScheduleId = request.headers["x-sap-job-schedule-id"];
		var iRunId = request.headers["x-sap-job-run-id"];

		if (iJobId === undefined || iScheduleId === undefined || iRunId === undefined || oData === undefined) {
			console.log("Error update run log: Please provide request and oData parameters!");
		}

		let oJob = {
			jobId: iJobId,
			scheduleId: iScheduleId,
			runId: iRunId,
			data: oData
		};

		this.scheduler.updateJobRunLog(oJob, (error, result) => {
			if (error) {
				console.log("Error update job run log: %s", error);
			} else {
				// console.log("OK update job run log: %s", result);
			}
		});
	}

	createJobs() {

		if (oConfig.CreateJobsAutomatically === false) {
			return;
		}
		var that = this;
		// get the full URI of this app
		var thisApp = JSON.parse(process.env.VCAP_APPLICATION);
		var thisAppURI = thisApp.full_application_uris[0];

		_.each(aConfigJobs, function (oJobDetails) {
			let oJobToFind = {
				name: oJobDetails.name
			};
			// check if job exists
			that.scheduler.fetchJob(oJobToFind, (error, result) => {
				if (error) {
					if (error.statusCode === 404) { // now found => create job
						// add the full URI of app to action
						oJobDetails.action = thisAppURI + oJobDetails.action;
						var oJobToCreate = {
							job: oJobDetails
						};
						that.scheduler.createJob(oJobToCreate, function (err, body) {
							if (err) {
								console.log(`Error while creating job with name ${oJobDetails.name}: `, err);
							} else {
								console.log(`Job with name ${oJobDetails.name} created with success!`); //, body);
							}
						});
					} else {
						console.log(`Error getting job with name ${oJobDetails.name}: `, error);
					}
				} else {
					console.log(`Job with name ${oJobDetails.name} already exists!`); //, result);
				}
			});
		});
	}

}
exports.JobScheduler = module.exports.Service = JobScheduler;
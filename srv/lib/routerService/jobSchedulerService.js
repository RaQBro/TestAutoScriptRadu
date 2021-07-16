/*eslint-env node, es6 */
"use strict";

const xsenv = require("@sap/xsenv");
const jobsc = require("@sap/jobs-client");

/**
 * @fileOverview
 * 
 * List of all service implementations of Job Scheduler Routes
 * 
 * @name jobSchedulerService.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js").JobSchedulerUtil;
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser.js").TechnicalUserUtil;

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Code = MessageLibrary.Code;
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

/** @class
 * @classdesc Job scheduler services
 * @name JobSchedulerService 
 */
class JobSchedulerService {

	/** @constructor
	 * Is getting the jobSceduler service and setup connection to job scheduler REST API
	 */
	constructor() {

		const jobOptions = xsenv.getServices({
			jobs: {
				tag: "jobscheduler"
			}
		});
		const schedulerOptions = {
			baseURL: jobOptions.jobs.url,
			user: jobOptions.jobs.user,
			password: jobOptions.jobs.password,
			timeout: 15000
		};

		this.Scheduler = new jobsc.Scheduler(schedulerOptions);
		this.JobSchedulerUtil = new JobScheduler();
	}

	/** @function
	 * Used to get all existing background jobs from job scheduler dashboard
	 * 
	 * @return {object} result / error - list of jobs / the error
	 */
	async getAllJobs() {
		var that = this;
		return new Promise(function (resolve, reject) {
			const oJob = {};
			that.Scheduler.fetchAllJobs(oJob, (error, result) => {
				if (error) {
					const sDeveloperInfo = "Failed to get all existing background jobs.";
					const oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
					reject(oPlcException);
				} else {
					const oMessage = new Message("All existing background jobs retrieved with success!", result);
					resolve(oMessage);
				}
			});
		});
	}

	/** @function
	 * Used to get a job by name
	 * 
	 * @param {string} sJobName - job name
	 * @return {object} result / error - the job / the error
	 */
	async getJobByName(sJobName) {

		if (helpers.isUndefinedNullOrEmptyString(sJobName)) {
			const sDeveloperInfo = "Please provide URL parameter JOB_NAME. E.g.: ?JOB_NAME=template_application_job";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}

		var that = this;
		return new Promise(function (resolve, reject) {
			const oJob = {
				name: sJobName
			};
			that.Scheduler.fetchJob(oJob, (error, result) => {
				if (error) {
					const sDeveloperInfo = `Failed to get job with name '${sJobName}'.`;
					const oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
					reject(oPlcException);
				} else {
					const oMessage = new Message(`Job with name '${sJobName}' retrieved with success!`, result);
					resolve(oMessage);
				}
			});
		});
	}

	/** @function
	 * Used to create a new schedule for a job 
	 * Checks if user is maintained into default values table (user added into default values table when is added into secure store)
	 * 
	 * @param {integer} iJobId - job id
	 * @param {object} oNewSchedule - schedule data
	 * @return {object} result / error - the added schedule / the error
	 */
	async addNewSchedule(iJobId, oNewSchedule) {

		const TechnicalUserUtil = new TechnicalUser();
		const sTechnicalUser = await TechnicalUserUtil.getTechnicalUserFromTable();
		if (helpers.isUndefinedOrNull(sTechnicalUser)) {
			const sDeveloperInfo = "Please provide a technical user into administration section of application!";
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sDeveloperInfo);
		}

		if (helpers.isUndefinedNullOrEmptyString(iJobId)) {
			const sDeveloperInfo = "Please provide URL parameter JOB_ID. E.g.: ?JOB_ID=123";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}

		if (helpers.isUndefinedNullOrEmptyObject(oNewSchedule)) {
			const sDeveloperInfo = "Please provide the request body with job schedule.";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}

		var that = this;
		return new Promise(function (resolve, reject) {
			const oJob = {
				jobId: iJobId,
				schedule: oNewSchedule
			};
			that.Scheduler.createJobSchedule(oJob, (error, result) => {
				if (error) {
					const sDeveloperInfo = `Failed to add new schedule to job with ID '${iJobId}'.`;
					const oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
					reject(oPlcException);
				} else {
					const oMessage = new Message(`New schedule for job with ID '${iJobId}' added with success!`, result);
					resolve(oMessage);
				}
			});
		});
	}

	/** @function
	 * Used to create new schedules for a job 
	 * 
	 * @param {integer} iJobId - job id
	 * @param {object} oRequestBody - request body
	 * @return {object} result / error - the added schedule / the error
	 */
	async addSchedules(iJobId, oRequestBody) {

		const TechnicalUserUtil = new TechnicalUser();
		const sTechnicalUser = await TechnicalUserUtil.getTechnicalUserFromTable();
		if (helpers.isUndefinedOrNull(sTechnicalUser)) {
			const sDeveloperInfo = "Please provide a technical user into administration section of application!";
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sDeveloperInfo);
		}

		if (helpers.isUndefinedNullOrEmptyString(iJobId)) {
			const sDeveloperInfo = "Please provide URL parameter JOB_ID. E.g.: ?JOB_ID=123";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}

		if (helpers.isUndefinedNullOrEmptyObject(oRequestBody)) {
			const sDeveloperInfo = "Please provide a request body containing PROJECT_ID, CALCULATION_ID or CALCULATION_VERSION_ID.";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}

		const aProjects = oRequestBody.PROJECT_ID;
		const aCalculations = oRequestBody.CALCULATION_ID;
		const aVersions = oRequestBody.CALCULATION_VERSION_ID;

		if (helpers.isUndefinedNullOrEmptyString(aProjects) && helpers.isUndefinedNullOrEmptyString(aCalculations) && helpers.isUndefinedNullOrEmptyString(
				aVersions)) {
			const sDeveloperInfo = "Please provide in request body values for PROJECT_ID, CALCULATION_ID or CALCULATION_VERSION_ID.";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}

		var aSchedules = [];
		var iNumberOfSchedules = 0;
		const aBusinessObjects = ["PROJECT_ID", "CALCULATION_ID", "CALCULATION_VERSION_ID"];

		// get the ids splitted into smaller arrays 
		const oSplittedIds = await this.JobSchedulerUtil.splittIdsIntoSmallArrays(oRequestBody);

		for (const sBusinessObject of aBusinessObjects) {
			for (const aSelectedIds of oSplittedIds[sBusinessObject]) {

				var oSchedule = {
					"description": "Job scheduled on-demand",
					"type": "one-time",
					"data": {},
					"active": true,
					"time": helpers.nowPlusSecondstoISOString(5)

				};
				// add ids as body data request to schedule
				oSchedule.data[sBusinessObject] = aSelectedIds;
				// add new schedule
				const oNewSchedule = await this.addNewSchedule(iJobId, oSchedule);
				aSchedules.push(oNewSchedule);
				iNumberOfSchedules++;
			}
		}

		return new Message(`The number of added new schedules is: ${iNumberOfSchedules}.`, aSchedules);
	}

}
exports.JobSchedulerService = module.exports.JobSchedulerService = JobSchedulerService;
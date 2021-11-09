/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");
const xsenv = require("@sap/xsenv");
const jobsc = require("@sap/jobs-client");

/**
 * @fileOverview
 * 
 * Helper functions used to:
 *		- create dynamically the jobs at first run of server.js
 *		- get the value of CREATE_JOBS_AUTOMATICALLY from configuration table
 *  	- update the job run log after execution
 *		- update the job log entry from table with service response body
 *		- generate a an autoincrement JOB_ID based on the existing ids
 *		- set JOB_ID and JOB_TIMESTAMP to request
 * 
 * @name jobScheduler.js
 */

const aConfigJobs = require(global.appRoot + "/config.js").aJobs;
const helpers = require(global.appRoot + "/lib/util/helpers.js");

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser.js").TechnicalUserUtil;

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;

/** @class
 * @classdesc Job scheduler utility helpers
 * @name JobSchedulerUtil 
 */
class JobSchedulerUtil {

	/** @constructor
	 * Is getting the jobSceduler service and setup connection to job scheduler REST API
	 */
	constructor() {

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

		this.Scheduler = new jobsc.Scheduler(schedulerOptions);

	}

	/** @function
	 * Called from server.js and is used to create dynamically the jobs defined into the config.js file
	 * The jobs are created only if CREATE_JOBS_AUTOMATICALLY = true
	 * It's searching for the job(s) after the name, if does not exists the jobs are created
	 * 
	 * @return {undefined} undefined - If CREATE_JOBS_AUTOMATICALLY = not found / false the value undefined is returned
	 */
	async createJobs() {

		// check if jobs needs to be created
		let bCreateJobsAutomatically = await this.getCreateJobsAutomaticallyFromConfigurationTable();
		if (bCreateJobsAutomatically !== true) {
			return;
		}
		let that = this;

		// get the full URI of this app
		let thisApp = JSON.parse(process.env.VCAP_APPLICATION);
		let thisAppURI = thisApp.full_application_uris[0];

		// loop over all jobs defined into config.js
		_.each(aConfigJobs, function (oJobDetails) {
			let oJobToFind = {
				name: oJobDetails.name
			};
			// check if job exists
			that.Scheduler.fetchJob(oJobToFind, (error, result) => {
				if (error) {
					if (error.statusCode === 404) { // now found => create job
						// add the full URI of app to action
						oJobDetails.action = thisAppURI + oJobDetails.action;
						let oJobToCreate = {
							job: oJobDetails
						};
						// create job
						that.Scheduler.createJob(oJobToCreate, function (err, body) {
							if (err) {
								Message.addLog(0, `Error while creating job with name '${oJobDetails.name}'.`, "error", err);
							} else {
								Message.addLog(0, `Job with name '${oJobDetails.name}' created with success!`, "message", body);
							}
						});
					} else {
						Message.addLog(0, `Error getting job with name '${oJobDetails.name}'.`, "error", error);
					}
				} else {
					Message.addLog(0, `Job with name '${oJobDetails.name}' already exists!`, "message", result);
				}
			});
		});
	}

	/** @function
	 * Used to retrieve from t_configuration the value of CREATE_JOBS_AUTOMATICALLY
	 * 
	 * @default bCreateJobsAutomatically = null
	 * @return {boolean/null} bCreateJobsAutomatically - true / false
	 *		If CREATE_JOBS_AUTOMATICALLY not found the default value is returned
	 */
	async getCreateJobsAutomaticallyFromConfigurationTable() {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				select * from "sap.plc.extensibility::template_application.t_configuration"
				where FIELD_NAME = 'CREATE_JOBS_AUTOMATICALLY';
			`
		);
		let aResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		let aCreateJobsAutomatically = aResults.slice();

		let bCreateJobsAutomatically = null;
		if (aCreateJobsAutomatically.length === 1) {
			if (aCreateJobsAutomatically[0].FIELD_VALUE === "true") {
				bCreateJobsAutomatically = true;
			} else if (aCreateJobsAutomatically[0].FIELD_VALUE === "false") {
				bCreateJobsAutomatically = false;
			}
		}
		return bCreateJobsAutomatically;
	}

	/** @function
	 * Used to update the job run log. The entry is visible into job dashboard
	 * Is required to be called this function after the job action was executed with success / error
	 * Add service response body to job log entry
	 * 
	 * @param {object} request - job request
	 * @param {integer} iResponseStatusCode - job response status code
	 * @param {object} oServiceResponseBody - job service response body
	 */
	updateRunLogOfSchedule(request, iResponseStatusCode, oServiceResponseBody) {

		let iSapJobId = request.headers["x-sap-job-id"] === undefined ? null : request.headers["x-sap-job-id"];
		let iSapScheduleId = request.headers["x-sap-job-schedule-id"] === undefined ? null : request.headers["x-sap-job-schedule-id"];
		let iSapRunId = request.headers["x-sap-job-run-id"] === undefined ? null : request.headers["x-sap-job-run-id"];

		let bWithSuccess = true;
		let sMessageInfo = `Job with ID '${request.JOB_ID}' completed with success!`;

		if (request.IS_ONLINE_MODE && (!helpers.isRequestFromJob(request) || iResponseStatusCode === undefined || oServiceResponseBody ===
				undefined)) {
			sMessageInfo = "Error update run log: Please provide request, response status code and response body as parameters!";
			bWithSuccess = false;
		}

		let oScheduleData = {
			success: bWithSuccess,
			message: sMessageInfo
		};

		if (bWithSuccess === true) {
			// check response status code
			if (iResponseStatusCode !== 200) {
				oScheduleData.success = false;
				if (oServiceResponseBody.message !== undefined) {
					oScheduleData.message = `Error in job with ID '${request.JOB_ID}': ` + oServiceResponseBody.message;
				} else {
					oScheduleData.message = `Unexpected error occurred in job with ID '${request.JOB_ID}'.`;
				}
			}
		}

		let oJob = {
			jobId: iSapJobId,
			scheduleId: iSapScheduleId,
			runId: iSapRunId,
			data: oScheduleData
		};

		this.Scheduler.updateJobRunLog(oJob, (error) => { // , result
			if (error) {
				Message.addLog(request.JOB_ID, "Error at update job run log!", "error", error);
			} else {
				// Message.addLog(request.JOB_ID, "Job run log updated with success!", "message", result);
			}
		});
	}

	/** @function
	 * Used to write an entry into t_job_log table
	 * 
	 * @param {object} request - web request / job request
	 */
	async insertJobLogEntryIntoTable(request) {

		if (request.JOB_ID === undefined) {
			return;
		}

		let iSapJobId = request.headers["x-sap-job-id"] === undefined ? null : request.headers["x-sap-job-id"];
		let iSapScheduleId = request.headers["x-sap-job-schedule-id"] === undefined ? null : request.headers["x-sap-job-schedule-id"];
		let iSapRunId = request.headers["x-sap-job-run-id"] === undefined ? null : request.headers["x-sap-job-run-id"];

		let sJobName = request.originalUrl === undefined ? null : request.originalUrl;
		let sRequestBody = request.body === undefined ? null : JSON.stringify(request.body);

		let sUserId = null;
		let iWebRequest = null;

		if (request.IS_ONLINE_MODE === true && !helpers.isRequestFromJob(request)) {
			sUserId = request.user.id.toUpperCase();
			iWebRequest = 1;
		} else {
			let TechnicalUserUtil = new TechnicalUser();
			sUserId = await TechnicalUserUtil.getTechnicalUserFromTable();
			if (helpers.isUndefinedOrNull(sUserId)) {
				let sDeveloperInfo = "Please provide a technical user into administration section of application!";
				let oPlcException = new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sDeveloperInfo);

				return oPlcException;
			}
			iWebRequest = 0;
		}

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
				insert into "sap.plc.extensibility::template_application.t_job_log"
				( START_TIMESTAMP, END_TIMESTAMP, JOB_ID, JOB_NAME, JOB_STATUS, USER_ID, IS_ONLINE_MODE, REQUEST_BODY, RESPONSE_BODY, SAP_JOB_ID, SAP_JOB_SCHEDULE_ID, SAP_JOB_RUN_ID )
				values ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? );
			`
		);
		await connection.statementExecPromisified(statement, [
			request.JOB_TIMESTAMP, null, request.JOB_ID, sJobName, "Running", sUserId, iWebRequest,
			sRequestBody, null, iSapJobId, iSapScheduleId, iSapRunId
		]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	}

	/** @function
	 * Used to update the job log entry from t_job_log table with the service respone body of executed job
	 * 
	 * @param {object} request - web request / job request
	 * @param {object} oServiceResponseBody - service response body
	 */
	async updateJobLogEntryFromTable(request, iResponseStatusCode, oServiceResponseBody) {

		if (request.JOB_ID === undefined || request.JOB_TIMESTAMP === undefined || oServiceResponseBody === undefined) {
			return;
		}

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let sJobStatus = null;
		if (iResponseStatusCode === 200) {
			sJobStatus = await this.generateJobStatus(request.JOB_ID);
		} else {
			sJobStatus = "Error";
		}
		let sResponseBody = oServiceResponseBody === undefined ? null : JSON.stringify(oServiceResponseBody);

		let statement = await connection.preparePromisified(
			`
				update "sap.plc.extensibility::template_application.t_job_log"
				set RESPONSE_BODY = ?, JOB_STATUS = ?, END_TIMESTAMP = CURRENT_UTCTIMESTAMP where START_TIMESTAMP = ?;
			`
		);

		await connection.statementExecPromisified(statement, [sResponseBody, sJobStatus, request.JOB_TIMESTAMP]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	}

	/** @function
	 * Used to get all messages of one job
	 * 
	 * @param {integer} iJobId - the job id
	 * @return {array} aMessages - the messages from the job
	 */
	async getMessagesOfJobWithId(iJobId) {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
				select * from "sap.plc.extensibility::template_application.t_messages"
				where JOB_ID = ?;
			`
		);
		let aMessages = await connection.statementExecPromisified(statement, [iJobId]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		return aMessages.slice();
	}

	/** @function
	 * Used to generate the job status. Success if no errors / Done if completed with errors
	 * 
	 * @param {integer} iJobId - the job id
	 * @return {string} sJobStatus - Success / Done
	 */
	async generateJobStatus(iJobId) {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
				select count(*) as COUNT from "sap.plc.extensibility::template_application.t_messages"
				where SEVERITY = 'Error' and JOB_ID = ?;
			`
		);
		let aResultCount = await connection.statementExecPromisified(statement, [iJobId]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		return parseInt(aResultCount[0].COUNT, 10) > 0 ? "Done" : "Success";
	}

	/** @function
	 * Used to generate JOB_ID, JOB_TIMESTAMP, IS_ONLINE_MODE, USER_ID and set as properties in request object
	 * JOB_TIMESTAMP used to update the log entry with service response body
	 * USER_ID contains the request user id or the technical user
	 * JOB_ID is used in t_messages and t_job_log tables
	 * JOB_ID value: Negative if online mode / Positive if job (real or fake)
	 * IS_ONLINE_MODE value: undefined or true if web request / false if job (real or fake)
	 * A fake job is actually a web request that is returning the JOB_ID on the response (in order to avoid session timeout)
	 * and continue execution of the service afterwards
	 * 
	 * @param {object} request - web request / job request
	 * @return {integer} iJobId - the generated job id / undefined if IS_ONLINE_MODE undefined
	 */
	async generateJobIdAndJobTimestampAndJobType(request) {

		let iJobId;
		let iWebRequest;

		if (helpers.isRequestFromJob(request)) {
			// background job
			iWebRequest = 0;
		} else {
			// online mode
			if (request.query.IS_ONLINE_MODE === undefined || request.query.IS_ONLINE_MODE === "") {
				iWebRequest = 1;
			} else {
				if (request.query.IS_ONLINE_MODE === false || request.query.IS_ONLINE_MODE === "false") {
					// fake background job
					iWebRequest = 0;
				} else {
					// online mode
					iWebRequest = 1;
				}
			}
		}

		// set IS_ONLINE_MODE to request
		request.IS_ONLINE_MODE = iWebRequest === 1 ? true : false;

		// do not generate a JOB_ID if parameter IS_ONLINE_MODE is not defined
		if (iWebRequest === 0 || request.query.IS_ONLINE_MODE !== undefined && request.query.IS_ONLINE_MODE !== "") {
			let hdbClient = await DatabaseClass.createConnection();
			let connection = new DatabaseClass(hdbClient);

			if (iWebRequest === 1) {
				let statement = await connection.preparePromisified(
					`
					select MIN("JOB_ID") as LAST_NEGATIVE_JOB_ID from "sap.plc.extensibility::template_application.t_job_log"
				`
				);
				let aResults = await connection.statementExecPromisified(statement, []);
				let aJobIds = aResults.slice();
				if (aJobIds[0].LAST_NEGATIVE_JOB_ID === null || aJobIds[0].LAST_NEGATIVE_JOB_ID > 0) {
					iJobId = -1;
				} else {
					iJobId = parseInt(aJobIds[0].LAST_NEGATIVE_JOB_ID) - 1;
				}
			} else {
				let statement = await connection.preparePromisified(
					`
					select MAX("JOB_ID") as LAST_POSITIVE_JOB_ID from "sap.plc.extensibility::template_application.t_job_log"
				`
				);
				let aResults = await connection.statementExecPromisified(statement, []);
				let aJobIds = aResults.slice();
				if (aJobIds[0].LAST_POSITIVE_JOB_ID === null || aJobIds[0].LAST_POSITIVE_JOB_ID < 0) {
					iJobId = 1;
				} else {
					iJobId = parseInt(aJobIds[0].LAST_POSITIVE_JOB_ID) + 1;
				}
			}

			// get current timestamp
			let statement = await connection.preparePromisified(
				`
				select CURRENT_UTCTIMESTAMP from dummy;
			`
			);
			let aResults = await connection.statementExecPromisified(statement, []);
			let aCurrentTimestamp = aResults.slice();

			hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

			// set USER_ID to request
			if ((request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === true) || request.user.id !== undefined) {
				request.USER_ID = request.user.id.toUpperCase();
			} else {
				request.USER_ID = global.TECHNICAL_USER; // technical user
			}

			// set JOB_TIMESTAMP to request
			request.JOB_TIMESTAMP = aCurrentTimestamp[0].CURRENT_UTCTIMESTAMP;

			// set JOB_ID to request
			request.JOB_ID = iJobId;
		}

		return iJobId;
	}

	/** @function
	 * 
	 * Used to split an array of Project/Calculation/Version IDs into multiple small arrays
	 * The number of elements of arrays are retrieved from default values
	 * 
	 * @param {object} request - request data
	 * @return {integer} iJobId - the generated job id
	 */
	async splittIdsIntoSmallArrays(oRequestBody) {

		let oReturnIds = {
			"PROJECT_ID": [],
			"CALCULATION_ID": [],
			"CALCULATION_VERSION_ID": []
		};
		let aBusinessObjects = [{
			"BUSINESS_OBJECT": "PROJECT_ID",
			"VALUE": "NUMBER_OF_PROJECTS"
		}, {
			"BUSINESS_OBJECT": "CALCULATION_ID",
			"VALUE": "NUMBER_OF_CALCULATIONS"
		}, {
			"BUSINESS_OBJECT": "CALCULATION_VERSION_ID",
			"VALUE": "NUMBER_OF_VERSIONS"
		}];

		// get from configuration the maximum number of ids from one array
		let aDefaultValues = await helpers.getAllDefaultValues();

		for (let oBusinessObject of aBusinessObjects) {
			let aAllIds = [];
			if (oRequestBody[oBusinessObject.BUSINESS_OBJECT] !== undefined && oRequestBody[oBusinessObject.BUSINESS_OBJECT].length > 0) {
				aAllIds = oRequestBody[oBusinessObject.BUSINESS_OBJECT];
			}
			let oDefaultValue = _.find(aDefaultValues, function (oValue) {
				return oValue.FIELD_NAME === oBusinessObject.VALUE;
			});
			if (!helpers.isUndefinedNullOrEmptyObject(oDefaultValue)) {
				oReturnIds[oBusinessObject.BUSINESS_OBJECT] = helpers.chunkIntoSmallArrays(aAllIds, parseInt(oDefaultValue.FIELD_VALUE));
			} else {
				// if the maximum number of ids does not exist into default values all ids are handled into one job
				oReturnIds[oBusinessObject.BUSINESS_OBJECT] = aAllIds;
			}
		}

		return oReturnIds;
	}

}
exports.JobSchedulerUtil = module.exports.JobSchedulerUtil = JobSchedulerUtil;
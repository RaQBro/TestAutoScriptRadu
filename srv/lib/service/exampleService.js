/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");

/**
 * @fileOverview
 * 
 * Example service containing sections for:
 *		- global constants and variables
 *		- custom functions
 *		- custom business logic
 * 
 * @name exampleService.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");
const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js");

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

const sProjectType = MessageLibrary.PlcObjects.Project;
const sCalculationType = MessageLibrary.PlcObjects.Calculation;
const sVersionType = MessageLibrary.PlcObjects.Version;

const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js");
const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js");

const sOperation = "Dummy Operation"; // operation of the service / job

/** @function
 * Used to execute the custom business logic
 */
function doService() {

	// --------------------- Global Constants and Variables ---------------------
	let iJobId;
	let iStatusCode = 200; // service response code
	let oServiceResponseBody = {}; // service response body

	let StandardPlcService;
	let ExtensibilityPlcService;
	let JobSchedulerUtil = new JobScheduler();

	let sLanguage = "EN";

	// ------------------------- Start Functions List ---------------------------

	this.getFirstProject = async function () {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
				select TOP 1 PROJECT_ID from "sap.plc.db::basis.t_project";
			`
		);

		let aProjectResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
		let aProjects = aProjectResults.slice();

		return _.pluck(aProjects, "PROJECT_ID");
	};

	function getDateByPattern(sPattern) {

		function addZero(i) {
			if (i < 10) {
				i = "0" + i;
			}
			return i;
		}

		let dDate = new Date();
		let iYear = dDate.getFullYear();
		let sMonth = addZero(dDate.getMonth() + 1);
		let sDate = addZero(dDate.getDate());
		let sHours = addZero(dDate.getHours());
		let sMinutes = addZero(dDate.getMinutes());
		let sSeconds = addZero(dDate.getSeconds());

		let sCurrentDate = "";
		switch (sPattern) {
		case "YYYYMMDD hh:mm:ss":
			sCurrentDate = iYear + "" + sMonth + "" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
			break;
		case "YYYYMMDD":
			sCurrentDate = iYear + "" + sMonth + "" + sDate;
			break;
		case "DD.MM.YYYY hh:mm:ss":
			sCurrentDate = sDate + "." + sMonth + "." + iYear + " " + sHours + ":" + sMinutes + ":" + sSeconds;
			break;
		case "DD.MM.YYYY":
			sCurrentDate = sDate + "." + sMonth + "." + iYear;
			break;
		case "YYYY/MM/DD hh:mm:ss":
			sCurrentDate = iYear + "/" + sMonth + "/" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
			break;
		case "YYYY/MM/DD":
			sCurrentDate = iYear + "/" + sMonth + "/" + sDate;
			break;
		case "YYYY-MM-DD hh:mm:ss":
			sCurrentDate = iYear + "-" + sMonth + "-" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
			break;
		case "YYYY-MM-DD":
			sCurrentDate = iYear + "-" + sMonth + "-" + sDate;
			break;
		case "YYYY-MM[-1]":
			sCurrentDate = iYear + "-" + addZero(dDate.getMonth());
			break;
		default:
			sCurrentDate = iYear + "" + sMonth + "" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
			break;
		}

		return sCurrentDate;
	}

	this.executeLogic = async function () {

		let oVersion = await StandardPlcService.openCalculationVersion(1);

		await helpers.sleep(5000);

		if (oVersion !== undefined) {
			await StandardPlcService.closeCalculationVersion(1);
		}

		let aStatus = await StandardPlcService.getStatuses();
		oServiceResponseBody.STATUS = aStatus;
	};

	// -------------------------- End Functions List ----------------------------

	/** @function
	 * Used to execute the service as a background job (real or fake) or as web request (online mode)
	 * Only fake jobs (IS_ONLINE_MODE === false) can be added to the job queue:
	 *		- the job is not executed if another job is currently running (status "Running")
	 *		- at the beginnig of execution the first pending job is retrieved from the queue (status "Pending")
	 *		- could be the case that an older job to be executed instead of the current one
	 *		- the job status is updated at the end of the execution (the job log entry from t_job_log or the run log of the schedule)
	 *		- at the end of the execution the next pending job is retrieved from the queue (status "Pending")
	 *		- no service response is returned for background mode
	 * A real job is executed immediately and no service response is returned
	 * For onlime mode the service response is returned
	 * 
	 * In case of thrown error / unexpected error the corresponding status code is added to response
	 * The error is returned as service response body for online mode (IS_ONLINE_MODE === false or undefined)
	 * 
	 * @return {object} oServiceResponseBody - the example service response body
	 *		"STATUS_CODE" - response status code
	 *		"IS_ONLINE_MODE" - service mode execution
	 *		"SERVICE_RESPONSE" - service response body
	 */
	this.execute = async function (request) {

		let bRunningJobs = false;

		iJobId = request.JOB_ID; // add job id to global variable
		StandardPlcService = new StandardPlcDispatcher(request, sOperation);
		ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

		try {

			if (request.IS_ONLINE_MODE === false) { // only for fake jobs
				// check if running jobs exists
				bRunningJobs = await JobSchedulerUtil.checkRunningJobs();
				if (bRunningJobs === true) {
					// stop this execution
					return undefined;
				}
			}

			// update job status to running
			await JobSchedulerUtil.setJobStatusToRunning(request);

			let sMessageInfo = `Job with ID '${iJobId}' started!`;
			await Message.addLog(iJobId, sMessageInfo, "message", undefined, sOperation);

			// ------------------------- Start Business Logic ---------------------------

			/**
			 * Example how to get the data added into the new schedule (e.g. from config.js "data": {"TEST_KEY":"TEST_VALUE"} )
			 */

			// if (helpers.isRequestFromJob(request)) {
			// 	if (request.method === "GET" || request.method === "DELETE") {
			// 		let oTestValue = request.query.TEST_KEY;
			// 		console.log("oTestValue: " + oTestValue);  // "TEST_VALUE"
			// 	} else if (request.method === "PUT" || request.method === "POST") {
			// 		let oBodyRequest = request.body;
			// 		console.log("oBodyRequest: " + JSON.stringify(oBodyRequest)); // {"TEST_KEY":"TEST_VALUE"} 
			// 	}
			// }

			let bActiveSession = false;
			let bValidSession = await ExtensibilityPlcService.checkPlcSession();

			if (bValidSession) {
				bActiveSession = true;
			} else {
				let oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);

				if (oInitPlcSession !== undefined) {
					let sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
					oServiceResponseBody.CURRENT_USER = sCurrentUser;
					await Message.addLog(iJobId, `PLC session open for user ${sCurrentUser}.`, "info", undefined, sOperation);
					bActiveSession = true;
				}
			}

			if (bActiveSession) {

				await this.executeLogic();
			}

			let sCurrentDate = getDateByPattern("DD.MM.YYYY hh:mm:ss");
			oServiceResponseBody.CURRENT_DATE = sCurrentDate;

			let sProjectId = await this.getFirstProject();
			oServiceResponseBody.PROJECT_ID = sProjectId;

			await Message.addLog(iJobId,
				"Example how to add a message having project as PLC object type and PLC object id.",
				"message", undefined, sOperation, sProjectType, sProjectId);

			let iCalculationId = "100";
			await Message.addLog(iJobId,
				"Example how to add a message having calculation as PLC object type and PLC object id.",
				"message", undefined, sOperation, sCalculationType, iCalculationId);

			let iVersionId = "1000";
			await Message.addLog(iJobId,
				"Example how to add a message having version as PLC object type and PLC object id.",
				"message", undefined, sOperation, sVersionType, iVersionId);

			let aAllProject = await ExtensibilityPlcService.getAllProjects();
			oServiceResponseBody.PROJECT = aAllProject[0];

			await Message.addLog(iJobId,
				"Example how to add operation at the messages.",
				"message", undefined, sOperation);

			// -------------------------- End Business Logic ----------------------------
		} catch (err) {

			let oPlcException = await PlcException.createPlcException(err, iJobId, sOperation);
			iStatusCode = oPlcException.code.responseCode;
			oServiceResponseBody = oPlcException;

		} finally {

			if (bRunningJobs === false) { // if current job was executed

				// add service response body to job log entry
				await JobSchedulerUtil.updateJobLogEntryFromTable(request, iStatusCode, oServiceResponseBody);

				// write end of the job into t_messages only for jobs (fake or real)
				await Message.addLog(iJobId,
					`Job with ID '${iJobId}' ended!`,
					"message", undefined, sOperation);

				if (request.IS_ONLINE_MODE === false) { // only for fake jobs

					// get next pending job if exists
					let oNextPendingJob = await JobSchedulerUtil.getJobFromQueue();

					// check if pending job exists
					if (oNextPendingJob !== undefined) {

						// execute the pending job
						await this.execute(oNextPendingJob);
					}
				}
			}

			return {
				"STATUS_CODE": iStatusCode,
				"IS_ONLINE_MODE": request.IS_ONLINE_MODE,
				"SERVICE_RESPONSE": oServiceResponseBody
			};
		}
	};
}

doService.prototype = Object.create(doService.prototype);
doService.prototype.constructor = doService;

module.exports.doService = doService;
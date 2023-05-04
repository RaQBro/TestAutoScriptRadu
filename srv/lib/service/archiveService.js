/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Service used to logout technical user from PLC
 * 
 * @name logoutService.js
 */

const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js");
const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");
const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

const sOperation = "Archive Logs"; // operation of the service / job

/** @function
 * Used to execute the Archive Messages functionality
 */
function doService() {

	// --------------------- Global Constants and Variables ---------------------

	let iJobId; // job id
	let iStatusCode = 200; // service response code
	let oServiceResponseBody = {}; // service response body

	let JobSchedulerUtil = new JobScheduler();

	this.execute = async function (request) {

		iJobId = request.JOB_ID; // add job id to global variable

		try {

			let sMessageInfo = `Job with ID '${iJobId}' started!`;
			await Message.addLog(iJobId, sMessageInfo, "message", undefined, sOperation);

			// ------------------------- Start Business Logic ---------------------------

			let archiveDate = request.query.ARCHIVE_DATE;
			let hdbClient = await DatabaseClass.createConnection();
			let connection = new DatabaseClass(hdbClient);
			let hdbext = require("@sap/hdbext");

			let sp = await connection.loadProcedurePromisified(hdbext, null, "p_archive_logs");
			let output = await connection.callProcedurePromisified(sp, archiveDate);

			hdbClient.close();

			let iNumberOfArchivedEntries = output.outputScalar.EV_ARCHIVED_JOBS;

			await Message.addLog(iJobId, `The number of archived jobs is: ${iNumberOfArchivedEntries}`, "message", undefined, sOperation);

			// -------------------------- End Business Logic ----------------------------
		} catch (err) {

			let oPlcException = await PlcException.createPlcException(err, iJobId, sOperation);
			iStatusCode = oPlcException.code.responseCode;
			oServiceResponseBody = oPlcException;

		} finally {

			// add service response body to job log entry
			await JobSchedulerUtil.updateJobLogEntryFromTable(request, iStatusCode, oServiceResponseBody);

			// write end of the job into t_messages only for jobs (fake or real)
			await Message.addLog(iJobId,
				`Job with ID '${iJobId}' ended!`,
				"message", undefined, sOperation);

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

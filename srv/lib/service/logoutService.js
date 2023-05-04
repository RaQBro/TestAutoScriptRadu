/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Service used to logout technical user from PLC
 * 
 * @name logoutService.js
 */

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

const JobScheduler = require(global.appRoot + "/lib/util/jobScheduler.js");
const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js");

const sOperation = "Logout Technical User"; // operation of the service / job

/** @function
 * Used to execute the Logout Technical User functionality
 */
function doService() {

	// --------------------- Global Constants and Variables ---------------------
	let iJobId; // job id
	let iStatusCode = 200; // service response code
	let oServiceResponseBody = {}; // service response body

	let StandardPlcService;
	let JobSchedulerUtil = new JobScheduler();

	let sLanguage = "EN";

	this.execute = async function (request) {

		iJobId = request.JOB_ID; // add job id to global variable

		StandardPlcService = new StandardPlcDispatcher(request, sOperation);

		try {

			let sMessageInfo = `Job with ID '${iJobId}' started!`;
			await Message.addLog(iJobId, sMessageInfo, "message", undefined, sOperation);

			// ------------------------- Start Business Logic ---------------------------

			let oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);
			if (oInitPlcSession !== undefined) {

				let sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
				oServiceResponseBody.CURRENT_USER = sCurrentUser;

				let oLogoutFromPlc = await StandardPlcService.logoutPlcSession();
				if (oLogoutFromPlc !== undefined) {

					await Message.addLog(iJobId,
						`Technical user: ${sCurrentUser}!`,
						"message", undefined, sOperation);

				}
			}

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

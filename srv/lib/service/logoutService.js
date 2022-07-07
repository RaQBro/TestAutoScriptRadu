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

const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js");

const sOperation = "Logout Technical User"; // operation of the service / job

/** @function
 * Used to execute the custom business logic
 * In case of thrown error / unexpected error the corresponding status code is added to response
 * The error is returned as service response body
 * 
 * @param {object} request - web request / job request
 * @return {object} oServiceResponseBody - the service response body
 */
function doService(request) {

	// --------------------- Global Constants and Variables ---------------------
	let iStatusCode = 200; // service response code
	let oServiceResponseBody = {}; // service response body

	let StandardPlcService = new StandardPlcDispatcher(request, sOperation);

	let sLanguage = "EN";

	this.execute = async function () {

		try {
			// ------------------------- Start Business Logic ---------------------------

			let oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);
			if (oInitPlcSession !== undefined) {

				let sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
				oServiceResponseBody.CURRENT_USER = sCurrentUser;

				let oLogoutFromPlc = await StandardPlcService.logoutPlcSession();
				if (oLogoutFromPlc !== undefined) {

					await Message.addLog(request.JOB_ID,
						`Technical user: ${sCurrentUser}!`,
						"message", undefined, sOperation);

				}
			}

			// -------------------------- End Business Logic ----------------------------
		} catch (err) {
			let oPlcException = await PlcException.createPlcException(err, request.JOB_ID, sOperation);
			iStatusCode = oPlcException.code.responseCode;
			oServiceResponseBody = oPlcException;
		}
		return {
			"STATUS_CODE": iStatusCode,
			"SERVICE_RESPONSE": oServiceResponseBody
		};
	};
}

doService.prototype = Object.create(doService.prototype);
doService.prototype.constructor = doService;

module.exports.doService = doService;
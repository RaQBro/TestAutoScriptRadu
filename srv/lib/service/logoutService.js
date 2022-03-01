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
const PlcException = MessageLibrary.PlcException;

const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js").Dispatcher;

const sOperation = "Logout Service"; // operation of the service / job

/** @function
 * Used to execute the custom business logic
 * In case of thrown error / unexpected error the corresponding status code is added to response
 * The error is returned as service response body
 * 
 * @param {object} request - web request / job request
 * @return {object} oServiceResponseBody - the example service response body
 */
async function doService(request) {

	// --------------------- Global Constants and Variables ---------------------
	let iStatusCode = 200; // service response code
	let oServiceResponseBody = {}; // service response body

	let StandardPlcService = new StandardPlcDispatcher(request, sOperation);

	let sLanguage = "EN";

	try {
		// ------------------------- Start Business Logic ---------------------------

		let oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);
		let sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
		oServiceResponseBody.CURRENT_USER = sCurrentUser;

		await StandardPlcService.logoutPlcSession();

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
}
exports.doService = module.exports.doService = doService;
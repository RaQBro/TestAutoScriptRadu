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

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js").Service;
const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js").Dispatcher;

const sOperation = "Dummy Operation"; // operation of the service/job

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
	var iStatusCode = 200; // service response code
	var oServiceResponseBody = {}; // service response body

	const StandardPlcService = new StandardPlcDispatcher(request, sOperation);
	const ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

	const sLanguage = "EN";

	// ------------------------- Start Functions List ---------------------------

	this.getFirstProject = async function () {
		const hdbClient = await DatabaseClass.createConnection();
		const connection = new DatabaseClass(hdbClient);
		const statement = await connection.preparePromisified(
			`
				select TOP 1 PROJECT_ID from "sap.plc.db::basis.t_project";
			`
		);

		const aProjectResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
		const aProjects = aProjectResults.slice();

		return _.pluck(aProjects, "PROJECT_ID");
	};

	function getDateByPattern(sPattern) {

		function addZero(i) {
			if (i < 10) {
				i = "0" + i;
			}
			return i;
		}

		var dDate = new Date();
		var iYear = dDate.getFullYear();
		var sMonth = addZero(dDate.getMonth() + 1);
		var sDate = addZero(dDate.getDate());
		var sHours = addZero(dDate.getHours());
		var sMinutes = addZero(dDate.getMinutes());
		var sSeconds = addZero(dDate.getSeconds());

		var sCurrentDate = "";
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
	// -------------------------- End Functions List ----------------------------

	try {

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

		var oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);
		var sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
		oServiceResponseBody.CURRENT_USER = sCurrentUser;

		var sCurrentDate = getDateByPattern("DD.MM.YYYY hh:mm:ss");
		oServiceResponseBody.CURRENT_DATE = sCurrentDate;

		var sProjectId = await this.getFirstProject();
		oServiceResponseBody.PROJECT_ID = sProjectId;

		var aAllProject = await ExtensibilityPlcService.getAllProjects();
		oServiceResponseBody.PROJECT = aAllProject[0];

		let oVersion = await StandardPlcService.openCalculationVersion(1);

		if (oVersion !== undefined) {
			await StandardPlcService.closeCalculationVersion(1);
		}

		await Message.addLog(request.JOB_ID, "Example how to add operation at the messages.", "message", undefined, "TEST_OPERATION");

		// -------------------------- End Business Logic ----------------------------
	} catch (err) {
		const oPlcException = await PlcException.createPlcException(err, request.JOB_ID);
		iStatusCode = oPlcException.code.responseCode;
		oServiceResponseBody = oPlcException;
	}
	return {
		"STATUS_CODE": iStatusCode,
		"SERVICE_RESPONSE": oServiceResponseBody
	};
}
exports.doService = module.exports.doService = doService;
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

const ExtensibilityService = require(global.appRoot + "/lib/routerService/extensibilityService.js");
const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js");

const sOperation = "Dummy Operation"; // operation of the service / job

/** @function
 * Used to execute the custom business logic
 * In case of thrown error / unexpected error the corresponding status code is added to response
 * The error is returned as service response body
 * 
 * @param {object} request - web request / job request
 * @return {object} oServiceResponseBody - the example service response body
 */
function doService(request) {

	// --------------------- Global Constants and Variables ---------------------
	let iStatusCode = 200; // service response code
	let oServiceResponseBody = {}; // service response body

	let StandardPlcService = new StandardPlcDispatcher(request, sOperation);
	let ExtensibilityPlcService = new ExtensibilityService(request, sOperation);

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
	// -------------------------- End Functions List ----------------------------

	this.execute = async function () {

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

			let oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);

			if (oInitPlcSession !== undefined) {
				let sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
				oServiceResponseBody.CURRENT_USER = sCurrentUser;
				await Message.addLog(request.JOB_ID, `PLC session open for user ${sCurrentUser}.`, "info", undefined, sOperation);

				let oVersion = await StandardPlcService.openCalculationVersion(1);

				if (oVersion !== undefined) {
					await StandardPlcService.closeCalculationVersion(1);
				}

				let aStatus = await StandardPlcService.getStatuses();
				oServiceResponseBody.STATUS = aStatus;
			}

			let sCurrentDate = getDateByPattern("DD.MM.YYYY hh:mm:ss");
			oServiceResponseBody.CURRENT_DATE = sCurrentDate;

			let sProjectId = await this.getFirstProject();
			oServiceResponseBody.PROJECT_ID = sProjectId;

			let aAllProject = await ExtensibilityPlcService.getAllProjects();
			oServiceResponseBody.PROJECT = aAllProject[0];

			await Message.addLog(request.JOB_ID,
				"Example how to add operation at the messages.",
				"message", undefined, sOperation);

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
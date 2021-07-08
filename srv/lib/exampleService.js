/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");

const helpers = require(global.appRoot + "/lib/util/helpers");
const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises");
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;

const DispatcherPlc = require(global.appRoot + "/lib/util/plcDispatcher.js").PlcDispatcher;
const StandardServicePlc = require(global.appRoot + "/lib/routerService/standardPlcService.js").Dispatcher;

async function doService(request, response) {

	// --------------------- Global Constants and Variables ---------------------

	var oServiceResponseBody = {}; // service response body

	const connection = new DatabaseClass(request.db);
	const PlcDispatcher = new DispatcherPlc(request);
	const StandardPlcService = new StandardServicePlc(request);

	const sLanguage = "EN";

	// ------------------------- Start Functions List ---------------------------
	async function testGetCalculationVersion(iVersionId) {

		var aParams = [{
			"name": "id",
			"value": iVersionId
		}];

		var oResponse = await PlcDispatcher.dispatch("calculation-versions", "GET", aParams);

		if (oResponse.statusCode !== 200) {
			return JSON.parse(oResponse.body);
		}
		return "Get calculation version request executed with success!";
	}

	this.getAllProjectIds = async function () {
		let statement = await connection.preparePromisified(
			`
			SELECT PROJECT_ID FROM "sap.plc.db::basis.t_project" 
			ORDER BY PROJECT_NAME ASC;
			`);

		let aProjectResults = await connection.statementExecPromisified(statement, []);
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

		// Example how to get the data added into the new schedule (e.g. from config.js "data": {"TEST_KEY":"TEST_VALUE"} )
		// if (helpers.isRequestFromJob(request)) {
		// 	if (request.method === "GET" || request.method === "DELETE") {
		// 		let oTestValue = request.query.TEST_KEY;
		// 		console.log("oTestValue: " + oTestValue);
		// 	} else if (request.method === "PUT" || request.method === "POST") {
		// 		let oBodyRequest = request.body;
		// 		console.log("oBodyRequest: " + JSON.stringify(oBodyRequest));
		// 	}
		// }

		var sCurrentDate = getDateByPattern("DD.MM.YYYY hh:mm:ss");
		oServiceResponseBody.CURRENT_DATE = sCurrentDate;

		var sAllProjects = await this.getAllProjectIds();
		oServiceResponseBody.PROJECT_IDS = sAllProjects;

		var sGetVersionMsg = await testGetCalculationVersion(1000);
		oServiceResponseBody.VERSION_MSG = sGetVersionMsg;

		// var oGetProjects = await StandardPlcService.getProjects();
		// oServiceResponseBody.PROJECTS = oGetProjects;

		var oInitPlcSession = await StandardPlcService.initPlcSession(sLanguage);
		var sCurrentUser = oInitPlcSession.body.CURRENTUSER.ID;
		oServiceResponseBody.CURRENT_USER = sCurrentUser;

		// -------------------------- End Business Logic ----------------------------
	} catch (err) {
		let oPlcException = PlcException.createPlcException(err);
		response.status(oPlcException.code.responseCode);
		oServiceResponseBody = oPlcException;
	} finally {
		response.type("application/json");
		response.send(JSON.stringify(oServiceResponseBody));
	}
}
exports.doService = module.exports.doService = doService;
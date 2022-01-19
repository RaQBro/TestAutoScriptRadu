/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");

/**
 * @fileOverview
 * 
 * Helper utility functions
 * 
 * @name helpers.js
 */

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");

/** @function
 * Returns a new date as string based on the number of seconds from now
 */
function nowPlusSecondstoISOString(iNumberOfSeconds) {
	let now = new Date();
	let soon = new Date(now.getTime() + (iNumberOfSeconds * 1000));
	return soon.toISOString(); // "2020-12-11T10:39:29.114Z"
}

/** @function
 * Checks if the value is null or undefined
 */
function isUndefinedOrNull(param) {
	return typeof param === "undefined" || param === null;
}

/** @function
 * Checks if the value is null, undefined or empty string
 */
function isUndefinedNullOrEmptyString(param) {
	return typeof param === "undefined" || param === null || param === "";
}

/** @function
 * Checks if the value is null, undefined or empty object
 */
function isUndefinedNullOrEmptyObject(param) {
	return typeof param === "undefined" || param === null || JSON.stringify(param) === "{}";
}

/** @function
 * Checks if request is executed from a job
 */
function isRequestFromJob(request) {
	return request.headers["x-sap-job-id"] !== undefined ? true : false;
}

/** @function
 * Get all configurations from table
 */
async function getAllConfigurations() {
	let hdbClient = await DatabaseClass.createConnection();
	let connection = new DatabaseClass(hdbClient);
	let statement = await connection.preparePromisified(
		`
			select * from "sap.plc.extensibility::template_application.t_configuration";
		`
	);
	let aResults = await connection.statementExecPromisified(statement, []);
	hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	return aResults.slice();
}

/** @function
 * Get all default values from table
 */
async function getAllDefaultValues() {
	let hdbClient = await DatabaseClass.createConnection();
	let connection = new DatabaseClass(hdbClient);
	let statement = await connection.preparePromisified(
		`
			select * from "sap.plc.extensibility::template_application.t_default_values";
		`
	);
	let aResults = await connection.statementExecPromisified(statement, []);
	hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	return aResults.slice();
}

/** @function
 * Used to split an array into multiple small arrays. E.g.: a = [1,2,3,4,5,6], n = 3 => [[1,2,3], [4,5,6]]
 * @param {array} a - initial array
 * @param {integer} n - the number or elements from arrays
 * @return {array} array - array with arrays
 */
function chunkIntoSmallArrays(a, n) {
	return [...Array(Math.ceil(a.length / n))].map((x, i) => a.slice(n * i, n + n * i));
}

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

/** @function
 * Useful to decompressed an array from standard PLC service response - compressed with transposeResultArrayOfObjects() from PLC Standard
 */
function decompressedResultArray(aArray) {

	let aReturn = [];

	if (_.isArray(aArray) && aArray.length > 0) {

		// first object contain the columns names
		let aColumns = aArray[0];

		// start the loop with second object (contain the value)
		for (let i = 1; i < aArray.length; i++) {

			let oReturn = {};
			let aValues = aArray[i];

			for (let j = 0; j < aColumns.length; j++) {

				let sColumn = aColumns[j];
				oReturn[sColumn] = aValues[j];

			}

			aReturn.push(oReturn);
		}
	}

	return aReturn;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	nowPlusSecondstoISOString,
	isUndefinedOrNull,
	isUndefinedNullOrEmptyString,
	isUndefinedNullOrEmptyObject,
	isRequestFromJob,
	getAllConfigurations,
	getAllDefaultValues,
	chunkIntoSmallArrays,
	getDateByPattern,
	decompressedResultArray,
	sleep
};
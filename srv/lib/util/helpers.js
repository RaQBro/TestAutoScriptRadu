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
 * Used to get all properties of an Error object.
 * Should be used before JSON.stringify() in order to get all error details. 
 */
function recursivePropertyFinder(obj) {

	if (obj === Object.prototype) {
		return {};
	} else {
		return _.reduce(Object.getOwnPropertyNames(obj),
			function copy(result, value) {
				if (!_.isFunction(obj[value])) {
					if (_.isObject(obj[value])) {
						result[value] = recursivePropertyFinder(obj[value]);
					} else {
						result[value] = obj[value];
					}
				}
				return result;
			}, recursivePropertyFinder(Object.getPrototypeOf(obj)));
	}
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

function getDateByPattern(sPattern, dDatePicker) {

	function addZero(i) {
		if (i < 10) {
			i = "0" + i;
		}
		return i;
	}

	let dDate = new Date();

	let iYear;
	let sMonth;
	let sDate;
	let dDatePickerDate;

	if (dDatePicker === undefined || dDatePicker === "") {
		iYear = dDate.getFullYear();
		sMonth = addZero(dDate.getMonth() + 1);
		sDate = addZero(dDate.getDate());
	} else {
		dDatePickerDate = new Date(dDatePicker);
		iYear = dDatePickerDate.getFullYear();
		sMonth = addZero(dDatePickerDate.getMonth() + 1);
		sDate = addZero(dDatePickerDate.getDate());
	}
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
	case "YYYY-MM":
		sCurrentDate = iYear + "-" + sMonth;
		break;
	case "YYYY-MM[-1]":
		if (sMonth === "01") {
			sCurrentDate = iYear - 1 + "-12";
		} else {
			if (dDatePicker === undefined) {
				sCurrentDate = iYear + "-" + addZero(dDate.getMonth());
			} else {
				sCurrentDate = iYear + "-" + addZero(dDatePickerDate.getMonth());
			}
		}
		break;
	default:
		sCurrentDate = iYear + "" + sMonth + "" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
		break;
	}

	return sCurrentDate;
}

/** @function
 * Useful to decompressed an array from standard PLC service response - when a service is called with compressedResult=true parameter
 */
function decompressedResultArray(oInput) {

	let aReturn = [];

	if (_.isObject(oInput)) {

		// get all columns
		let aColumns = _.keys(oInput);

		if (aColumns.length > 0) {

			// create a template object with columns
			let oReturn = {};
			for (let sColumn of aColumns) {
				oReturn[sColumn] = null;
			}

			// get number or values
			let iNumberOfValues = oInput[aColumns[0]].length;

			// for every value create a return object
			for (let i = 0; i < iNumberOfValues; i++) {
				aReturn.push(JSON.parse(JSON.stringify(oReturn)));
			}

			for (let sColumn of aColumns) {
				let aValues = oInput[sColumn];
				for (let j = 0; j < aValues.length; j++) {
					// add value to return object
					aReturn[j][sColumn] = aValues[j];
				}
			}
		}
	}

	return aReturn;
}

function sleep(ms) {

	return new Promise(resolve => setTimeout(resolve, ms));
}

/** @function
 * Used to execute a select SQL statement 
 */
async function statementExecPromisified(sSQLstmt, aQueryParameters) {

	let aQueryParams = aQueryParameters !== undefined ? aQueryParameters : [];

	let hdbClient = await DatabaseClass.createConnection();
	let connection = new DatabaseClass(hdbClient);
	let statement = await connection.preparePromisified(sSQLstmt);
	let aResults = await connection.statementExecPromisified(statement, aQueryParams);
	hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

	if (typeof aResults === "number") { // return the row count in case of insert / update / delete 
		return aResults;
	} else {
		return aResults.slice();
	}
}

module.exports = {
	nowPlusSecondstoISOString,
	isUndefinedOrNull,
	isUndefinedNullOrEmptyString,
	isUndefinedNullOrEmptyObject,
	isRequestFromJob,
	getAllConfigurations,
	getAllDefaultValues,
	recursivePropertyFinder,
	chunkIntoSmallArrays,
	getDateByPattern,
	decompressedResultArray,
	sleep,
	statementExecPromisified
};
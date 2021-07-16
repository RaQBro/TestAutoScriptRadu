/*eslint-env node, es6 */
"use strict";

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
	var now = new Date();
	var soon = new Date(now.getTime() + (iNumberOfSeconds * 1000));
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
	const hdbClient = await DatabaseClass.createConnection();
	const connection = new DatabaseClass(hdbClient);
	const statement = await connection.preparePromisified(
		`
			select * from "sap.plc.extensibility::template_application.t_configuration";
		`
	);
	const aResults = await connection.statementExecPromisified(statement, []);
	hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	return aResults.slice();
}

/** @function
 * Get all default values from table
 */
async function getAllDefaultValues() {
	const hdbClient = await DatabaseClass.createConnection();
	const connection = new DatabaseClass(hdbClient);
	const statement = await connection.preparePromisified(
		`
			select * from "sap.plc.extensibility::template_application.t_default_values";
		`
	);
	const aResults = await connection.statementExecPromisified(statement, []);
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

module.exports = {
	nowPlusSecondstoISOString,
	isUndefinedOrNull,
	isUndefinedNullOrEmptyString,
	isUndefinedNullOrEmptyObject,
	isRequestFromJob,
	getAllConfigurations,
	getAllDefaultValues,
	chunkIntoSmallArrays
};
/*eslint-env node, es6 */
"use strict";

function nowPlusSecondstoISOString(iNumberOfSeconds) {
	var now = new Date();
	var soon = new Date(now.getTime() + (iNumberOfSeconds * 1000));
	return soon.toISOString(); // "2020-12-11T10:39:29.114Z"
}

function isUndefinedNullOrEmptyObject(param) {
	return typeof param === "undefined" || param === null || JSON.stringify(param) === "{}";
}

function isRequestFromJob(request) {
	return request.headers["x-sap-job-id"] !== undefined ? true : false;
}

module.exports = {
	nowPlusSecondstoISOString,
	isUndefinedNullOrEmptyObject,
	isRequestFromJob
};
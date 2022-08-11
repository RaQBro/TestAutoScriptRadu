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
 * Checks if request is executed from a real job
 */
function isRequestFromJob(request) {

	if (request.headers !== undefined && request.headers["x-sap-job-id"] !== undefined) {
		return true;
	} else if (request.SAP_JOB_ID !== undefined && request.SAP_JOB_ID !== null) {
		return true;
	} else {
		return false;
	}
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

// ------------------------- Start functions to determine name for new calculation version ---------------------------

/**
 * Find first available name the follows the pattern: "<sCalculationVersionPrefix> <sUserId> .
 *
 * @param {string}
 *            sCalculationVersionName - the name of the calculation version to be checked for existence
 * @param {integer}
 *            iCalculationId - the id of the calculation (integer literal)
 * @throws {@link PlcException}
 *             if database content is corrupt due to duplicated calculation version names
 * @returns {boolean} - true if the calculation version name is unique, otherwise false
 */
async function isNameUniqueInBothTables(sCalculationVersionName, iCalculationId) {

	let sQuery =
		`
			SELECT calculation_version_name FROM "sap.plc.db::basis.t_calculation_version_temporary"
				WHERE calculation_version_name = ?
					AND calculation_id = ?
			UNION
			SELECT calculation_version_name FROM "sap.plc.db::basis.t_calculation_version"
				WHERE calculation_version_name = ?
					AND calculation_id = ?
		`;

	let aResult = await statementExecPromisified(sQuery, [sCalculationVersionName, iCalculationId, sCalculationVersionName,
		iCalculationId
	]);

	if (aResult.length > 0) {
		return false;
	} else {
		return true;
	}
}

/**
 * Find first available name the follows the pattern: "<sCalculationVersionPrefix> (number)" .
 *
 * @param {string}
 *            sCalculationVersionPrefix - the name of the calculation version to be checked for uniqueness (string literal)
 * @param {integer}
 *            iCalculationId - the id of the calculation
 * @throws {@link PlcException}
 *             if database content is corrupt due to duplicated calculation version names
 * @returns {array} - array of calculation version names
 */
async function findNameWithPrefix(sCalculationVersionPrefix, iCalculationId) {

	let sQuery =
		`
			SELECT calculation_version_name FROM "sap.plc.db::basis.t_calculation_version_temporary"
				WHERE calculation_version_name LIKE concat(?, ' (%)')
					AND calculation_id = ?
			UNION
			SELECT calculation_version_name FROM "sap.plc.db::basis.t_calculation_version"
				WHERE calculation_version_name LIKE concat(?, ' (%)')
					AND calculation_id = ?
		`;

	let aResult = await statementExecPromisified(sQuery, [sCalculationVersionPrefix, iCalculationId,
		sCalculationVersionPrefix, iCalculationId
	]);

	if (aResult.length > 0) {
		return _.map(aResult, "CALCULATION_VERSION_NAME");
	} else {
		return [];
	}
}

/**
 * Splits incremental string like: TestVersionName (1) / TestVersionName (2)
 * @param sTextWithIncrement
 */
function splitIncrementalString(sTextWithIncrement) {
	var sRegexIncremental = "^(.*) \\(([1-9][0-9]*)\\)$";
	var rPattern = new RegExp(sRegexIncremental);
	var aMatches = rPattern.exec(sTextWithIncrement);
	var sPrefix = sTextWithIncrement;
	var iStartSuffix = 1;

	// Check if a text ends in "<space><open_bracket><number><close_bracket>", that is, " (1)", " (2)"
	if (aMatches) {
		sPrefix = aMatches[1];
		iStartSuffix = parseInt(aMatches[2]);
	}
	return {
		Prefix: sPrefix,
		StartSuffix: iStartSuffix
	};
}

/**
 * Function used to find first unused numeric suffix (numbers) from a collection of numeric suffixes (numbers)
 */
function findFirstUnusedSuffix(aAllSuffixes, iStartSuffix) {
	/* Filter values smaller than iStartSuffix, then sort the array. */
	var aSuffixes = aAllSuffixes.filter(function (value) { // , index, array) { todo add if needed else delete
		return value > iStartSuffix;
	});
	if (aSuffixes.length === 0) {
		// special case if no suffixes are greater than iStartSuffix
		return iStartSuffix + 1;
	}
	aSuffixes.sort((a, b) => a - b); // without the lambda function Array.sort() always sorts alphabetically and not by numbers

	for (let i = 1; i < aSuffixes.length; i++) {
		if (aSuffixes[i] - aSuffixes[i - 1] !== 1) {
			return aSuffixes[i - 1] + 1;
		}
	}
	return aSuffixes[aSuffixes.length - 1] + 1;
}

/**
 * Function used to escape string for RegExp
 */
function escapeStringForRegExp(sString) {

	return sString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Function used to find first unused numeric suffix (numbers) in an array Of Strings: ["TestVersionName (1)" , "TestVersionName (5)]
 */
function findFirstUnusedSuffixInStringArray(sPrefix, iStartSuffix, aNamesWithPrefix) {
	var sRegexSufixWithoutText = " \\(([1-9][0-9]*)\\)";
	var rSuffixPattern = new RegExp(escapeStringForRegExp(sPrefix) + sRegexSufixWithoutText);

	//Filter an array having "<prefix> (<something>)" names and extract those which actually follow the "<prefix> (<number>)" pattern
	//Then and collect all the <number>s in an array.
	var aSuffixes = [];
	_.each(aNamesWithPrefix, function (sNameWithPrefix) {
		var aMatches = rSuffixPattern.exec(sNameWithPrefix);
		if (aMatches) {
			aSuffixes.push(parseInt(aMatches[1]));
		}
	});

	/* Find first unused numeric suffix. */
	var iSuffix = findFirstUnusedSuffix(aSuffixes, iStartSuffix);

	return iSuffix;
}

/**
 * Determine name for new calculation version
 *
 * @param {object}
 *            oCalculationVersion - new calculation version object
 * @returns {string} - calculation version name
 */
async function getOrDetermineNewCalculationVersionName(oCalculationVersion) {

	var sCalculationVersionName;

	// check if the name exist in t_calculation_version and t_calculation_version_temporary
	if (await isNameUniqueInBothTables(oCalculationVersion.CALCULATION_VERSION_NAME, oCalculationVersion.CALCULATION_ID)) {
		sCalculationVersionName = oCalculationVersion.CALCULATION_VERSION_NAME;
	} else {
		/*
		 * Check if the input calculation name ends in "<space><open_bracket><number><close_bracket>", that is, " (1)", " (2)" and
		 * so on. If it doesn't, we'll attempt to add this suffix to the input name. If it does, we'll attempt to increase the number
		 * until an available combination is found.
		 */
		var oSplitedCalculationVersionName = splitIncrementalString(oCalculationVersion.CALCULATION_VERSION_NAME);

		/*
		 * Extract all calculation version names which follow the "<prefix> (<something>)" pattern inside the same parent calculation.
		 * Note: SQL can't easily check for "<prefix> (<number>)", so we relaxed this to "<name> (<something>)".
		 */
		var aNamesWithPrefix = await findNameWithPrefix(oSplitedCalculationVersionName.Prefix, oCalculationVersion.CALCULATION_ID);
		/* Find first unused numeric suffix. */
		var iSuffix = findFirstUnusedSuffixInStringArray(oSplitedCalculationVersionName.Prefix,
			oSplitedCalculationVersionName.StartSuffix, aNamesWithPrefix);

		sCalculationVersionName = oSplitedCalculationVersionName.Prefix + " (" + iSuffix.toString() + ")";
	}

	return sCalculationVersionName;

}

// ------------------------- End functions to determine name for new calculation version ---------------------------

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
	statementExecPromisified,
	getOrDetermineNewCalculationVersionName
};
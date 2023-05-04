/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Application configuration file:
 *		- contains custom specific hardcoded values
 *		- background job(s) definition
 * 
 * @name config.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");

// General configurations
module.exports.oConfig = {

};

// Jobs configurations
module.exports.aJobs = [{
	"name": "TESTAUTOSCRIPTRADU_JOB",
	"description": "Testautoscriptradu Job",
	"httpMethod": "GET",
	"active": true,
	"startTime": helpers.nowPlusSecondstoISOString(0),
	// the action must be maintained because after job creation this cannot be changed/added from job dashboard  
	"action": "/extensibility/plc/example-service",
	"schedules": [{

		/**
		 * Example: how to define a schedule to perform at a regular interval
		 */
		// 	"description": "Perform my action every 30 seconds",
		// 	"data": {},
		// 	"active": true,
		// 	"repeatInterval": "30 seconds"
		// }, {

		/**
		 * Example: how to define a schedule that perform at a specific time
		 */
		"description": "Job scheduled on-demand",
		"type": "one-time",
		/**
		 * Example: how to pass data to a job schedule. See in exampleService.js how to get the data from a schedule
		 */
		// "data": {
		// 	"TEST_KEY": "TEST_VALUE"
		// },
		"active": true,
		"time": helpers.nowPlusSecondstoISOString(5)

	}]
}];

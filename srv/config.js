/*eslint-env node, es6 */
"use strict";

const helpers = require(global.appRoot + "/lib/util/helpers");

// General configurations
module.exports.oConfig = {
	"CreateJobsAutomatically": false // set to true if job(s) are required to be created when server.js is executed
};

// Jobs
module.exports.aJobs = [{
	"name": "TEMPLATE_APPLICATION_JOB",
	"description": "Template Application Job",
	"httpMethod": "GET",
	"active": true,
	"startTime": helpers.nowPlusSecondstoISOString(5),
	// the action must be maintained because after job creation this cannot be changed/added from job dashboard  
	"action": "/extensibility/plc/exampleService",
	"schedules": [{
		// 	"description": "Perform my action every 30 seconds",
		// 	"data": {},
		// 	"active": true,
		// 	"repeatInterval": "30 seconds"
		// }, {
		"description": "Job scheduled on-demand",
		"type": "one-time",
		// "data": {
		// 	"TEST_KEY": "TEST_VALUE"
		// },
		"active": true,
		"time": helpers.nowPlusSecondstoISOString(30)
	}]
}];
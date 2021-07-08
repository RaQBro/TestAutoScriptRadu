/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";

const xsjs = require("@sap/xsjs");
const xsenv = require("@sap/xsenv");
const port = process.env.PORT || 3000;

const express = require("express");
const xsHDBConn = require("@sap/hdbext");

const xssec = require("@sap/xssec");
const passport = require("passport");
const bodyParser = require("body-parser");
const listEndpoints = require("express-list-endpoints");

// general configurations
global.appRoot = __dirname;

// extensibility plc router
const extensibilityPlc = require(global.appRoot + "/lib/customRouter/extensibilityRouter.js");
var extensibilityPlcRouter = new extensibilityPlc.ExtensibilityRouter();
var routerExtensibilityPlc = extensibilityPlcRouter.getRouter();

// scheduler job router
const jobScheduler = require(global.appRoot + "/lib/customRouter/jobSchedulerRouter.js");
var jobSchedulerRouter = new jobScheduler.JobSchedulerRouter();
var routerJobScheduler = jobSchedulerRouter.getRouter();

// secure store router
const secureStore = require(global.appRoot + "/lib/customRouter/secureStoreRouter.js");
var secureStoreRouter = new secureStore.SecureStoreRouter();
var routerSecureStore = secureStoreRouter.getRouter();

// standard plc router
const standardPlc = require(global.appRoot + "/lib/customRouter/standardPlcRouter.js");
var standardPlcRouter = new standardPlc.StandardPlcRouter();
var routerStandardPlc = standardPlcRouter.getRouter();

// xsjs configurations
var options = {
	anonymous: false, // remove to authenticate calls
	auditLog: {
		logToConsole: true
	}, // change to auditlog service for productive scenarios
	redirectUrl: "/index.xsjs",
	customRouters: [{
		"path": "/extensibility/plc",
		"router": routerExtensibilityPlc
	}, {
		"path": "/scheduler/job",
		"router": routerJobScheduler
	}, {
		"path": "/secure/store",
		"router": routerSecureStore
	}, {
		"path": "/standard/plc",
		"router": routerStandardPlc
	}]
};

// configure HANA for xsjs compatibility
try {
	options = Object.assign(options, xsenv.getServices({
		hana: {
			plan: "hdi-shared"
		}
	}));
} catch (err) {
	console.log("[WARN - hana]", err.message);
}

// configure UAA
try {
	options = Object.assign(options, xsenv.getServices({
		uaa: {
			tag: "xsuaa"
		}
	}));
} catch (err) {
	console.log("[WARN - xsuaa]", err.message);
}

// configure securestore
try {
	options = Object.assign(options, xsenv.getServices({
		secureStore: {
			name: "secureStore"
		}
	}));
} catch (err) {
	console.log("[WARN - securestore]", err.message);
}

// initialize xsjs server
var xsjsApp = xsjs(options);

// initialize Express App for XSA UAA and HDBEXT Middleware
var expressApp = express();

expressApp.use(bodyParser.urlencoded({
	extended: true
}));
expressApp.use(bodyParser.json({
	limit: "50MB"
}));
expressApp.use(bodyParser.raw());

// authentication Module Configuration
passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
	uaa: {
		tag: "xsuaa"
	}
}).uaa));
expressApp.use(passport.initialize());
expressApp.use(passport.authenticate("JWT", {
	session: false
}));

// use custom hdb connection
expressApp.use(xsHDBConn.middleware(options.hana));

// express app routing init (order is very IMPORTANT: custom hdb connection first and custom routes after)
expressApp.use("/extensibility/plc", routerExtensibilityPlc);
expressApp.use("/scheduler/job", routerJobScheduler);
expressApp.use("/secure/store", routerSecureStore);
expressApp.use("/standard/plc", routerStandardPlc);

// add xsjs to express
expressApp.use(xsjsApp);

// token lifecycle at 1 minute (get & refresh)
var uaaToken = require(global.appRoot + "/lib/util/uaaToken.js");
var UAAToken = new uaaToken.UAAToken();
UAAToken.checkToken();
setInterval(function () {
	UAAToken.checkToken();
}, 60 * 1000); // every minute

// create job(s) at first run
const JobSchedulerService = require(global.appRoot + "/lib/routerService/jobSchedulerService.js").JobScheduler;
new JobSchedulerService().createJobs();

// start app listen
expressApp.listen(port, function () {
	console.log("Server listening on port %d", port);
	console.log(listEndpoints(expressApp));
});
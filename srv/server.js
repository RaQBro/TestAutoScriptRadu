/*eslint no-console: 0*/
"use strict";

const xsjs = require("@sap/xsjs");
const xsenv = require("@sap/xsenv");
const port = process.env.PORT || 3000;

const express = require("express");
const expressPromiseRouter = require("express-promise-router");
const xsHDBConn = require("@sap/hdbext");

const xssec = require("@sap/xssec");
const passport = require("passport");
const bodyParser = require("body-parser");

/**
 * @fileOverview
 * 
 * Server configuration file:
 *		- is adding to global variable the application root director used for import: require(global.appRoot + "/lib/...
 *		- is adding to global variable the PLC endpoints defined into global environment variables and used in plcDispatcher.js
 *		- imports the custom defined routers
 *		- initialize xsjs server with HANA db, UAA, Secure Store configurations
 *		- initialize express application with authentication module configuration XSA UAA
 *		- is adding custom routes and xsjs server to express application
 *		- starts the express application
 *		- a token is generated (based on a technical user) and is checked if it's valid at a regular time interval
 *		- creates the background job(s) at first run if defined in config.js file
 * 
 * @name server.js
 */

// general configurations
global.appRoot = __dirname;
global.plcWebUrl = process.env.SAP_PLC_WEB;
global.plcXsjsUrl = process.env.SAP_PLC_XSJS;
global.plcPublicApiUrl = process.env.SAP_PLC_PUBLIC_API;
global.appUserToken = {};
global.appUserTokenExpire = {};

//For local development and usage only !!!
//xsenv.loadEnv();

// extensibility plc router
let ExtensibilityPlc = require(global.appRoot + "/lib/customRouter/extensibilityRouter.js");
let ExtensibilityPlcRouter = new ExtensibilityPlc.ExtensibilityRouter();
let RouterExtensibilityPlc = ExtensibilityPlcRouter.getRouter();

// scheduler job router
let JobScheduler = require(global.appRoot + "/lib/customRouter/jobSchedulerRouter.js");
let JobSchedulerRouter = new JobScheduler.JobSchedulerRouter();
let RouterJobScheduler = JobSchedulerRouter.getRouter();

// secure store router
let SecureStore = require(global.appRoot + "/lib/customRouter/secureStoreRouter.js");
let SecureStoreRouter = new SecureStore.SecureStoreRouter();
let RouterSecureStore = SecureStoreRouter.getRouter();

// standard plc router
let StandardPlc = require(global.appRoot + "/lib/customRouter/standardPlcRouter.js");
let StandardPlcRouter = new StandardPlc.StandardPlcRouter();
let RouterStandardPlc = StandardPlcRouter.getRouter();

// xsjs configurations
let options = {
	// anonymous: false, // remove to authenticate calls
	auditLog: {
		logToConsole: true
	}, // change to auditlog service for productive scenarios
	redirectUrl: "/service/index.xsjs",
	customRouters: [{
		"path": "/extensibility/plc",
		"router": RouterExtensibilityPlc
	}, {
		"path": "/scheduler/job",
		"router": RouterJobScheduler
	}, {
		"path": "/secure/store",
		"router": RouterSecureStore
	}, {
		"path": "/standard/plc",
		"router": RouterStandardPlc
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
			name: "tapp-uaa-service"
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
let xsjsApp = xsjs(options);

// initialize Express App for XSA UAA and HDBEXT Middleware
let expressApp = express();
let expressPromiseRouterApp = expressPromiseRouter();

expressApp.use(expressPromiseRouterApp);

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
		name: "tapp-uaa-service"
	}
}).uaa));
expressApp.use(passport.initialize());
expressApp.use(passport.authenticate("JWT", {
	session: false
}));

// use custom hdb connection
expressApp.use(xsHDBConn.middleware(options.hana));

// express app routing init (order is very IMPORTANT: custom hdb connection first and custom routes after)
expressApp.use("/extensibility/plc", RouterExtensibilityPlc);
expressApp.use("/scheduler/job", RouterJobScheduler);
expressApp.use("/secure/store", RouterSecureStore);
expressApp.use("/standard/plc", RouterStandardPlc);

// add xsjs to express
expressApp.use(xsjsApp);

// start app listen
expressApp.listen(port, function () {
	console.log("Server listening on port %d", port);
});

// token lifecycle at 1 minute (get & refresh)
let UaaToken = require(global.appRoot + "/lib/util/uaaToken.js");
let UAAToken = new UaaToken();
UAAToken.retrieveTechnicalUserToken();
setInterval(function () {
	UAAToken.retrieveTechnicalUserToken();
}, 60 * 1000); // every minute

// create job(s) at first run
let JobSchedulerUtil = require(global.appRoot + "/lib/util/jobScheduler.js");
new JobSchedulerUtil().createJobs();
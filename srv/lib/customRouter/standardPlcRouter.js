/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

/**
 * @fileOverview
 * 
 * Standard PLC Router
 * Requests used to call the standard PLC backend services:
 *		- GET /standard/plc/init-session?language=EN
 *		- GET /standard/plc/logout-session
 *		- GET /standard/plc/open-calculation-version?versionId=1000
 *		- GET /standard/plc/status
 * 
 * @name standardPlcRouter.js
 */

const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js");
const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;
const UaaToken = require(global.appRoot + "/lib/util/uaaToken.js");

const sContentType = "application/json";
const sOperation = "Dummy Operation"; // operation of the service / job

/** @class
 * @classdesc Standard PLC router
 * @name StandardPlcRouter 
 */
class StandardPlcRouter {

	constructor() {

		let router = express.Router();

		let UAAToken = new UaaToken();

		/**
		 * Common function before all routes are processed
		 */
		router.use(async function (request, response, next) {

			await UAAToken.retrieveApplicationUserToken(request);

			next();

		});

		router.get("/init-session", function (request, response) {

			let sLanguage = request.query.language !== undefined ? request.query.language : "EN";

			let StandardPlcService = new StandardPlcDispatcher(request, sOperation);

			StandardPlcService.initPlcSession(sLanguage).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/logout-session", function (request, response) {

			let StandardPlcService = new StandardPlcDispatcher(request, sOperation);

			StandardPlcService.logoutPlcSession().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/open-calculation-version", function (request, response) {

			let iVersionId = request.query.versionId;

			let StandardPlcService = new StandardPlcDispatcher(request, sOperation);

			StandardPlcService.openCalculationVersion(iVersionId).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/status", function (request, response) {

			let StandardPlcService = new StandardPlcDispatcher(request, sOperation);

			StandardPlcService.getStatuses().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}

exports.StandardPlcRouter = module.exports.StandardPlcRouter = StandardPlcRouter;
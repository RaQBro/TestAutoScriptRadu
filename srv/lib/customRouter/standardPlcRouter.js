/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

/**
 * @fileOverview
 * 
 * Standard PLC Router
 * Requests used to call the standard PLC backend services:
 *		- GET /standard/plc/initSession?language=EN
 *		- GET /standard/plc/logoutSession
 *		- GET /standard/plc/openCalculationVersion?versionId=1000
 * 
 * @name standardPlcRouter.js
 */

const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;
const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js").Dispatcher;

/** @class
 * @classdesc Standard PLC router
 * @name StandardPlcRouter 
 */
class StandardPlcRouter {

	constructor() {

		var router = express.Router();

		var StandardPlcService;
		const sContentType = "application/json";

		/**
		 * Common function before all routes are processed
		 */
		router.use(async function (request, response, next) {

			StandardPlcService = new StandardPlcDispatcher(request);
			next();

		});

		router.get("/initSession", function (request, response) {

			const sLanguage = request.query.language !== undefined ? request.query.language : "EN";

			StandardPlcService.initPlcSession(sLanguage).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/logoutSession", function (request, response) {

			StandardPlcService.logoutPlcSession().then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/openCalculationVersion", function (request, response) {

			const iVersionId = request.query.versionId;

			StandardPlcService.openCalculationVersion(iVersionId).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				const oPlcException = await PlcException.createPlcException(err);
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
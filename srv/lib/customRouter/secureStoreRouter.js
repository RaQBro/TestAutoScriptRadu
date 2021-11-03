/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

/**
 * @fileOverview
 * 
 * Secure Store Router
 * Requests used to maintain into the TEMPLATE_APPLICATION_STORE secure store the password of technical user:
 *		- GET /secure/store/retrieve?KEY=TECHNICAL_USER_NAME
 *		- POST /secure/store/insert?KEY=TECHNICAL_USER_NAME + body data: { "VALUE": "password" }
 *		- GET /secure/store/delete?KEY=TECHNICAL_USER_NAME
 * 
 * @name secureStoreRouter.js
 */

const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js").SecureStoreService;
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser.js").TechnicalUserUtil;
const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;

const sContentType = "application/json";

/** @class
 * @classdesc Secure store router
 * @name SecureStoreRouter 
 */
class SecureStoreRouter {

	constructor() {

		let router = express.Router();

		let SecureStoreService = new SecureStore();
		let TechnicalUserUtil = new TechnicalUser();

		/**
		 * Common function before all routes are processed
		 */
		router.use(function (request, response, next) {
			next();
		});

		router.get("/retrieve", function (request, response) {

			let sKey = request.query.KEY;

			SecureStoreService.retrieveKey(sKey).then(function (result) {
				response.type(sContentType).status(200).send(result);
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.post("/insert", function (request, response) {

			let sKey = request.query.KEY;
			let sValue = request.body.VALUE;

			SecureStoreService.insertKey(sKey, sValue).then(function (result) {

				TechnicalUserUtil.upsertTechnicalUserIntoTable(sKey).then(function () {
					response.type(sContentType).status(200).send(result);
				}).catch(async function (err) {
					let oPlcException = await PlcException.createPlcException(err);
					response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
				});
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.get("/delete", function (request, response) {

			let sKey = request.query.KEY;
			let sValue = null;

			SecureStoreService.deleteKey(sKey).then(function (result) {

				TechnicalUserUtil.upsertTechnicalUserIntoTable(sValue).then(function () {
					response.type(sContentType).status(200).send(result);
				}).catch(async function (err) {
					let oPlcException = await PlcException.createPlcException(err);
					response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
				});
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
exports.SecureStoreRouter = module.exports.SecureStoreRouter = SecureStoreRouter;
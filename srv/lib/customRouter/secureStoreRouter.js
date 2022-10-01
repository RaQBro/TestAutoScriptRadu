/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const expressPromiseRouter = require("express-promise-router");

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

const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js");
const ApplicationSettings = require(global.appRoot + "/lib/util/applicationSettings.js");
const PlcException = require(global.appRoot + "/lib/util/message.js").PlcException;

const sContentType = "application/json";

/** @class
 * @classdesc Secure store router
 * @name SecureStoreRouter 
 */
class SecureStoreRouter {

	constructor() {

		let router = expressPromiseRouter();

		let SecureStoreService = new SecureStore();
		let ApplicationSettingsUtil = new ApplicationSettings();

		/**
		 * Common function before all routes are processed
		 */
		router.use(function (request, response, next) {

			next();
		});

		router.get("/retrieve", function (request, response) {

			let sKey = request.query.KEY;

			SecureStoreService.retrieveKey(sKey).then(function (result) {
				if (result instanceof PlcException) {
					response.type(sContentType).status(result.code.responseCode).send(result);
				} else {
					response.type(sContentType).status(200).send(result);
				}
			}).catch(async function (err) {
				let oPlcException = await PlcException.createPlcException(err);
				response.type(sContentType).status(oPlcException.code.responseCode).send(oPlcException);
			});
		});

		router.post("/insert", function (request, response) {

			let sKey = request.query.KEY;
			let sValue = request.body.VALUE;
			let sFieldName = request.body.FIELD_NAME;

			SecureStoreService.insertKey(sKey, sValue).then(function (result) {
				ApplicationSettingsUtil.upsertApplicationSettingsIntoTable(sKey, sFieldName).then(function () {
					// generate new technical user token (if new user or new password)
					if (sFieldName === "TECHNICAL_USER") {
						let UaaToken = require(global.appRoot + "/lib/util/uaaToken.js");
						let UAAToken = new UaaToken();
						UAAToken.retrieveTechnicalUserToken();
					}
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

		router.post("/delete", function (request, response) {

			let sKey = request.query.KEY;
			let sValue = request.body.VALUE;
			let sFieldName = request.body.FIELD_NAME;

			SecureStoreService.deleteKey(sKey).then(function (result) {
				ApplicationSettingsUtil.upsertApplicationSettingsIntoTable(sValue, sFieldName).then(function () {
					// delete technical user from global
					if (sFieldName === "TECHNICAL_USER") {
						global.TECHNICAL_USER = undefined;
					}
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
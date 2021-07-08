/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");

const PlcException = require(global.appRoot + "/lib/util/message").PlcException;
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser").TechnicalUser;
const SecureStoreService = require(global.appRoot + "/lib/routerService/secureStoreService.js").SecureStore;

class SecureStoreRouter {

	constructor() {

		var router = express.Router();

		// common function before all routes are processed
		router.use(function (request, response, next) {
			next();
		});

		// Secure Store Retrieve
		router.get("/retrieve", function (request, response) {
			let secureStoreService = new SecureStoreService();

			let sKey = request.query.KEY;

			secureStoreService.retrieveKey(sKey).then(function (result) {
				response.type("application/json").status(200).send(JSON.stringify(result));
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		// Secure Store Insert
		router.post("/insert", function (request, response) {
			let secureStoreService = new SecureStoreService();

			let sKey = request.query.KEY;
			let sValue = request.body.VALUE;

			secureStoreService.insertKey(sKey, sValue).then(function (result) {
				let technicalUser = new TechnicalUser();

				technicalUser.upsertTechnicalUserIntoDefaultValuesTable(sKey).then(function () {
					response.type("application/json").status(200).send(JSON.stringify(result));
				}).catch(function (err) {
					let oPlcException = PlcException.createPlcException(err);
					response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
				});
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		// Secure Store Delete
		router.get("/delete", function (request, response) {
			let secureStoreService = new SecureStoreService();

			let sKey = request.query.KEY;

			secureStoreService.deleteKey(sKey).then(function (result) {
				let technicalUser = new TechnicalUser();

				technicalUser.upsertTechnicalUserIntoDefaultValuesTable(null).then(function () {
					response.type("application/json").status(200).send(JSON.stringify(result));
				}).catch(function (err) {
					let oPlcException = PlcException.createPlcException(err);
					response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
				});
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}
exports.SecureStoreRouter = module.exports.SecureStoreRouter = SecureStoreRouter;
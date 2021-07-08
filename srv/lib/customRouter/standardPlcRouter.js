/* eslint-env node, es6 */
/* eslint new-cap: 0 */
"use strict";

const express = require("express");
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;
const StandardPlcService = require(global.appRoot + "/lib/routerService/standardPlcService.js").Dispatcher;
const Routes = require(global.appRoot + "/lib/util/standardPlcRoutes.js");

class StandardPlcRouter {

	constructor() {

		var router = express.Router();

		// common function before all routes are processed
		router.use(function (request, response, next) {
			next();
		});

		// endpoint for X-CSRF-Token Fetch
		router.get("/token", function (request, response) {
			response.send(true);
		});

		// endpoint for authenticated user details Fetch
		router.get("/userDetails", function (request, response) {

			var userDetails = {
				"givenName": request.authInfo.getGivenName(),
				"familyName": request.authInfo.getFamilyName()
			};

			response.send(userDetails);
		});

		// endpoint for plc application routes Fetch
		router.get("/applicationRoutes", function (req, res) {

			Routes.plcBasicXsjsUrl = process.env.SAP_PLC_XSJS;
			Routes.plcBasicPublicApiUrl = process.env.SAP_PLC_PUBLIC_API;
			Routes.plcBasicWebUrl = process.env.SAP_PLC_WEB;

			res.send({
				"xsjs": Routes.plcBasicXsjsUrl,
				"publicApi": Routes.plcBasicPublicApiUrl,
				"web": Routes.plcBasicWebUrl
			});
		});

		router.get("/initSession", function (request, response) {

			let standardPlcService = new StandardPlcService(request);

			let sLanguage = request.query.language !== undefined ? request.query.language : "EN";

			standardPlcService.initPlcSession(sLanguage).then(function (result) {
				response.type("application/json").status(200).send(JSON.stringify(result));
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		router.get("/logoutSession", function (request, response) {

			let standardPlcService = new StandardPlcService(request);

			standardPlcService.logoutPlcSession().then(function (result) {
				response.type("application/json").status(200).send(JSON.stringify(result));
			}).catch(function (err) {
				let oPlcException = PlcException.createPlcException(err);
				response.type("application/json").status(oPlcException.code.responseCode).send(JSON.stringify(oPlcException));
			});
		});

		router.get("/getProjects", function (request, response) {

			let standardPlcService = new StandardPlcService(request);

			return new Promise(function () {

				standardPlcService.getProjects()
					.then(function (resp) {
						response.send(resp);
					}).catch(function (err) {
						response.send(err);
					});
			});
		});

		this.router = router;
	}

	getRouter() {
		return this.router;
	}
}

exports.StandardPlcRouter = module.exports.StandardPlcRouter = StandardPlcRouter;
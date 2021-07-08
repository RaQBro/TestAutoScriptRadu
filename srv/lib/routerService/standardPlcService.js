/*eslint-env node, es6 */
"use strict";

const async = require("async");
const request = require("request");
const httpStatus = require("http-status-codes");

const Code = require(global.appRoot + "/lib/util/message").Code;
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;
const DispatcherPlc = require(global.appRoot + "/lib/util/plcDispatcher.js").PlcDispatcher;

const Routes = require(global.appRoot + "/lib/util/standardPlcRoutes.js");
const routes = new Routes.StandardPlcRoutes();

const session = {
	LANGUAGE: "EN",
	SESSION_ID: null
};

class Dispatcher {

	// constructor
	constructor(req) {

		if (req.user.id === undefined) { // undefined in job context
			this.token = global.TECHNICAL_BEARER_TOKEN; // bearer token generated from technical user
		} else {
			this.token = req.authInfo.getAppToken();
		}
		this.hdbClient = req.db;
		this.userId = req.user.id;
		this.PlcDispatcher = new DispatcherPlc(req);
	}

	async initPlcSession(sLanguage) {

		let sQueryPath = "init-session";
		let aParams = [{
			"name": "language",
			"value": sLanguage
		}];

		let oResponse = await this.PlcDispatcher.dispatch(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to initialize session with PLC. If this error persists, please contact your system administrator!";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			return oResponseBody;
		}
	}

	async logoutPlcSession() {

		let sQueryPath = "logout";
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatch(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to logout PLC session. If this error persists, please contact your system administrator!";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			return oResponseBody;
		}
	}

	isSessionValid() {

		console.log('validating session');

		if (session.SESSION_ID === null || session.SESSION_ID !== this.userId) {

			console.log('session is not valid');
			return false;
		}

		return true;
	}

	// init session
	initSession() {

		var that = this;

		return new Promise(function (resolve, reject) {

			var validSession = that.isSessionValid();

			if (!validSession) {

				async.series([

					function (callback) {

						that.authServiceCall()
							.then(function (res) {
								callback(null, res);
							})
							.catch(function (err) {
								callback(err);
							});
					},

					function (callback) {

						that.initSessionServiceCall()
							.then(function (res) {
								callback(null, res);
							})
							.catch(function (err) {
								callback(err);
							});
					}
				], function (err, results) {

					if (err) {

						console.log("PLC Init session series error : ", err);

						reject(err);
					}

					resolve(results);

				});
			} else {

				resolve(validSession);
			}
		});
	}

	// get projects
	getProjects() {

		var that = this;

		return new Promise(function (resolve, reject) {

			async.series([

				function (callback) {

					that.getProjectsServiceCall()
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				}
			], function (err, results) {

				if (err) {

					console.log("PLC get projects series error : ", err);

					reject(err);
				}

				resolve(results);

			});
		});
	}

	//call auth service
	authServiceCall() {

		console.log("plc auth");

		var that = this;
		let authUrl = routes.getPlcAuthUrl();

		return new Promise(function (resolve, reject) {

			var options = {
				method: "GET",
				url: authUrl,
				headers: {
					"Cache-Control": "no-cache",
					"Authorization": "Bearer " + that.token
				}
			};

			request(options, function (error, response, body) {

				var resp = {
					"error": null,
					"body": null
				};

				if (error) {

					resp.error = error;
					reject(resp);

				}

				try {

					resp = JSON.parse(body);

				} catch (err) {

					resp.error = err;
					resp.body = body;

					reject(resp);

				} finally {

					resolve(resp);

				}
			});
		});
	}

	//call init session service
	initSessionServiceCall() {

		console.log("plc init session");

		var that = this;
		let initSessionUrl = routes.getPlcInitSessionUrl();

		return new Promise(function (resolve, reject) {

			var options = {
				method: "POST",
				url: initSessionUrl,
				headers: {
					"Cache-Control": "no-cache",
					"Authorization": "Bearer " + that.token
				},
				qs: {
					language: session.LANGUAGE
				}
			};

			request(options, function (error, response, body) {

				var resp = {
					"error": null,
					"body": null
				};

				if (error) {

					resp.error = error;
					reject(resp);
				}

				try {

					resp = JSON.parse(body);
					that.SESSION = resp;

				} catch (err) {

					resp.error = err;
					resp.body = body;

					session.SESSION_ID = null;

					reject(resp);

				} finally {

					if (response.statusCode === httpStatus.OK) {

						session.SESSION_ID = resp.body.CURRENTUSER.ID;

					} else {

						session.SESSION_ID = null;

					}

					resolve(resp);

				}
			});
		});
	}

	// call get plc projects service
	getProjectsServiceCall() {

		console.log("plc getProjects");

		var that = this;
		let projectsUrl = routes.getPlcProjectsUrl();

		return new Promise(function (resolve, reject) {

			that.initSession().then(function () {

				var options = {
					method: "GET",
					url: projectsUrl,
					headers: {
						"Cache-Control": "no-cache",
						"Authorization": "Bearer " + that.token
					}
				};

				request(options, function (error, response, body) {

					var resp = {
						"error": null,
						"body": null
					};

					if (error) {

						resp.error = error;
						reject(resp);
					}

					try {

						resp = JSON.parse(body);

					} catch (err) {

						resp.error = err;
						resp.body = body;

						reject(resp);

					} finally {

						resolve(resp);

					}
				});
			}).catch(function (err) {

				console.log(err);

				reject(err);

			});
		});
	}

	// call get plc calculations service
	getCalculationsServiceCall(sProjectId) {

		console.log("plc getCalculations");

		var that = this;
		let calculationsUrl = routes.getPlcCalculationsUrl();

		return new Promise(function (resolve, reject) {

			that.initSession().then(function () {

				var options = {
					method: "GET",
					url: calculationsUrl,
					headers: {
						"Cache-Control": "no-cache",
						"Authorization": "Bearer " + that.token
					},
					qs: {
						project_id: sProjectId,
						topPerProject: 100000
					}
				};

				request(options, function (error, response, body) {

					var resp = {
						"error": null,
						"body": null
					};

					if (error) {

						resp.error = error;
						reject(resp);
					}

					try {

						resp = JSON.parse(body);

					} catch (err) {

						resp.error = err;
						resp.body = body;

						reject(resp);

					} finally {

						resolve(resp);

					}
				});
			}).catch(function (err) {

				console.log(err);

				reject(err);
			});
		});
	}

}
exports.Dispatcher = module.exports.Dispatcher = Dispatcher;
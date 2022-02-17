/*eslint-env node, es6 */
"use strict";

const request = require("request");
const xsenv = require("@sap/xsenv");
const querystring = require("querystring");

/**
 * @fileOverview
 * 
 * Helper functions used to check if the generated token is valid
 * The token is generated based on the technical user stored into database and the password that is stored into secure store
 * Into server.js the token is checked if it's valid at a regular time interval (every minute)
 * 
 * @name uaaToken.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const EnvironmentVariables = require(global.appRoot + "/lib/util/environmentVariables.js").EnvironmentVariablesUtil;
const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js").SecureStoreService;

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

/** @class
 * @classdesc UAA token utility helpers
 * @name UAAToken 
 */
class UAAToken {

	/** @constructor
	 * Is getting the XSUAA service, the auth token URL and the technical user / password
	 */
	constructor() {

		// get UAA service
		this.uaaService = xsenv.getServices({
			uaa: {
				name: "tapp-uaa-service"
			}
		}).uaa;
		// get UAA service URL
		this.tokenUrl = this.uaaService.url + "/oauth/token";

		this.EnvironmentVariablesUtil = new EnvironmentVariables();
		this.SecureStoreService = new SecureStore();

		this.ACCES_TOKEN = null;
		this.TOKEN_EXPIRE = null;

	}

	/** @function
	 * Used to check if the access token is valid based on the expiration date of actual token retrieved by calling the auth token service
	 * 
	 * @return {boolean} isValid - true / false
	 */
	hasValidToken() {

		let isValid = false;

		if (this.TOKEN_EXPIRE !== null) {

			let ticksPerSecond = 1000;

			let nowCheck = new Date();
			let nowCheckTicks = nowCheck.getTime() + ticksPerSecond * 120;

			let tokenExpireTicks = this.TOKEN_EXPIRE.getTime();

			if (tokenExpireTicks > nowCheckTicks && this.ACCES_TOKEN !== null && this.ACCES_TOKEN.length > 10) {
				isValid = true;
			}
		}

		return isValid;
	}

	/** @function
	 * Used to call the auth token service in order to get a new token by using:
	 *		- the client id and client secret from XSUAA service
	 *		- the technical user retrieved from t_environment_variables table
	 *		- the password of technical user retrieved from secure store
	 * The retrieved token is saved into the global variable
	 */
	async checkToken() {

		if (this.hasValidToken()) {
			return;
		}

		let sClientId = await this.EnvironmentVariablesUtil.getClientIdFromTable();
		let sTechnicalUser = await this.EnvironmentVariablesUtil.getTechnicalUserFromTable();
		if (helpers.isUndefinedOrNull(sClientId) || helpers.isUndefinedOrNull(sTechnicalUser)) {
			return;
		}

		let sClientSecret = await this.SecureStoreService.retrieveKey(sClientId, true);
		if (sClientSecret instanceof PlcException || sClientSecret instanceof Message || helpers.isUndefinedNullOrEmptyString(sClientSecret)) {
			return;
		}

		let sTechnicalPassword = await this.SecureStoreService.retrieveKey(sTechnicalUser, true);
		if (sTechnicalPassword instanceof PlcException || sTechnicalPassword instanceof Message ||
			helpers.isUndefinedNullOrEmptyString(sTechnicalPassword)) {
			return;
		}

		let authForm = {
			"grant_type": "password",
			"client_id": sClientId,
			"client_secret": sClientSecret,
			"username": sTechnicalUser,
			"password": sTechnicalPassword,
			"response_type": "token"
		};

		let formData = querystring.stringify(authForm);
		let contentLength = formData.length;

		let that = this;

		request({
				headers: {
					"Content-Length": contentLength,
					"Content-Type": "application/x-www-form-urlencoded",
					"Accept": "application/json"
				},
				uri: this.tokenUrl,
				body: formData,
				method: "POST"
			},
			function (error, response, body) {

				if (error || response.statusCode !== 200) {
					return;
				}

				try {
					let tokenResp = JSON.parse(body);
					let expire = new Date();
					expire.setSeconds(expire.getSeconds() + parseInt(tokenResp.expires_in));

					that.ACCES_TOKEN = tokenResp.access_token;
					that.TOKEN_EXPIRE = expire;

					// add bearer token to global variable
					global.TECHNICAL_BEARER_TOKEN = tokenResp.access_token;

					// add technical user to global variable
					global.TECHNICAL_USER = sTechnicalUser.toUpperCase();

				} catch (err) {
					// err
				}
			});
	}
}

exports.UAAToken = module.exports.UAAToken = UAAToken;
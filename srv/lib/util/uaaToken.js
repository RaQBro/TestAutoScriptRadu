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
// const Message = require(global.appRoot + "/lib/util/message.js").Message;
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser.js").TechnicalUserUtil;
const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js").SecureStoreService;

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
				tag: "xsuaa"
			}
		}).uaa;
		// get UAA service URL
		this.tokenUrl = this.uaaService.url + "/oauth/token";

		this.TechnicalUserUtil = new TechnicalUser();
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

		var isValid = false;

		if (this.TOKEN_EXPIRE !== null) {

			let ticksPerSecond = 1000;

			let nowCheck = new Date();
			let nowCheckTicks = nowCheck.getTime() + ticksPerSecond * 120;

			let tokenExpireTicks = this.TOKEN_EXPIRE.getTime();

			if (tokenExpireTicks > nowCheckTicks && this.ACCES_TOKEN !== null && this.ACCES_TOKEN.length > 10) {
				isValid = true;
				// Message.addLog(0, "Token isValid is TRUE - nowCheckTicks = " + nowCheckTicks + ", tokenExpireTicks = " + tokenExpireTicks, "message");
			} else {
				// Message.addLog(0, "Token isValid is FALSE - nowCheckTicks = " + nowCheckTicks + ", tokenExpireTicks = " + tokenExpireTicks, "error");
			}
		}

		return isValid;
	}

	/** @function
	 * Used to call the auth token service in order to get a new token by using:
	 *		- the client id and client secret from XSUAA service
	 *		- the technical user retrieved from t_technical_user table
	 *		- the password of technical user retrieved from secure store
	 * The retrieved token is saved into the global variable
	 */
	async checkToken() {

		if (this.hasValidToken()) {
			return;
		}

		const sTechnicalUser = await this.TechnicalUserUtil.getTechnicalUserFromTable();
		if (helpers.isUndefinedOrNull(sTechnicalUser)) {
			return;
		}
		const sTechnicalPassword = await this.SecureStoreService.retrieveKey(sTechnicalUser, true);
		if (helpers.isUndefinedNullOrEmptyString(sTechnicalPassword)) {
			return;
		}

		var authForm = {
			"grant_type": "password",
			"client_id": this.uaaService.clientid,
			"client_secret": this.uaaService.clientsecret,
			"username": sTechnicalUser,
			"password": sTechnicalPassword,
			"response_type": "token"
		};

		var formData = querystring.stringify(authForm);
		var contentLength = formData.length;

		var that = this;

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
					// Message.addLog(0, "BEARER_TOKEN request failed. Body: ", "error", body);
					// Message.addLog(0, "BEARER_TOKEN request failed. Error: ", "error", error);
					return;
				}

				try {
					var tokenResp = JSON.parse(body);
					// Message.addLog(0, "BEARER_TOKEN Response: ", "message", tokenResp);

					var expire = new Date();
					expire.setSeconds(expire.getSeconds() + parseInt(tokenResp.expires_in));

					that.ACCES_TOKEN = tokenResp.access_token;
					that.TOKEN_EXPIRE = expire;

					// add bearer token to global variable
					global.TECHNICAL_BEARER_TOKEN = tokenResp.access_token;

					// add technical user to global variable
					global.TECHNICAL_USER = sTechnicalUser.toUpperCase();

					// Message.addLog(0, "BEARER_TOKEN : ", "message", tokenResp.access_token);
				} catch (err) {
					// Message.addLog(0, "[UAAToken ERROR]", "error", err);
				}
			});
	}
}

exports.UAAToken = module.exports.UAAToken = UAAToken;
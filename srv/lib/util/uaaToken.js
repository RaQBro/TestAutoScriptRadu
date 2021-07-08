/*eslint-env node, es6 */
"use strict";

const request = require("request");
const xsenv = require("@sap/xsenv");
const querystring = require("querystring");

const helpers = require(global.appRoot + "/lib/util/helpers");
const TechnicalUser = require(global.appRoot + "/lib/util/technicalUser").TechnicalUser;
const SecureStoreService = require(global.appRoot + "/lib/routerService/secureStoreService.js").SecureStore;

class UAAToken {

	// constructor
	constructor() {

		// get UAA service
		this.uaaService = xsenv.getServices({
			uaa: {
				tag: "xsuaa"
			}
		}).uaa;
		// get UAA service URL
		this.tokenUrl = this.uaaService.url + "/oauth/token";

		this.technicalUser = new TechnicalUser();
		this.secureStoreService = new SecureStoreService();

		this.ACCES_TOKEN = null;
		this.TOKEN_EXPIRE = null;
	}

	hasValidToken() {

		var isValid = false;

		if (this.TOKEN_EXPIRE !== null) {

			const epochTicks = 621355968000000000;
			const ticksPerMillisecond = 10000;

			var nowCheck = new Date();
			var nowCheckTicks = epochTicks + (nowCheck.getTime() * ticksPerMillisecond);

			var tokenExpireTicks = epochTicks + (this.TOKEN_EXPIRE.getTime() * ticksPerMillisecond);

			if (tokenExpireTicks > nowCheckTicks && this.ACCES_TOKEN !== null && this.ACCES_TOKEN.length > 10) {
				isValid = true;
				// console.log("Token isValid is TRUE - nowCheckTicks = " + nowCheckTicks + ", tokenExpireTicks = " + tokenExpireTicks);
			} else {
				// console.log("Token isValid is FALSE - nowCheckTicks = " + nowCheckTicks + ", tokenExpireTicks = " + tokenExpireTicks);
			}
		}

		return isValid;
	}

	async checkToken() {

		if (this.hasValidToken()) {
			return;
		}

		let sTechnicalUser = await this.technicalUser.getTechnicalFromDefaultValuesTable();
		if (helpers.isUndefinedNullOrEmptyObject(sTechnicalUser)) {
			return;
		}
		let sTechnicalPassword = await this.secureStoreService.retrieveKey(sTechnicalUser, true);
		if (helpers.isUndefinedNullOrEmptyObject(sTechnicalPassword) || sTechnicalPassword === "") {
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
					console.log("BEARER_TOKEN request failed : ", body);
					console.log("Error : ", error);
					return;
				}

				try {
					var tokenResp = JSON.parse(body);
					//console.log("BEARER_TOKEN resp : ", tokenResp);

					var expire = new Date();
					expire.setSeconds(expire.getSeconds() + parseInt(tokenResp.expires_in));

					that.ACCES_TOKEN = tokenResp.access_token;
					that.TOKEN_EXPIRE = expire;

					// add bearer token to global variable
					global.TECHNICAL_BEARER_TOKEN = tokenResp.access_token;

					// console.log("BEARER_TOKEN : ", tokenResp.access_token);
				} catch (err) {
					console.log("[UAAToken ERROR]", err);
				}
			});
	}
}

exports.UAAToken = module.exports.UAAToken = UAAToken;
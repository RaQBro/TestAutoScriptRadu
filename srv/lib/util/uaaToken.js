/*eslint-env node, es6 */
"use strict";

const xsenv = require("@sap/xsenv");
const axios = require("axios");
const qs = require("qs");

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
const ApplicationSettings = require(global.appRoot + "/lib/util/applicationSettings.js").ApplicationSettingsUtil;
const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js").SecureStoreService;

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Code = MessageLibrary.Code;
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

		this.plcAuthClient = axios.create({
			baseURL: this.uaaService.url,
			timeout: 5000,
			method: "POST",
			maxRedirects: 0
		});

		this.ApplicationSettingsUtil = new ApplicationSettings();
		this.SecureStoreService = new SecureStore();

		this.APPLICATION_USER_ACCESS_TOKEN = null;
		this.APPLICATION_USER_TOKEN_EXPIRE = null;
		this.TECHNICAL_USER_ACCESS_TOKEN = null;
		this.TECHNICAL_USER_TOKEN_EXPIRE = null;
	}

	/** @function
	 * Used to check if the access token of the application user is valid based on the expiration date of actual token
	 * 
	 * @return {boolean} isValid - true / false
	 */
	hasApplicationUserValidToken() {

		let isValid = false;

		if (this.APPLICATION_USER_TOKEN_EXPIRE !== null) {

			let ticksPerSecond = 1000;

			let nowCheck = new Date();
			let nowCheckTicks = nowCheck.getTime() + ticksPerSecond * 120;

			let tokenExpireTicks = this.APPLICATION_USER_TOKEN_EXPIRE.getTime();

			if (tokenExpireTicks > nowCheckTicks && this.APPLICATION_USER_ACCESS_TOKEN !== null && this.APPLICATION_USER_ACCESS_TOKEN.length > 10) {
				isValid = true;
			}
		}

		return isValid;
	}

	/** @function
	 * Used to check if the access token of the technical user is valid based on the expiration date of actual token
	 * 
	 * @return {boolean} isValid - true / false
	 */
	hasTechnicalUserValidToken() {

		let isValid = false;

		if (this.TECHNICAL_USER_TOKEN_EXPIRE !== null) {

			let ticksPerSecond = 1000;

			let nowCheck = new Date();
			let nowCheckTicks = nowCheck.getTime() + ticksPerSecond * 120;

			let tokenExpireTicks = this.TECHNICAL_USER_TOKEN_EXPIRE.getTime();

			if (tokenExpireTicks > nowCheckTicks && this.TECHNICAL_USER_ACCESS_TOKEN !== null && this.TECHNICAL_USER_ACCESS_TOKEN.length > 10) {
				isValid = true;
			}
		}

		return isValid;
	}

	/** @function
	 * Used to call the auth token service in order to get a new access token for the application user by using:
	 *		- the plc client id and client secret from XSUAA service
	 * The retrieved token is saved into the global variable
	 */
	async retrieveApplicationUserToken(token) {

		if (this.hasApplicationUserValidToken()) {
			return;
		}

		let sPlcClientId = await this.ApplicationSettingsUtil.getClientIdFromTable();
		if (helpers.isUndefinedNullOrEmptyString(sPlcClientId)) {
			let sDeveloperInfo = "Please provide a client id and client secret into administration section of application!";
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sDeveloperInfo);
		}

		let sPlcClientSecret = await this.SecureStoreService.retrieveKey(sPlcClientId, true);
		if (sPlcClientSecret instanceof PlcException || sPlcClientSecret instanceof Message ||
			helpers.isUndefinedNullOrEmptyString(sPlcClientSecret)) {
			return;
		}

		let that = this;

		await this.plcAuthClient
			.request({
				url: "/oauth/token",
				data: qs.stringify({
					"client_id": sPlcClientId,
					"grant_type": "user_token"
				}),
				headers: {
					"Authorization": token,
					"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
				}
			})
			.then(async userTokenResponse => {
				await that.plcAuthClient
					.request({
						url: "/oauth/token",
						data: qs.stringify({
							"client_id": sPlcClientId,
							"client_secret": sPlcClientSecret,
							"grant_type": "refresh_token",
							"refresh_token": userTokenResponse.data.refresh_token
						}),
						headers: {
							"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
						}
					})
					.then(refreshTokenResponse => {
						let expire = new Date();
						expire.setSeconds(expire.getSeconds() + parseInt(refreshTokenResponse.data.expires_in));

						this.APPLICATION_USER_ACCESS_TOKEN = refreshTokenResponse.data.access_token;
						this.APPLICATION_USER_TOKEN_EXPIRE = expire;
					})
					.catch(error => {
						throw new Error("Exception during access token retrieval: " + JSON.stringify(error));
					});
			})
			.catch(error => {
				throw new Error("Exception during refresh token retrieval: " + JSON.stringify(error));
			});
	}

	/** @function
	 * Used to call the auth token service in order to get a new access token for the technical user by using:
	 *		- the plc client id and client secret from XSUAA service
	 *		- the technical user retrieved from t_application_settings table
	 *		- the password of technical user retrieved from secure store
	 * The retrieved token is saved into the global variable
	 */
	async retrieveTechnicalUserToken() {

		let sTechnicalUser = await this.ApplicationSettingsUtil.getTechnicalUserFromTable();
		if (helpers.isUndefinedNullOrEmptyString(sTechnicalUser)) {
			return;
		}

		if (sTechnicalUser === global.TECHNICAL_USER && this.hasTechnicalUserValidToken()) {
			return;
		}

		let sPlcClientId = await this.ApplicationSettingsUtil.getClientIdFromTable();
		if (helpers.isUndefinedNullOrEmptyString(sPlcClientId)) {
			return;
		}

		let sPlcClientSecret = await this.SecureStoreService.retrieveKey(sPlcClientId, true);
		if (sPlcClientSecret instanceof PlcException || sPlcClientSecret instanceof Message ||
			helpers.isUndefinedNullOrEmptyString(sPlcClientSecret)) {
			return;
		}

		let sTechnicalPassword = await this.SecureStoreService.retrieveKey(sTechnicalUser, true);
		if (sTechnicalPassword instanceof PlcException || sTechnicalPassword instanceof Message ||
			helpers.isUndefinedNullOrEmptyString(sTechnicalPassword)) {
			return;
		}

		let that = this;

		await this.plcAuthClient
			.request({
				url: "/oauth/token",
				data: qs.stringify({
					"grant_type": "password",
					"client_id": sPlcClientId,
					"client_secret": sPlcClientSecret,
					"username": sTechnicalUser,
					"password": sTechnicalPassword,
					"response_type": "token"
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
				}
			})
			.then(userTokenResponse => {
				let expire = new Date();
				expire.setSeconds(expire.getSeconds() + parseInt(userTokenResponse.data.expires_in));

				that.TECHNICAL_USER_ACCESS_TOKEN = userTokenResponse.data.access_token;
				that.TECHNICAL_USER_TOKEN_EXPIRE = expire;

				// add bearer token to global variable
				global.TECHNICAL_USER_BEARER_TOKEN = userTokenResponse.data.access_token;

				// add technical user to global variable
				global.TECHNICAL_USER = sTechnicalUser.toUpperCase();
			})
			.catch(error => {
				throw new Error("Exception during refresh token retrieval: " + JSON.stringify(error));
			});
	}
}

exports.UAAToken = module.exports.UAAToken = UAAToken;
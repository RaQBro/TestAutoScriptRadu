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
const ApplicationSettings = require(global.appRoot + "/lib/util/applicationSettings.js");
const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js");

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

		// get UAA service of PLC
		this.plcUaaService = xsenv.getServices({
			uaa: {
				name: "xsac-plc-uaa-service"
			}
		}).uaa;

		this.plcAuthClient = axios.create({
			baseURL: this.plcUaaService.url,
			timeout: 5000,
			method: "POST",
			maxRedirects: 0
		});

		this.ApplicationSettingsUtil = new ApplicationSettings();
		this.SecureStoreService = new SecureStore();

		this.TECHNICAL_USER_ACCESS_TOKEN = null;
		this.TECHNICAL_USER_TOKEN_EXPIRE = null;
	}

	/** @function
	 * Used to check if the access token of the application user is valid based on the expiration date of actual token
	 * 
	 * @return {boolean} isValid - true / false
	 */
	hasApplicationUserValidToken(sCurrentUser) {

		let isValid = false;
		let dApplicationUserTokenExpire = global.appUserTokenExpire[sCurrentUser];

		if (dApplicationUserTokenExpire !== undefined) {

			let ticksPerSecond = 1000;

			let nowCheck = new Date();
			let nowCheckTicks = nowCheck.getTime() + ticksPerSecond * 120;

			let tokenExpireTicks = dApplicationUserTokenExpire.getTime();

			let sApplicationUserToken = global.appUserToken[sCurrentUser];

			if (tokenExpireTicks > nowCheckTicks && sApplicationUserToken !== undefined && sApplicationUserToken.length > 10) {
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
	 *		- the plc client id and client secret from XSUAA PLC service
	 * The retrieved token is saved into the global variable
	 */
	async retrieveApplicationUserToken(request) {

		let sCurrentUser = request.user.id.toUpperCase();

		if (this.hasApplicationUserValidToken(sCurrentUser)) {
			return global.appUserToken[sCurrentUser];
		}

		let that = this;

		await this.plcAuthClient
			.request({
				url: "/oauth/token",
				data: qs.stringify({
					"client_id": that.plcUaaService.clientid,
					"grant_type": "user_token"
				}),
				headers: {
					"Authorization": request.headers.authorization,
					"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
				}
			})
			.then(async userTokenResponse => {
				await that.plcAuthClient
					.request({
						url: "/oauth/token",
						data: qs.stringify({
							"client_id": that.plcUaaService.clientid,
							"client_secret": that.plcUaaService.clientsecret,
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

						// add bearer token and expire date to global variable for this user
						global.appUserToken[sCurrentUser] = refreshTokenResponse.data.access_token;
						global.appUserTokenExpire[sCurrentUser] = expire;

					})
					.catch(error => {
						throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, "Exception during access token retrieval.", error);
					});
			})
			.catch(error => {
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, "Exception during refresh token retrieval.", error);
			});

		return global.appUserToken[sCurrentUser];
	}

	/** @function
	 * Used to call the auth token service in order to get a new access token for the technical user by using:
	 *		- the plc client id and client secret from XSUAA PLC service
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
					"client_id": that.plcUaaService.clientid,
					"client_secret": that.plcUaaService.clientsecret,
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
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, "Exception during refresh token retrieval.", error);
			});
	}

	/** @function
	 * Used to call the auth token service in order to check if access token for the technical user can be retrieved using:
	 *		- the technical user retrieved from t_application_settings table or provided from the UI
	 *		- the password of technical user retrieved from secure store or provided from the UI
	 * If some of the values are incorrect the error message will raised. If with success the token is returned.
	 */
	async checkTechnicalUserToken(sTechnicalUser, sTechnicalPassword) {

		let sTechnicalUserAccessToken;

		let that = this;

		await this.plcAuthClient
			.request({
				url: "/oauth/token",
				data: qs.stringify({
					"grant_type": "password",
					"client_id": that.plcUaaService.clientid,
					"client_secret": that.plcUaaService.clientsecret,
					"username": sTechnicalUser,
					"password": sTechnicalPassword,
					"response_type": "token"
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
				}
			})
			.then(userTokenResponse => {
				sTechnicalUserAccessToken = userTokenResponse.data.access_token;
			})
			.catch(error => {
				let sDeveloperInfo =
					"The credentials of Technical User are not correct. Please try again!";
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, error);
			});

		return sTechnicalUserAccessToken;
	}

}

module.exports = UAAToken;

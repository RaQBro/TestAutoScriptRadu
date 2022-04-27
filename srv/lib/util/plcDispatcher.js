/*eslint-env node, es6 */
"use strict";

const axios = require("axios");

/**
 * @fileOverview
 * 
 * Used to make HTTP calls to standard PLC public and private backend services
 * 
 * @name plcDispatcher.js
 */

const Code = require(global.appRoot + "/lib/util/message").Code;
const helpers = require(global.appRoot + "/lib/util/helpers.js");
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;
const UaaToken = require(global.appRoot + "/lib/util/uaaToken.js");

/** @class
 * @classdesc PLC dispatcher utility helpers for call of public and private backend services
 * @name PlcDispatcher 
 */
class PlcDispatcher {

	/** @constructor
	 * Check if is a web request or request from a job and is getting the token:
	 *		- for web and job request (real or fake) from the global variable that contains the bearer token generated from technical user
	 * 
	 * request.IS_ONLINE_MODE if true online mode otherwise could be background job or fake backgound job (in this case we will use technical user)
	 * 
	 * @param {object} request - web request / job request
	 */
	constructor(request) {
		this.request = request;
	}

	/** @function
	 * Creates a request object based on the input parameters and calls the dispatcher of private standard PLC backend
	 * Will throw error in job context if the technical user is not maintained into database and the password is not stored into secure store
	 * 
	 * @throws {@link PlcException}
	 * <br> HTTP Status Code: 500 - GENERAL_UNEXPECTED_EXCEPTION
	 * <br> Message: Please check if technical user is maintained and if PLC endpoints are maintained into global environment variables.
	 * 
	 * @param {string} sQueryPath - the URL query path to an individual endpoint. Example: "init-session" or "administration"
	 * @param {string} sMethod - the HTTP method. Example: "GET" or "POST"
	 * @param {array} aParams - a list of parameters that are required for service request
	 * @param {object} oBodyData - the request body data
	 * @return {object} oResponse - the response object of the service that was called
	 */
	async dispatchPrivateApi(sQueryPath, sMethod, aParams, oBodyData) {

		let sToken;
		let bIsOnline;

		if (helpers.isRequestFromJob(this.request) || (this.request.IS_ONLINE_MODE !== undefined && this.request.IS_ONLINE_MODE === false)) {
			sToken = global.TECHNICAL_USER_BEARER_TOKEN; // bearer token generated for technical user
			bIsOnline = false;
		} else {
			let UAAToken = new UaaToken.UAAToken();
			await UAAToken.retrieveApplicationUserToken(this.request.headers.authorization);
			sToken = UAAToken.APPLICATION_USER_ACCESS_TOKEN;
			bIsOnline = true;
		}

		let oPrivateRequestClient = axios.create({
			baseURL: global.plcXsjsUrl,
			// timeout: 5000,
			method: sMethod,
			maxRedirects: 0
		});

		let oParams = {};
		let sPrivateParams = " ";

		if (aParams !== undefined && aParams.length > 0) {
			for (let oPram of aParams) {
				let key = oPram.name;
				let value = oPram.value;
				sPrivateParams += key + "=" + value + " ";
				oParams[key] = value;
			}
		}

		let oResponse;

		await oPrivateRequestClient
			.request({
				url: "/xs/rest/dispatcher.xsjs/" + sQueryPath,
				data: oBodyData !== undefined ? JSON.stringify(oBodyData) : undefined,
				headers: {
					"Cache-Control": "no-cache",
					"Authorization": "Bearer " + sToken,
					"Content-Type": "application/json"
				},
				params: oParams
			})
			.then(response => {

				oResponse = response;

			})
			.catch(error => {

				if (error.response !== undefined && error.response.data !== undefined && typeof (error.response.data) === "object") {

					oResponse = error.response;

				} else { // unexpected error if response is not an object

					let oDetails = {
						"requestMethod": sMethod,
						"requestQueryPath": sQueryPath,
						"requestParameters": sPrivateParams,
						"responseCode": error.response.status,
						"responseMessage": error.response.statusText,
						"responseBody": error.response.data
					};

					let sDeveloperInfo;
					if (bIsOnline === true) {
						sDeveloperInfo = "Unexpected error occured. Please try again or contact your system administrator.";
					} else {
						sDeveloperInfo =
							"Please check if technical user is maintained and if PLC endpoints are maintained into global environment variables.";
					}
					throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oDetails, error);
				}
			});

		return oResponse;
	}

	/** @function
	 * Creates a request object based on the input parameters and calls the public standard PLC backend
	 * Will throw error in job context if the technical user is not maintained into database and the password is not stored into secure store
	 * 
	 * @throws {@link PlcException}
	 * <br> HTTP Status Code: 500 - GENERAL_UNEXPECTED_EXCEPTION
	 * <br> Message: Please check if technical user is maintained and if PLC endpoints are maintained into global environment variables.
	 * 
	 * @param {string} sQueryPath - the URL query path to an individual endpoint. Example: "folders" or "priceSources"
	 * @param {string} sMethod - the HTTP method. Example: "PUT" or "DELETE"
	 * @param {array} aParams - a list of parameters that are required for service request
	 * @param {object} oBodyData - the request body data
	 * @return {object} oResponse - the response object of the service that was called
	 */
	async dispatchPublicApi(sQueryPath, sMethod, aParams, oBodyData) {

		let sToken;
		let bIsOnline;

		if (helpers.isRequestFromJob(this.request) || (this.request.IS_ONLINE_MODE !== undefined && this.request.IS_ONLINE_MODE === false)) {
			sToken = global.TECHNICAL_USER_BEARER_TOKEN; // bearer token generated for technical user
			bIsOnline = false;
		} else {
			let UAAToken = new UaaToken.UAAToken();
			await UAAToken.retrieveApplicationUserToken(this.request.headers.authorization);
			sToken = UAAToken.APPLICATION_USER_ACCESS_TOKEN;
			bIsOnline = true;
		}

		let oPublicRequestClient = axios.create({
			baseURL: global.plcPublicApiUrl,
			// timeout: 5000,
			method: sMethod,
			maxRedirects: 0
		});

		let oParams = {};
		let sPublicParams = " ";

		if (aParams !== undefined && aParams.length > 0) {
			for (let oPram of aParams) {
				let key = oPram.name;
				let value = oPram.value;
				sPublicParams += key + "=" + value + " ";
				oParams[key] = value;
			}
		}

		let oResponse;

		await oPublicRequestClient
			.request({
				url: "/api/v1/" + sQueryPath,
				data: oBodyData !== undefined ? JSON.stringify(oBodyData) : undefined,
				headers: {
					"Cache-Control": "no-cache",
					"Authorization": "Bearer " + sToken,
					"Content-Type": "application/json"
				},
				params: oParams
			})
			.then(response => {

				oResponse = response;

			})
			.catch(error => {

				if (error.response !== undefined && error.response.data !== undefined && typeof (error.response.data) === "object") {

					oResponse = error.response;

				} else { // unexpected error if response is not an object

					let oDetails = {
						"requestMethod": sMethod,
						"requestQueryPath": sQueryPath,
						"requestParameters": sPublicParams,
						"responseCode": error.response.status,
						"responseMessage": error.response.statusText,
						"responseBody": error.response.data
					};

					let sDeveloperInfo;
					if (bIsOnline === true) {
						sDeveloperInfo = "Unexpected error occured. Please try again or contact your system administrator.";
					} else {
						sDeveloperInfo =
							"Please check if technical user is maintained and if PLC endpoints are maintained into global environment variables.";
					}
					throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oDetails, error);
				}
			});

		return oResponse;
	}
}
exports.PlcDispatcher = module.exports.PlcDispatcher = PlcDispatcher;
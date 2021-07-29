/*eslint-env node, es6 */
"use strict";

const util = require("util");
const makeRequest = util.promisify(require("request"));

/**
 * @fileOverview
 * 
 * Used to make HTTP calls to standard PLC public and private backend services
 * 
 * @name plcDispatcher.js
 */

const Code = require(global.appRoot + "/lib/util/message").Code;
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;

/** @class
 * @classdesc PLC dispatcher utility helpers for call of public and private backend services
 * @name PlcDispatcher 
 */
class PlcDispatcher {

	/** @constructor
	 * Check if is a web request or request from a job and is getting the token:
	 *		- for job request (real or fake) from the global variable that contains the bearer token generated from technical user
	 *		- for web request from the authentication information of request
	 * 
	 * request.IS_ONLINE_MODE if true online mode otherwise could be background job or fake backgound job (in this case we will use technical user)
	 * 
	 * @param {object} request - web request / job request
	 */
	constructor(request) {

		if ((request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === true) || request.user.id !== undefined) {
			this.token = request.authInfo.getAppToken();
		} else {
			this.token = global.TECHNICAL_BEARER_TOKEN; // bearer token generated from technical user
		}

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

		var oPrivateRequestOptions = {
			method: sMethod,
			url: global.plcXsjsUrl + "/xs/rest/dispatcher.xsjs/" + sQueryPath,
			headers: {
				"Cache-Control": "no-cache",
				"Authorization": "Bearer " + this.token,
				"json": true
			}
		};

		var sPrivateParams = " ";
		if (aParams !== undefined && aParams.length > 0) {
			oPrivateRequestOptions.qs = {};
			for (var i = 0; i < aParams.length; i++) {
				const key = aParams[i].name;
				const value = aParams[i].value;
				sPrivateParams += key + "=" + value + " ";
				oPrivateRequestOptions.qs[key] = value;
			}
		}

		if (oBodyData !== undefined) {
			oPrivateRequestOptions.body = JSON.stringify(oBodyData);
		}

		const oResponse = await makeRequest(oPrivateRequestOptions);

		try {
			JSON.parse(oResponse.body);
		} catch (e) {
			const oDetails = {
				"requestMethod": sMethod,
				"requestQueryPath": sQueryPath,
				"requestParameters": sPrivateParams,
				"responseCode": oResponse.statusCode,
				"responseMessage": oResponse.statusMessage,
				"responseBody": oResponse.body
			};
			const sDeveloperInfo =
				"Please check if technical user is maintained and if PLC endpoints are maintained into global environment variables.";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oDetails, e);
		}

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

		var oPublicRequestOptions = {
			method: sMethod,
			url: global.plcPublicApiUrl + "/api/v1/" + sQueryPath,
			headers: {
				"Cache-Control": "no-cache",
				"Authorization": "Bearer " + this.token,
				"Content-Type": "application/json"
			}
		};

		var sPublicParams = " ";
		if (aParams !== undefined && aParams.length > 0) {
			oPublicRequestOptions.qs = {};
			for (var i = 0; i < aParams.length; i++) {
				const key = aParams[i].name;
				const value = aParams[i].value;
				sPublicParams += key + "=" + value + " ";
				oPublicRequestOptions.qs[key] = value;
			}
		}

		if (oBodyData !== undefined) {
			oPublicRequestOptions.body = JSON.stringify(oBodyData);
		}

		const oResponse = await makeRequest(oPublicRequestOptions);

		if (oResponse.statusCode !== 204) {

			try {
				JSON.parse(oResponse.body);
			} catch (e) {
				const oDetails = {
					"requestMethod": sMethod,
					"requestQueryPath": sQueryPath,
					"requestParameters": sPublicParams,
					"responseCode": oResponse.statusCode,
					"responseMessage": oResponse.statusMessage,
					"responseBody": oResponse.body
				};
				const sDeveloperInfo =
					"Please check if technical user is maintained and if PLC endpoints are maintained into global environment variables.";
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oDetails, e);
			}

		}

		return oResponse;
	}

}
exports.PlcDispatcher = module.exports.PlcDispatcher = PlcDispatcher;
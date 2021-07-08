/*eslint-env node, es6 */
"use strict";

const util = require("util");
const makeRequest = util.promisify(require("request"));

const Code = require(global.appRoot + "/lib/util/message").Code;
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;

const Routes = require(global.appRoot + "/lib/util/standardPlcRoutes.js");
const routes = new Routes.StandardPlcRoutes();

class PlcDispatcher {

	constructor(request) {

		if (request.user.id === undefined) { // undefined in job context
			this.token = global.TECHNICAL_BEARER_TOKEN; // bearer token generated from technical user
		} else {
			this.token = request.authInfo.getAppToken();
		}

	}

	async dispatch(sQueryPath, sMethod, aParams, oBodyData) {

		var oRequestOptions = {
			method: sMethod,
			url: routes.getPlcDispatcherUrl() + "/" + sQueryPath,
			headers: {
				"Cache-Control": "no-cache",
				"Authorization": "Bearer " + this.token,
				"json": true
			}
		};

		let sParams = " ";
		if (aParams !== undefined && aParams.length > 0) {
			oRequestOptions.qs = {};
			for (var i = 0; i < aParams.length; i++) {
				let key = aParams[i].name;
				let value = aParams[i].value;
				sParams += key + "=" + value + " ";
				oRequestOptions.qs[key] = value;
			}
		}

		if (oBodyData !== undefined) {
			oRequestOptions.body = JSON.stringify(oBodyData);
		}

		let oResponse = await makeRequest(oRequestOptions);

		try {
			JSON.parse(oResponse.body);
		} catch (e) {
			let sDeveloperInfo =
				`Failed to execute PLC Request: ${sMethod} / ${sQueryPath + sParams}. PLC Response: ${oResponse.statusCode} - ${oResponse.statusMessage} : ${oResponse.body}.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, e);
		}

		return oResponse;

	}

}
exports.PlcDispatcher = module.exports.PlcDispatcher = PlcDispatcher;
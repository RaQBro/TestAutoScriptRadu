/*eslint-env node, es6 */
"use strict";

const xsenv = require("@sap/xsenv");
const hdbext = require("@sap/hdbext");

/**
 * @fileOverview
 * 
 * List of all service implementations of Secure Store Routes
 * 
 * @name secureStoreService.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Code = MessageLibrary.Code;
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

/** @class
 * @classdesc Secure store services
 * @name SecureStoreService 
 */
class SecureStoreService {

	constructor() {}

	/** @function
	 * Used to retrieve from the secure store the password of technical user
	 * Is also used in uaaToken.js file to generate an auth token based on the technical user + password
	 * For web request the password is not returned due to security constrains
	 * 
	 * @param {string} sKey - technical user name
	 * @param {boolean} bReturnValue - flag indicating if the password should be returned, if false info message is returned
	 * @return {object} result / error - success message / the error
	 */
	async retrieveKey(sKey, bReturnValue) {

		let oInputParams = {
			KEY: sKey,
			STORE_NAME: "TEMPLATE_APPLICATION_STORE",
			FOR_XS_APPLICATIONUSER: true
		};
		let client = await this.getSecureStore();

		return new Promise((resolve) => {

			if (helpers.isUndefinedOrNull(sKey)) {
				let sDeveloperInfo = "Please provide URL parameter KEY. E.g.: ?KEY=TECHNICAL_USER_NAME";
				let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
				resolve(oPlcException);
			}

			hdbext.loadProcedure(client, "SYS", "USER_SECURESTORE_RETRIEVE", (err, sp) => {
				if (err) {
					let sDeveloperInfo = `Failed to retrieve key '${sKey}' from secure store!`;
					let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, err);
					resolve(oPlcException);
				}
				sp(oInputParams, (error, parameters) => {
					if (error) {
						let sDeveloperInfo = `Failed to retrieve key '${sKey}' from secure store!`;
						let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
						resolve(oPlcException);
					}
					if (bReturnValue === true) {
						if (!helpers.isUndefinedOrNull(parameters) && !helpers.isUndefinedOrNull(parameters.VALUE)) {
							resolve(parameters.VALUE.toString("utf8"));
						} else {
							resolve("");
						}
					} else {
						if (parameters.VALUE) {
							let sMessageInfo = `Value of Key '${sKey}' exists into secure store!`;
							let oMessage = new Message(sMessageInfo);
							resolve(oMessage);
						} else {
							let sDeveloperInfo = `Value of Key '${sKey}' not found into secure store!`;
							let oPlcException = new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sDeveloperInfo);
							resolve(oPlcException);
						}
					}
				});
			});
		});
	}

	/** @function
	 * Used to insert into the secure store the password of technical user
	 * 
	 * @param {string} sKey - technical user name
	 * @param {string} sValue - technical user password
	 * @return {object} result / error - success message / the error
	 */
	async insertKey(sKey, sValue) {

		if (helpers.isUndefinedOrNull(sKey)) {
			let sDeveloperInfo = "Please provide URL parameter KEY. E.g.: ?KEY=TECHNICAL_USER_NAME";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}
		if (helpers.isUndefinedNullOrEmptyString(sValue)) {
			let sDeveloperInfo = "Please provide a value into request body. E.g.: " + JSON.stringify({
				"VALUE": "password"
			});
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}
		let oInputParams = {
			KEY: sKey,
			VALUE: Buffer.from(sValue),
			STORE_NAME: "TEMPLATE_APPLICATION_STORE",
			FOR_XS_APPLICATIONUSER: true
		};
		let client = await this.getSecureStore();

		return new Promise((resolve, reject) => {
			hdbext.loadProcedure(client, "SYS", "USER_SECURESTORE_INSERT", (err, sp) => {
				if (err) {
					let sDeveloperInfo = `Failed to insert key '${sKey}' into secure store!`;
					let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, err);
					reject(oPlcException);
				}
				sp(oInputParams, (error) => {
					if (error) {
						let sDeveloperInfo = `Failed to insert key '${sKey}' into secure store!`;
						let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
						reject(oPlcException);
					}
					let sMessageInfo = `Value for key '${sKey}' saved with success into secure store!`;
					let oMessage = new Message(sMessageInfo);
					resolve(oMessage);
				});
			});
		});

	}

	/** @function
	 * Used to delete the password of technical user from secure store
	 * 
	 * @param {string} sKey - technical user name
	 * @return {object} result / error - success message / the error
	 */
	async deleteKey(sKey) {

		if (helpers.isUndefinedOrNull(sKey)) {
			let sDeveloperInfo = "Please provide URL parameter KEY. E.g.: ?KEY=TECHNICAL_USER_NAME";
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
		}
		let oInputParams = {
			KEY: sKey,
			STORE_NAME: "TEMPLATE_APPLICATION_STORE",
			FOR_XS_APPLICATIONUSER: true
		};
		let client = await this.getSecureStore();

		return new Promise((resolve, reject) => {
			hdbext.loadProcedure(client, "SYS", "USER_SECURESTORE_DELETE", (err, sp) => {
				if (err) {
					let sDeveloperInfo = `Failed to delete key '${sKey}' from secure store!`;
					let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, err);
					reject(oPlcException);
					reject(err);
				}
				sp(oInputParams, (error) => {
					if (error) {
						let sDeveloperInfo = `Failed to delete key '${sKey}' from secure store!`;
						let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
						reject(oPlcException);
					}
					let sMessageInfo = `Value for key '${sKey}' was deleted with success from secure store!`;
					let oMessage = new Message(sMessageInfo);
					resolve(oMessage);
				});
			});
		});
	}

	/** @function
	 * Used to get the secure store
	 * 
	 * @return {object} result / error - the secure store client / the error
	 */
	getSecureStore() {
		return new Promise((resolve, reject) => {
			let hanaOptions = xsenv.getServices({
				secureStore: {
					name: "secureStore"
				}
			});
			hdbext.createConnection(hanaOptions.secureStore, (error, client) => {
				if (error) {
					let sDeveloperInfo = "Failed to get the secure store!";
					let oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, undefined, error);
					reject(oPlcException);
				} else {
					resolve(client);
				}
			});
		});
	}

}
exports.SecureStoreService = module.exports.SecureStoreService = SecureStoreService;
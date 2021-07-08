/*eslint-env node, es6 */
"use strict";

const xsenv = require("@sap/xsenv");
const hdbext = require("@sap/hdbext");

const helpers = require(global.appRoot + "/lib/util/helpers");

const Code = require(global.appRoot + "/lib/util/message").Code;
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;

class SecureStore {

	// constructor
	constructor() {

	}

	async retrieveKey(sKey, bReturnValue) {

		if (helpers.isUndefinedNullOrEmptyObject(sKey)) {
			let sDeveloperInfo = "Please provide URL parameter KEY. E.g.: ?KEY=test";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
		}
		let oInputParams = {
			KEY: sKey,
			STORE_NAME: "TEMPLATE_APPLICATION_STORE",
			FOR_XS_APPLICATIONUSER: true
		};
		const client = await this.getSecureStore();

		return new Promise((resolve, reject) => {
			hdbext.loadProcedure(client, "SYS", "USER_SECURESTORE_RETRIEVE", (err, sp) => {
				if (err) {
					// console.log(`Failed to retrieve key '${sKey}' from secure store!`);
					reject(err);
				}
				sp(oInputParams, (error, parameters) => {
					if (error) {
						// console.log(`Failed to retrieve key '${sKey}' from secure store!`);
						reject(error);
					}
					if (bReturnValue) {
						if (parameters.VALUE) {
							resolve(parameters.VALUE.toString("utf8"));
						} else {
							resolve("");
						}
					} else {
						if (parameters.VALUE) {
							resolve(`Value of Key '${sKey}' exists into secure store!`);
						} else {
							reject(`Key '${sKey}' not found into secure store!`);
						}
					}
				});
			});
		});
	}

	async insertKey(sKey, sValue) {

		if (helpers.isUndefinedNullOrEmptyObject(sKey)) {
			let sDeveloperInfo = "Please provide URL parameter KEY. E.g.: ?KEY=test";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
		}
		if (helpers.isUndefinedNullOrEmptyObject(sValue) || sValue === "") {
			let sDeveloperInfo = "Please provide a value into request body for provided parameter KEY. E.g.: ?KEY=test";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
		}
		let oInputParams = {
			KEY: sKey,
			VALUE: Buffer.from(sValue),
			STORE_NAME: "TEMPLATE_APPLICATION_STORE",
			FOR_XS_APPLICATIONUSER: true
		};
		const client = await this.getSecureStore();

		return new Promise((resolve, reject) => {
			hdbext.loadProcedure(client, "SYS", "USER_SECURESTORE_INSERT", (err, sp) => {
				if (err) {
					// console.log(`Failed to insert key '${sKey}' into secure store!`);
					reject(err);
				}
				sp(oInputParams, (error) => {
					if (error) {
						// console.log(`Failed to insert key '${sKey}' into secure store!`);
						reject(error);
					}
					// console.log(`Value for key '${sKey}' saved with success into secure store!`);
					resolve(`Value for key '${sKey}' saved with success into secure store!`);
				});
			});
		});

	}

	async deleteKey(sKey) {

		if (helpers.isUndefinedNullOrEmptyObject(sKey)) {
			let sDeveloperInfo = "Please provide URL parameter KEY. E.g.: ?KEY=test";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo);
		}
		let oInputParams = {
			KEY: sKey,
			STORE_NAME: "TEMPLATE_APPLICATION_STORE",
			FOR_XS_APPLICATIONUSER: true
		};
		const client = await this.getSecureStore();

		return new Promise((resolve, reject) => {
			hdbext.loadProcedure(client, "SYS", "USER_SECURESTORE_DELETE", (err, sp) => {
				if (err) {
					// console.log(`Failed to delete key '${sKey}' from secure store!`);
					reject(err);
				}
				sp(oInputParams, (error) => {
					if (error) {
						// console.log(`Failed to delete key '${sKey}' from secure store!`);
						reject(error);
					}
					// console.log(`Value for key '${sKey}' was deleted with success from secure store!`);
					resolve(`Value for key '${sKey}' was deleted with success from secure store!`);
				});
			});
		});
	}

	getSecureStore() {
		return new Promise((resolve, reject) => {
			let hanaOptions = xsenv.getServices({
				secureStore: {
					name: "secureStore"
				}
			});
			hdbext.createConnection(hanaOptions.secureStore, (error, client) => {
				if (error) {
					reject(error);
				} else {
					resolve(client);
				}
			});
		});
	}

}
exports.SecureStore = module.exports.Service = SecureStore;
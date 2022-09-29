/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Helper functions used to:
 *		- create database connection
 *		- execute statements
 *		- call procedures
 * @see {@ https://github.com/SAP-samples/hana-xsa-opensap-hana7/blob/main/srv/utils/dbPromises.js DatabaseClass}
 * 
 * @name dbPromises.js
 */

/** @class
 * @classdesc Database connection utility helpers
 * @name DatabaseClass 
 */
module.exports = class {

	static createConnection() {
		return new Promise((resolve, reject) => {
			let xsenv = require("@sap/xsenv");
			let options = xsenv.getServices({
				hana: {
					plan: "hdi-shared"
				}
			});
			let hdbext = require("@sap/hdbext");
			options.hana.pooling = true;
			hdbext.createConnection(options.hana, (error, client) => {
				if (error) {
					reject(error);
				} else {
					resolve(client);
				}
			});
		});
	}

	constructor(client) {

		this.client = client;
		this.util = require("util");
		this.client.promisePrepare = this.util.promisify(this.client.prepare);
	}

	preparePromisified(query) {

		return this.client.promisePrepare(query);
	}

	statementExecPromisified(statement, parameters) {

		statement.promiseExec = this.util.promisify(statement.exec);
		return statement.promiseExec(parameters);
	}

	loadProcedurePromisified(hdbext, schema, procedure) {

		hdbext.promiseLoadProcedure = this.util.promisify(hdbext.loadProcedure);
		return hdbext.promiseLoadProcedure(this.client, schema, procedure);
	}

	callProcedurePromisified(storedProc, inputParams) {

		return new Promise((resolve, reject) => {
			storedProc(inputParams, (error, outputScalar, ...results) => {
				if (error) {
					reject(error);
				} else {
					if (results.length < 2) {
						resolve({
							outputScalar: outputScalar,
							results: results[0]
						});
					} else {
						let output = {
							"outputScalar": outputScalar
						};
						for (let i = 0; i < results.length; i++) {
							output[`results${i}`] = results[i];
						}
						resolve(output);
					}
				}
			});
		});
	}
};
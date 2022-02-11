/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Helper functions used to get/set technical user and client id  into environment variables table
 * A value for TECHNICAL_USER/CLIENT_ID property will be set when a technical user and client id is maintained into secure store:
 *		- insert into secure store => key property from secure store will be set for TECHNICAL_USER/CLIENT_ID property
 *		- delete from secure store => null value will be set for TECHNICAL_USER/CLIENT_ID property
 * null value is the default value of TECHNICAL_USER/CLIENT_ID property from environment variables table
 * null value is returned in case no technical user / client id is maintained into secure store
 * 
 * @name environmentVariables.js
 */

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");

/** @class
 * @classdesc Technical user utility helpers
 * @name TechnicalUserUtil 
 */
class EnvironmentVariablesUtil {

	constructor() {}

	/** @function
	 * Used to retrieve from t_environment_variables the value of TECHNICAL_USER
	 * 
	 * @default sTechnicalUser = null
	 * @return {boolean/null} sTechnicalUser - the technical user
	 *  	If TECHNICAL_USER not found the default value is returned
	 */
	async getTechnicalUserFromTable() {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				select * from "sap.plc.extensibility::template_application.t_environment_variables"
				where FIELD_NAME = 'TECHNICAL_USER';
			`
		);
		let aResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		let aTechnicalUser = aResults.slice();

		let sTechnicalUser = null;
		if (aTechnicalUser.length === 1) {
			sTechnicalUser = aTechnicalUser[0].FIELD_VALUE;
		}
		return sTechnicalUser;
	}

	/** @function
	 * Used to retrieve from t_environment_variables the value of CLIENT_ID
	 * 
	 * @default sClientId = null
	 * @return {boolean/null} sClientId - the PLC CLient Id
	 *  	If CLIENT_ID not found the default value is returned
	 */
	async getClientIdFromTable() {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				select * from "sap.plc.extensibility::template_application.t_environment_variables"
				where FIELD_NAME = 'CLIENT_ID';
			`
		);
		let aResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		let aClientId = aResults.slice();

		let sClientId = null;
		if (aClientId.length === 1) {
			sClientId = aClientId[0].FIELD_VALUE;
		}
		return sClientId;
	}

	/** @function
	 * Used to upsert into t_environment_variables the value of TECHNICAL_USER or CLIENT_ID
	 * 
	 * @param {string} sValue - the technical user or client id
	 * @default sTechnicalUser = null
	 */
	async upsertEnvironmnetVariablesIntoTable(sValue, sTechnicalName) {

		sValue = (sValue === undefined) ? null : sValue;

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				upsert "sap.plc.extensibility::template_application.t_environment_variables" values ( ?, ? )
				where FIELD_NAME = '${sTechnicalName}';
			`
		);
		await connection.statementExecPromisified(statement, [sTechnicalName, sValue]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	}
}
exports.EnvironmentVariablesUtil = module.exports.EnvironmentVariablesUtil = EnvironmentVariablesUtil;
/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Helper functions used to get/set technical user into application settings table
 * A value for TECHNICAL_USER property will be set when a technical user is maintained into secure store:
 *		- insert into secure store => key property from secure store will be set for TECHNICAL_USER property
 *		- delete from secure store => null value will be set for TECHNICAL_USER property
 * null value is the default value of TECHNICAL_USER property from application settings table
 * null value is returned in case no technical user is maintained into secure store
 * 
 * @name applicationSettings.js
 */

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");

/** @class
 * @classdesc Technical user utility helpers
 * @name TechnicalUserUtil 
 */
class ApplicationSettingsUtil {

	constructor() {}

	/** @function
	 * Used to retrieve from t_application_settings the value of TECHNICAL_USER
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
				select * from "sap.plc.extensibility::template_application.t_application_settings"
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
	 * Used to upsert into t_application_settings the value of TECHNICAL_USER
	 * 
	 * @param {string} sValue - the technical user
	 * @default sTechnicalUser = null
	 */
	async upsertApplicationSettingsIntoTable(sValue, sTechnicalName) {

		sValue = (sValue === undefined) ? null : sValue;

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				upsert "sap.plc.extensibility::template_application.t_application_settings" values ( ?, ? )
				where FIELD_NAME = '${sTechnicalName}';
			`
		);
		await connection.statementExecPromisified(statement, [sTechnicalName, sValue]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	}
}

module.exports = ApplicationSettingsUtil;
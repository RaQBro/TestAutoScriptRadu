/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * Helper functions used to get/set technical user into technical user table
 * A value for TECHNICAL_USER property will be set when a technical user is maintained into secure store:
 *		- insert into secure store => key property from secure store will be set for TECHNICAL_USER property
 *		- delete from secure store => null value will be set for TECHNICAL_USER property
 * null value is the default value of TECHNICAL_USER property from technical user table
 * null value is returned in case no technical user is maintained into secure store
 * 
 * @name technicalUser.js
 */

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");

/** @class
 * @classdesc Technical user utility helpers
 * @name TechnicalUserUtil 
 */
class TechnicalUserUtil {

	constructor() {

	}

	/** @function
	 * Used to retrieve from t_technical_user the value of TECHNICAL_USER
	 * 
	 * @default sTechnicalUser = null
	 * @return {boolean/null} sTechnicalUser - the technical user
	 *  	If TECHNICAL_USER not found the default value is returned
	 */
	async getTechnicalUserFromTable() {

		const hdbClient = await DatabaseClass.createConnection();
		const connection = new DatabaseClass(hdbClient);

		const statement = await connection.preparePromisified(
			`
				select * from "sap.plc.extensibility::template_application.t_technical_user"
				where FIELD_NAME = 'TECHNICAL_USER';
			`
		);
		const aResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		const aTechnicalUser = aResults.slice();

		var sTechnicalUser = null;
		if (aTechnicalUser.length === 1) {
			sTechnicalUser = aTechnicalUser[0].FIELD_VALUE;
		}
		return sTechnicalUser;
	}

	/** @function
	 * Used to upsert into t_technical_user the value of TECHNICAL_USER
	 * 
	 * @param {string} sTechnicalUser - the technical user
	 * @default sTechnicalUser = null
	 */
	async upsertTechnicalUserIntoTable(sTechnicalUser) {

		sTechnicalUser = (sTechnicalUser === undefined) ? null : sTechnicalUser;

		const hdbClient = await DatabaseClass.createConnection();
		const connection = new DatabaseClass(hdbClient);

		const statement = await connection.preparePromisified(
			`
				upsert "sap.plc.extensibility::template_application.t_technical_user" values ( 'TECHNICAL_USER', ? )
				where FIELD_NAME = 'TECHNICAL_USER';
			`
		);
		await connection.statementExecPromisified(statement, [sTechnicalUser]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	}

}
exports.TechnicalUserUtil = module.exports.TechnicalUserUtil = TechnicalUserUtil;
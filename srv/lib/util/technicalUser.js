/*eslint-env node, es6 */
"use strict";

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises");

// Helper functions used to get/set technical user into default values table
// A value for TECHNICAL_USER property will be set when a technical user is maintained into secure store:
//		- insert into secure store => key property from secure store will be set for TECHNICAL_USER property
//		- delete from secure store => null value will be set for TECHNICAL_USER property
// null value is the default value of TECHNICAL_USER property from default value table
// null value is returned in case no technical user is maintained into secure store

class TechnicalUser {

	constructor() {

	}

	async getTechnicalFromDefaultValuesTable() {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				select * from "basis.t_default_values"
				where FIELD_NAME = 'TECHNICAL_USER';
			`);
		let aResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close();

		let aTechnicalUser = aResults.slice();

		let sTechnicalUser = null;
		if (aTechnicalUser.length === 1) {
			sTechnicalUser = aTechnicalUser[0].FIELD_VALUE;
		}
		return sTechnicalUser;
	}

	async upsertTechnicalUserIntoDefaultValuesTable(sTechnicalUser) {

		sTechnicalUser = (sTechnicalUser === undefined) ? null : sTechnicalUser;

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);

		let statement = await connection.preparePromisified(
			`
				upsert "basis.t_default_values" values ( 'TECHNICAL_USER', ? )
				where FIELD_NAME = 'TECHNICAL_USER';
			`);
		await connection.statementExecPromisified(statement, [sTechnicalUser]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
	}
}
exports.TechnicalUser = module.exports.TechnicalUser = TechnicalUser;
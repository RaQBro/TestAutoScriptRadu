/*eslint-env node, es6 */
"use strict";

const async = require("async");

/**
 * @fileOverview
 * 
 * List of all service implementations of Extensibility PLC Routes
 * 
 * @name extensibilityService.js
 */

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");
const Message = require(global.appRoot + "/lib/util/message.js").Message;

/** @class
 * @classdesc Extensibility PLC services
 * @name Service 
 */
class Service {

	/** @constructor
	 * Is setting the JOB_ID in order to log the messages
	 */
	constructor(request, sOperation) {

		this.JOB_ID = request.JOB_ID;
		this.Operation = sOperation;

		if ((request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === true) || request.user.id !== undefined) {
			this.userId = request.user.id.toUpperCase();
		} else {
			this.userId = global.TECHNICAL_USER; // technical user
		}
	}

	/** @function
	 * Get all projects from t_project
	 * 
	 * @return {array} aResults - all projects
	 */
	async getAllProjects() {
		const hdbClient = await DatabaseClass.createConnection();
		const connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
				select * from "sap.plc.db::basis.t_project";
			`
		);
		let aResults = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
		return aResults.slice();
	}

	/**
	 * Check if calculation version is editable
	 * @param {integer} iVersionId - the calculation version id
	 */
	async checkIfVersionIsTouchable(iVersionId) {

		var bIsTouchable = false;

		const hdbClient = await DatabaseClass.createConnection();
		const connection = new DatabaseClass(hdbClient);
		const statement = await connection.preparePromisified(
			`
			select
				CALCULATION_VERSION_ID,
				IS_WRITEABLE,
				VERSION_ID,
				IS_FROZEN
			from (
				select
					openCalcVersion.CALCULATION_VERSION_ID,
					openCalcVersion.IS_WRITEABLE,
					item.VERSION_ID,
					calcVersion.IS_FROZEN
				from "sap.plc.db::basis.t_calculation_version" calcVersion
					inner join "sap.plc.db::basis.t_open_calculation_versions" openCalcVersion
						on openCalcVersion.CALCULATION_VERSION_ID = calcVersion.CALCULATION_VERSION_ID
							and SESSION_ID = '${this.userId}'
					left outer join (select distinct(item.referenced_calculation_version_id) as VERSION_ID
						from "sap.plc.db::basis.t_item" item
							where item.item_category_id = 10
								group by item.referenced_calculation_version_id) item
						on item.VERSION_ID = calcVersion.CALCULATION_VERSION_ID
			) where CALCULATION_VERSION_ID = ${iVersionId};
			`
		);

		let aResultIsTouchableVersions = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		var aIsTouchableVersions = aResultIsTouchableVersions.slice();
		if (aIsTouchableVersions[0] !== undefined) {
			var oTouchableVersion = aIsTouchableVersions[0];
			if (
				(oTouchableVersion.IS_WRITEABLE === 1 || oTouchableVersion.IS_WRITEABLE === "1") &&
				(oTouchableVersion.IS_FROZEN === 0 || oTouchableVersion.IS_FROZEN === "0" || oTouchableVersion.IS_FROZEN === "null" ||
					oTouchableVersion.IS_FROZEN === null || oTouchableVersion.IS_FROZEN === undefined) &&
				(oTouchableVersion.VERSION_ID === "null" || oTouchableVersion.VERSION_ID === null || oTouchableVersion.VERSION_ID === undefined)
			) {
				bIsTouchable = true;
			}
			var bIsWritable = oTouchableVersion.IS_WRITEABLE === 1 || oTouchableVersion.IS_WRITEABLE === "1" ? true : false;
			var bIsFrozen = oTouchableVersion.IS_FROZEN === 0 || oTouchableVersion.IS_FROZEN === "0" || oTouchableVersion.IS_FROZEN === "null" ||
				oTouchableVersion.IS_FROZEN === null || oTouchableVersion.IS_FROZEN === undefined ? false : true;
			await Message.addLog(this.JOB_ID,
				"Calculation Version with ID '" + iVersionId + "': Is Touchable = " + bIsTouchable +
				". Is Writable = " + bIsWritable + ". Is Frozen = " + bIsFrozen + ".", "message", this.sOperation);
		}

		return bIsTouchable;
	}

	/** @function
	 * Used to maintain default values into t_default_values
	 */
	maintainDefaultValues(request) {

		var that = this;
		var tType = "gtt_default_values";

		const hdbClient = request.db;
		var aDefaultItems = request.body;

		return new Promise(function (resolve, reject) {

			var tName = "#" + that.userId + "_t_default_values_temp_data";
			var fnProc = `CALL "p_maintain_t_default_values"(${tName})`;

			async.series([
				function (callback) {
					that.createTempDefaultValuesTable(hdbClient, tName, tType)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				},
				function (callback) {
					that.insertIntoTempDefaultValuesTable(hdbClient, tName, aDefaultItems)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				},
				function (callback) {
					that.countTempDefaultValuesTable(hdbClient, tName)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				},
				function (callback) {
					// run CALL fnProc
					hdbClient.exec(fnProc, function (err, resultTable) {
						if (err) {
							Message.addLog(0, "Error exec " + fnProc, "error", err);
							callback(err);
							return;
						}
						callback(null, resultTable);
					});
				},
				function (callback) {
					that.dropTempDefaultValuesTable(hdbClient, tName)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				}
			], function (err, results) {
				if (err) {
					Message.addLog(0, "Maintain Default Values Object series error", "error", err);
					reject(err);
				}
				// Message.addLog(0, "Maintain Default Values series results", "message", results);
				resolve(results);
			});
		});
	}

	createTempDefaultValuesTable(client, tName, tType) {
		return new Promise(function (resolve, reject) {
			var sql = `CREATE LOCAL TEMPORARY TABLE ${tName} LIKE "${tType}"`;
			client.exec(sql, function (err, res) {
				if (err) {
					Message.addLog(0, "Create temp table ERROR", "error", err);
					reject(err);
				}
				resolve(res);
			});
		});
	}

	insertIntoTempDefaultValuesTable(client, tName, defaultItems) {
		return new Promise(function (resolve, reject) {
			client.prepare(`INSERT INTO ${tName} VALUES(?, ?)`, function (err, statement) {
				if (err) {
					Message.addLog(0, "Prepare insert temp table ERROR", "error", err);
					if (!statement.exec) {
						Message.addLog(0, "Statement is null!", "error");
						reject(err);
						return;
					}
				}

				function createTasks(defaultItem) {
					return statement.exec.bind(statement, [
						defaultItem.FIELD_NAME,
						defaultItem.FIELD_VALUE
					]);
				}
				var tasks = defaultItems.map(createTasks);

				async.series(tasks, function (error, results) {
					var ok = true;
					var errIndexes = [];
					for (var i = 0; i < results.length; i++) {
						if (results[i] !== 1) {
							ok = false;
						} else {
							errIndexes.push(i);
						}
					}
					if (ok) {
						// Message.addLog(0, "All rows inserted ok !", "message");
					} else {
						Message.addLog(0, "Rows indexes with errors", "error", errIndexes.join(", "));
					}
					resolve(ok);
				});
			});
		});
	}

	dropTempDefaultValuesTable(client, tName) {
		return new Promise(function (resolve, reject) {
			client.exec("DROP TABLE " + tName, function (err, res) {
				if (err) {
					Message.addLog(0, "Drop temp table ERROR", "error", err);
					reject(err);
				}
				resolve(res);
			});
		});
	}

	countTempDefaultValuesTable(client, tName) {
		return new Promise(function (resolve, reject) {
			client.exec(`SELECT COUNT(*) AS "COUNT" FROM ${tName}`, function (err, res) {
				if (err) {
					Message.addLog(0, "SELECT COUNT from temp table ERROR", "error", err);
					reject(err);
				}
				var count = parseInt(res[0].COUNT);
				// Message.addLog(0, "COUNT for " + tName + " = " + count, "message");
				resolve(count);
			});
		});
	}

}
exports.Service = module.exports.Service = Service;
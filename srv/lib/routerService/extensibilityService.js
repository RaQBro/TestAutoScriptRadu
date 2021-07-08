/*eslint-env node, es6 */
"use strict";

const async = require("async");

const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises");
const PlcException = require(global.appRoot + "/lib/util/message").PlcException;

class Service {

	// constructor
	constructor(request) {

		this.token = request.authInfo.getAppToken();
		this.hdbClient = request.db;
		this.userId = request.user.id;
	}

	async getAllProjects(request, response) {
		var oServiceResponseBody = {}; // service response body
		try {
			// ------------------------- Start Business Logic ---------------------------
			let connection = new DatabaseClass(request.db);
			let statement = await connection.preparePromisified(`
				SELECT * FROM "sap.plc.db::basis.t_project" ORDER BY PROJECT_NAME ASC;
			`);
			oServiceResponseBody = await connection.statementExecPromisified(statement, []);
			// -------------------------- End Business Logic ----------------------------
		} catch (err) {
			let oPlcException = PlcException.createPlcException(err);
			response.status(oPlcException.code.responseCode);
			oServiceResponseBody = oPlcException;
		} finally {
			response.type("application/json");
			response.send(JSON.stringify(oServiceResponseBody));
		}
	}

	maintainDefaultValues(request) {

		var that = this;
		var tType = "gtt_default_values";
		var aDefaultItems = request.body;

		return new Promise(function (resolve, reject) {

			var tName = "#" + that.userId + "_t_default_values_temp_data";
			var fnProc = 'CALL "p_maintain_t_default_values"(' + tName + ')';

			async.series([
				function (callback) {
					that.createTempDefaultValuesTable(that.hdbClient, tName, tType)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				},
				function (callback) {
					that.insertIntoTempDefaultValuesTable(that.hdbClient, tName, aDefaultItems)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				},
				function (callback) {
					that.countTempDefaultValuesTable(that.hdbClient, tName)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				},
				function (callback) {
					// run CALL fnProc
					that.hdbClient.exec(fnProc, function (err, resultTable) {
						if (err) {
							console.error("Exec error:", err);
							callback(err);
							return;
						}
						callback(null, resultTable);
					});
				},
				function (callback) {
					that.dropTempDefaultValuesTable(that.hdbClient, tName)
						.then(function (res) {
							callback(null, res);
						})
						.catch(function (err) {
							callback(err);
						});
				}
			], function (err, results) {
				if (err) {
					console.log("Maintain Default Values Object series error : ", err);
					reject(err);
				}
				console.log("Maintain Default Values series results : ", results);
				resolve(results);
			});
		});
	}

	createTempDefaultValuesTable(client, tName, tType) {
		return new Promise(function (resolve, reject) {
			var sql = 'CREATE LOCAL TEMPORARY TABLE ' + tName + ' LIKE "' + tType + '"';
			client.exec(sql, function (err, res) {
				if (err) {
					console.log("Create temp table ERROR : " + JSON.stringify(err));
					reject(err);
				}
				resolve(res);
			});
		});
	}

	insertIntoTempDefaultValuesTable(client, tName, defaultItems) {
		return new Promise(function (resolve, reject) {
			client.prepare('INSERT INTO ' + tName + ' VALUES(?, ?)', function (err, statement) {
				if (err) {
					console.log("Prepare insert temp table ERROR : " + JSON.stringify(err));
					if (!statement.exec) {
						console.log("Statement is null!");
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

				async.series(tasks, function (err, results) {
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
						console.log("All rows inserted ok !");
					} else {
						console.log("Rows indexes with errors :" + errIndexes.join(', '));
					}
					resolve(ok);
				});
			});
		});
	}

	dropTempDefaultValuesTable(client, tName) {
		return new Promise(function (resolve, reject) {
			client.exec('DROP TABLE ' + tName, function (err, res) {
				if (err) {
					console.log("Drop temp table ERROR : " + JSON.stringify(err));
					reject(err);
				}
				resolve(res);
			});
		});
	}

	countTempDefaultValuesTable(client, tName) {
		return new Promise(function (resolve, reject) {
			client.exec('SELECT COUNT(*) AS "COUNT" FROM ' + tName, function (err, res) {
				if (err) {
					console.log('SELECT COUNT from temp table ERROR : ' + JSON.stringify(err));
					reject(err);
				}
				var count = parseInt(res[0].COUNT);
				console.log("COUNT for " + tName + " = " + count);
				resolve(count);
			});
		});
	}

}
exports.Service = module.exports.Service = Service;
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

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const UaaToken = require(global.appRoot + "/lib/util/uaaToken.js");
const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");
const ApplicationSettings = require(global.appRoot + "/lib/util/applicationSettings.js");
const SecureStore = require(global.appRoot + "/lib/routerService/secureStoreService.js");

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Code = MessageLibrary.Code;
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

const sVersionType = MessageLibrary.PlcObjects.Version;

const DispatcherPlc = require(global.appRoot + "/lib/util/plcDispatcher.js");

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

		if (helpers.isRequestFromJob(request) || (request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === false)) {
			this.userId = global.TECHNICAL_USER; // technical user
		} else {
			this.userId = request.user.id.toUpperCase(); // request user
		}

		this.PlcDispatcher = new DispatcherPlc(request);

	}

	/** @function
	 * Check if existing token from UAA of PLC for technical user is valid. If not error message will be raised.
	 * 
	 * @return {string} sTechnicalUserAccessToken - technical user access token
	 */
	async checkTechnicalUserPlcToken() {

		let ApplicationSettingsUtil = new ApplicationSettings();
		let SecureStoreService = new SecureStore();

		let sTechnicalUser = await ApplicationSettingsUtil.getTechnicalUserFromTable();
		let sTechnicalPassword = await SecureStoreService.retrieveKey(sTechnicalUser, true);

		let UAAToken = new UaaToken();
		let sTechnicalUserAccessToken = await UAAToken.checkTechnicalUserToken(sTechnicalUser, sTechnicalPassword);

		return sTechnicalUserAccessToken;
	}

	/** @function
	 * Generate token from UAA of PLC for technical user using the provided values. If not correct error message will be raised
	 * 
	 * @return {string} sTechnicalUserAccessToken - technical user access token
	 */
	async generateTechnicalUserPlcToken(request) {

		let oBodyRequest = request.body;
		let sTechnicalUser = oBodyRequest.TECHNICAL_USER_NAME;
		let sTechnicalPassword = oBodyRequest.TECHNICAL_USER_PASSWORD;

		let UAAToken = new UaaToken();
		let sTechnicalUserAccessToken = await UAAToken.checkTechnicalUserToken(sTechnicalUser, sTechnicalPassword);
		return sTechnicalUserAccessToken;
	}

	/** @function
	 * Get token from UAA of PLC for current user
	 * 
	 * @return {string} sApplicationUserToken - user access token
	 */
	async getUserPlcToken(request) {

		let UAAToken = new UaaToken();
		let sApplicationUserToken = await UAAToken.retrieveApplicationUserToken(request);
		return sApplicationUserToken;
	}

	/** @function
	 * Get all projects from t_project
	 * 
	 * @return {array} aResults - all projects
	 */
	async getAllProjects() {

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
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

		let bIsTouchable = false;

		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
			select
				vCalcVersRead.USER_ID,
				versions.CALCULATION_VERSION_ID,
				versions.IS_WRITEABLE,
				versions.VERSION_ID,
				versions.IS_FROZEN
			from (
				select
					calcVersion.CALCULATION_VERSION_ID,
					openCalcVersion.IS_WRITEABLE,
					item.VERSION_ID,
					calcVersion.IS_FROZEN
				from "sap.plc.db::basis.t_calculation_version" calcVersion
					left outer join "sap.plc.db::basis.t_open_calculation_versions" openCalcVersion
						on openCalcVersion.CALCULATION_VERSION_ID = calcVersion.CALCULATION_VERSION_ID
							and SESSION_ID = '${this.userId}'
					left outer join (select distinct(item.referenced_calculation_version_id) as VERSION_ID
						from "sap.plc.db::basis.t_item" item
							where item.item_category_id = 10
								group by item.referenced_calculation_version_id) item
						on item.VERSION_ID = calcVersion.CALCULATION_VERSION_ID
			) as versions
			inner join "sap.plc.db.authorization::privileges.v_calculation_version_read" as vCalcVersRead
				on vCalcVersRead.CALCULATION_VERSION_ID = versions.CALCULATION_VERSION_ID
			where versions.CALCULATION_VERSION_ID = ${iVersionId}
				and vCalcVersRead.USER_ID = '${this.userId}';
			`
		);

		let aResultIsTouchableVersions = await connection.statementExecPromisified(statement, []);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		let aIsTouchableVersions = aResultIsTouchableVersions.slice();
		if (aIsTouchableVersions.length > 0) {
			let oTouchableVersion = aIsTouchableVersions[0];

			if (
				(oTouchableVersion.IS_WRITEABLE === null || oTouchableVersion.IS_WRITEABLE === 1 || oTouchableVersion.IS_WRITEABLE === "1") &&
				(oTouchableVersion.IS_FROZEN === 0 || oTouchableVersion.IS_FROZEN === "0" || oTouchableVersion.IS_FROZEN === "null" ||
					oTouchableVersion.IS_FROZEN === null || oTouchableVersion.IS_FROZEN === undefined) &&
				(oTouchableVersion.VERSION_ID === "null" || oTouchableVersion.VERSION_ID === null || oTouchableVersion.VERSION_ID === undefined)
			) {
				bIsTouchable = true;
			}

			let bIsFrozen = oTouchableVersion.IS_FROZEN === 0 || oTouchableVersion.IS_FROZEN === "0" || oTouchableVersion.IS_FROZEN === "null" ||
				oTouchableVersion.IS_FROZEN === null || oTouchableVersion.IS_FROZEN === undefined ? false : true;
			let bIsWritable = bIsFrozen === true ? false : (oTouchableVersion.IS_WRITEABLE === null || oTouchableVersion.IS_WRITEABLE === 1 ||
				oTouchableVersion.IS_WRITEABLE === "1" ? true : false);

			await Message.addLog(this.JOB_ID,
				"Calculation Version with ID '" + iVersionId + "': Is Touchable = " + bIsTouchable +
				". Is Writable = " + bIsWritable + ". Is Frozen = " + bIsFrozen + ".",
				"message", undefined, this.Operation, sVersionType, iVersionId);
		} else {

			await Message.addLog(this.JOB_ID,
				`User with ID '${this.userId}' does not have any privilege for calculation version with ID '${iVersionId}'`,
				"error", undefined, this.Operation, sVersionType, iVersionId);
		}

		return bIsTouchable;
	}

	/** @function
	 * Check if there is an active session in plc exist for the user from request
	 * 
	 * @param {object} request - the web request
	 * @return {boolean} true (active session) / false (expired or no session availble)
	 */
	async checkInitPLCSession(request) {

		let sUserId;
		let oMessage;

		if (helpers.isRequestFromJob(request) || (request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === false)) {
			let ApplicationSettingsUtil = new ApplicationSettings();
			sUserId = await ApplicationSettingsUtil.getTechnicalUserFromTable(); // technical user
		} else {
			sUserId = request.user.id.toUpperCase(); // request user
		}

		let bValidSession = await this.checkPlcSession(request);
		if (bValidSession) {

			oMessage = new Message(`PLC session already opened and valid for user ${sUserId}.`);

		} else {

			let sQueryPath = "init-session";
			let aParams = [{
				"name": "language",
				"value": "EN"
			}];

			let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
			let oResponseBody = oResponse.data;

			if (oResponse.status !== 200) {
				let sDeveloperInfo = "Failed to initialize session with PLC. If this error persists, please contact your system administrator!";
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sDeveloperInfo);
			} else {
				oMessage = new Message(`PLC session open for user ${oResponseBody.body.CURRENTUSER.ID}.`);
			}
		}

		return oMessage;
	}

	/** @function
	 * Check if there is an active session in plc for the technical user or for the user provided as parameter
	 * 
	 * @param {string} sUser - optional parameter containing the user to check PLC session
	 * @return {boolean} true (active session) / false (expired or no session availble)
	 */
	async checkPlcSession(request) {

		let sUserId;

		if (helpers.isRequestFromJob(request) || (request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === false)) {
			let ApplicationSettingsUtil = new ApplicationSettings();
			sUserId = await ApplicationSettingsUtil.getTechnicalUserFromTable(); // technical user
		} else {
			sUserId = request.user.id.toUpperCase(); // request user
		}

		let oHdbClient = await DatabaseClass.createConnection();
		let oConnection = new DatabaseClass(oHdbClient);
		let oStatement = await oConnection.preparePromisified(
			`
				select 
					CASE
						WHEN (
								select VALUE_IN_SECONDS
								from "sap.plc.db::basis.t_application_timeout"
								where APPLICATION_TIMEOUT_ID = 'SessionTimeout') > SECONDS_BETWEEN(last_activity_time, current_timestamp
							  )
							THEN true
						ELSE false
					END AS VALID_SESSION
				from "sap.plc.db::basis.t_session" where session_id = '${sUserId}'
			`
		);
		let oSession = await oConnection.statementExecPromisified(oStatement, []);
		oHdbClient.close();

		return oSession !== undefined && oSession.length > 0 ? oSession[0].VALID_SESSION : false;
	}

	/** @function
	 * Return if the task in timeout
	 * 
	 * @return {boolean} bTaskTimeout
	 */
	async checkTaskTimeout(sTaskId, bProject) {

		let sTaskType = bProject ? "PROJECT_CALCULATE_LIFECYCLE_VERSIONS" : "IMPORT_ITEMS";

		try {

			let oHdbClient = await DatabaseClass.createConnection();
			let oConnection = new DatabaseClass(oHdbClient);
			let oStatement = await oConnection.preparePromisified(
				`
				select
					*
				from "sap.plc.db::basis.t_task" 
				where 
					task_type = '${sTaskType}' 
					and task_id = '${sTaskId}'
					and seconds_between(CREATED_ON, CURRENT_UTCTIMESTAMP) > (select VALUE_IN_SECONDS from "sap.plc.db::basis.t_application_timeout" where APPLICATION_TIMEOUT_ID = 'SessionTimeout')
				`
			);
			let oTaskStatus = await oConnection.statementExecPromisified(oStatement, []);
			oHdbClient.close();

			return oTaskStatus !== undefined && oTaskStatus.length > 0 ? true : false;
		} catch (e) {
			//TODO: error handling
			throw e;
		}
	}

	/** @function
	 * Get the status of the task
	 * 
	 * @return {string} oTaskStatus - status of the task
	 */
	async getTaskStatus(sTaskId, bProject) {

		let sTaskType = bProject ? "PROJECT_CALCULATE_LIFECYCLE_VERSIONS" : "IMPORT_ITEMS";

		try {

			let oHdbClient = await DatabaseClass.createConnection();
			let oConnection = new DatabaseClass(oHdbClient);
			let oStatement = await oConnection.preparePromisified(
				`
				select 
					STATUS
				from "sap.plc.db::basis.t_task" 
				where task_type = '${sTaskType}' and task_id = '${sTaskId}'
				`
			);
			let oTaskStatus = await oConnection.statementExecPromisified(oStatement, []);
			oHdbClient.close();

			return oTaskStatus !== undefined && oTaskStatus.length > 0 ? oTaskStatus[0].STATUS : undefined;
		} catch (e) {
			//TODO: error handling
			throw e;
		}
	}

	/** @function
	 * Used to maintain default values into t_default_values
	 */
	maintainDefaultValues(request) {

		let that = this;
		let tType = "gtt_default_values";

		let hdbClient = request.db;
		let aDefaultItems = request.body;

		return new Promise(function (resolve, reject) {

			let tName = "#" + that.userId + "_t_default_values_temp_data";
			let fnProc = `CALL "p_maintain_t_default_values"(${tName})`;

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
			let sql = `CREATE LOCAL TEMPORARY TABLE ${tName} LIKE "${tType}"`;
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
			client.prepare(`INSERT INTO ${tName} VALUES(?, ?, ?)`, function (err, statement) {
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
						defaultItem.FIELD_VALUE,
						defaultItem.FIELD_DESCRIPTION
					]);
				}
				let tasks = defaultItems.map(createTasks);

				async.series(tasks, function (error, results) {
					let ok = true;
					let errIndexes = [];
					for (let i = 0; i < results.length; i++) {
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
				let count = parseInt(res[0].COUNT);
				// Message.addLog(0, "COUNT for " + tName + " = " + count, "message");
				resolve(count);
			});
		});
	}
}

module.exports = Service;

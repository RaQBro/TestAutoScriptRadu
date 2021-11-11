/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");

/**
 * @fileOverview
 * 
 * List of all service implementations of Standard PLC Routes
 * 
 * @name standardPlcService.js
 */

const DispatcherPlc = require(global.appRoot + "/lib/util/plcDispatcher.js").PlcDispatcher;
const Message = require(global.appRoot + "/lib/util/message.js").Message;

/** @class
 * @classdesc Standard PLC services
 * @name Dispatcher 
 */
class Dispatcher {

	/** @constructor
	 * Is setting the JOB_ID in order to log the messages
	 */
	constructor(request, sOperation) {

		this.JOB_ID = request.JOB_ID;
		this.PlcDispatcher = new DispatcherPlc(request);
		this.Operation = sOperation;
	}

	/** @function
	 * Open variant matrix of a version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async openVariantMatrix(iVersionId) {

		let sQueryPath = `calculation-versions/${iVersionId}`;
		let aParams = [];

		let oBodyData = {
			"LOCK": {
				"CONTEXT": "variant_matrix",
				"IS_WRITEABLE": 1
			}
		};

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PATCH", aParams, oBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		let sMessageInfo;
		if (oResponse.statusCode !== 200) {
			if (oResponseBody.head !== undefined && oResponseBody.head.messages !== undefined && oResponseBody.head.messages.length > 0) {
				let oMessage = _.find(oResponseBody.head.messages, function (oMsg) {
					return oMsg.code === "ENTITY_NOT_WRITEABLE_INFO";
				});
				if (oMessage !== undefined) {
					let aUsers;
					if (oMessage.details !== undefined && oMessage.details.userObjs !== undefined && oMessage.details.userObjs.length > 0) {
						aUsers = _.pluck(oMessage.details.userObjs, "id");
					}
					if (aUsers !== undefined && aUsers.length > 0) {
						sMessageInfo =
							`Variant Matrix of calculation version with ID '${iVersionId}' was opened in read-only mode! Locked by User(s): ${aUsers.join(", ")}`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
						sMessageInfo =
							`Variant Matrix of calculation version with ID '${iVersionId}' will be ignored since is not editable! Locked by User(s): ${aUsers.join(", ")}`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
					} else {
						sMessageInfo = `Variant Matrix of calculation version with ID '${iVersionId}' is locked and was opened in read-only mode!`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
						sMessageInfo = `Variant Matrix of calculation version with ID '${iVersionId}' will be ignored since is not editable!`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
					}
					// close variant matrix
					this.closeVariantMatrix(iVersionId);

					return false;
				} else {
					let sDeveloperInfo = `Failed to open variant matrix of calculation version with ID '${iVersionId}'.`;
					await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);

					return undefined;
				}
			} else {

				let sDeveloperInfo = `Failed to open variant matrix of calculation version with ID '${iVersionId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);

				return undefined;
			}
		} else {
			sMessageInfo = `Variant matrix of version with ID '${iVersionId}' was opened with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

			return oResponseBody;
		}
	}

	/** @function
	 * Create variant for a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {object} oVariant - the variant details
	 * @return {object} result / error - PLC response / PLC error
	 */
	async createVariant(iVersionId, oVariant) {

		let sQueryPath = `calculation-versions/${iVersionId}/variants`;
		let aParams = [];

		let oBodyData = {
			"VARIANT_NAME": oVariant.VARIANT_NAME,
			"COMMENT": oVariant.COMMENT,
			"VARIANT_TYPE": oVariant.VARIANT_TYPE !== undefined ? oVariant.VARIANT_TYPE : 0,
			"IS_SELECTED": oVariant.IS_SELECTED !== undefined ? oVariant.IS_SELECTED : 1,
			"REPORT_CURRENCY_ID": oVariant.REPORT_CURRENCY_ID,
			"EXCHANGE_RATE_TYPE_ID": oVariant.EXCHANGE_RATE_TYPE_ID,
			"SALES_PRICE_CURRENCY_ID": oVariant.SALES_PRICE_CURRENCY_ID,
			"ITEMS": []
		};
		for (let i = 0; i < oVariant.ITEMS.length; i++) {
			let oItem = oVariant.ITEMS[i];
			let oVariantItem = {
				"ITEM_ID": oItem.ITEM_ID,
				"IS_INCLUDED": oItem.IS_INCLUDED,
				"QUANTITY_STATE": oItem.QUANTITY_STATE,
				"QUANTITY_UOM_ID": oItem.QUANTITY_UOM_ID,
				"QUANTITY": oItem.QUANTITY
			};
			oBodyData.ITEMS.push(oVariantItem);
		}

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, oBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo = `Failed to create variant for calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variant with name '${oVariant.VARIANT_NAME}' for version with ID '${iVersionId}' was created with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Save all variants from variant matrix of a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {array} aVariantsLastModifiedOn - the last modified timestamp of variants
	 * @return {object} result / error - PLC response / PLC error
	 */
	async saveAllVariantsOfVersion(iVersionId, aVariantsLastModifiedOn) {

		let sQueryPath = `calculation-versions/${iVersionId}/variants`;
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PATCH", aParams, aVariantsLastModifiedOn);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save all variants of calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variants of calculation version with ID '${iVersionId}' were saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Delete a variant from variant matrix of a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iVariantId - the variant ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteVariant(iVersionId, iVariantId) {

		let sQueryPath = `calculation-versions/${iVersionId}/variants/${iVariantId}`;
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "DELETE", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to delete variant with ID '${iVariantId}' of version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variant with ID '${iVariantId}' of version with ID '${iVersionId}' was deleted with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

			return true;
		}
	}

	/** @function
	 * Calculate a variant from variant matrix of a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iVariantId - the variant ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async calculateVariant(iVersionId, oVariant) {

		let sQueryPath = `calculation-versions/${iVersionId}/variant-calculator`;
		let aParams = [];

		let oBodyData = {
			"EXCHANGE_RATE_TYPE_ID": oVariant.EXCHANGE_RATE_TYPE_ID,
			"REPORT_CURRENCY_ID": oVariant.REPORT_CURRENCY_ID,
			"SALES_PRICE_CURRENCY_ID": oVariant.SALES_PRICE_CURRENCY_ID,
			"VARIANT_ID": oVariant.VARIANT_ID,
			"ITEMS": {
				"ITEM_ID": [],
				"QUANTITY": [],
				"QUANTITY_STATE": [],
				"QUANTITY_UOM_ID": []
			}
		};
		for (let i = 0; i < oVariant.ITEMS.length; i++) {
			let oItem = oVariant.ITEMS[i];

			let iItemId = oItem.ITEM_ID !== undefined ? oItem.ITEM_ID : null;
			oBodyData.ITEMS.ITEM_ID.push(iItemId);

			let iQuantity = oItem.QUANTITY !== undefined ? oItem.QUANTITY : null;
			oBodyData.ITEMS.QUANTITY.push(iQuantity);

			let iQuantityState = oItem.QUANTITY_STATE !== undefined ? oItem.QUANTITY_STATE : null;
			oBodyData.ITEMS.QUANTITY_STATE.push(iQuantityState);

			let sQuantityUomId = oItem.QUANTITY_UOM_ID !== undefined ? oItem.QUANTITY_UOM_ID : null;
			oBodyData.ITEMS.QUANTITY_UOM_ID.push(sQuantityUomId);
		}

		let aBodyData = [];
		aBodyData.push(oBodyData);

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to calculate the variant with ID '${oVariant.VARIANT_ID}' of version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variant with ID '${oVariant.VARIANT_ID}' of version with ID '${iVersionId}' was calculated with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Save a calculated variant from variant matrix of a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iVariantId - the variant ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async saveCalculatedVariant(iVersionId, iVariantId) {

		let sQueryPath = `calculation-versions/${iVersionId}/variant-calculator/${iVariantId}`;
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save the variant with ID '${iVariantId}' of version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variant with ID '${iVariantId}' of version with ID '${iVersionId}' was saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Generate a version from a variant into a target calculation
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iVariantId - the variant ID
	 * @param {integer} iTargetCalculationId - the target calculation ID
	 * @param {string} sCalculationVersionName - the calculation version name
	 * @return {object} result / error - PLC response / PLC error
	 */
	async generateVersionFromVariant(iVersionId, iVariantId, iTargetCalculationId, sCalculationVersionName) {

		let sQueryPath = `calculation-versions/${iVersionId}/variant-generator/${iVariantId}`;
		let aParams = [];

		let oBodyData = {
			"TARGET_CALCULATION_ID": iTargetCalculationId,
			"CALCULATION_VERSION_NAME": sCalculationVersionName
		};

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, oBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo =
				`Failed to generate a version in calculation with ID '${iTargetCalculationId}' from variant with ID '${iVariantId}' of version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let oResult = oResponseBody.body.transactionaldata[0];
			let iNewVersionId = oResult.LAST_GENERATED_VERSION_ID;
			let sMessageInfo =
				`Version with ID '${iNewVersionId}' and name '${sCalculationVersionName}' was generated with success into calculation with ID '${iTargetCalculationId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResult;
		}
	}

	/** @function
	 * Close variant matrix of a version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async closeVariantMatrix(iVersionId) {

		let sQueryPath = `calculation-versions/${iVersionId}`;
		let aParams = [];

		let oBodyData = {
			"LOCK": {
				"CONTEXT": "variant_matrix",
				"IS_WRITEABLE": 0
			}
		};

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PATCH", aParams, oBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to close variant matrix of calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variant matrix of version with ID '${iVersionId}' was closed with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Set a calculation version as current into a calculation
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {oblect} oCalculationDetails - the calculation details
	 * @return {object} result / error - PLC response / PLC error
	 */
	async setVersionToCurrent(iVersionId, oCalculationDetails) {

		let sQueryPath = "calculations";
		let aParams = [];

		let aBodyData = [{
			"CALCULATION_ID": oCalculationDetails.CALCULATION_ID,
			"CALCULATION_NAME": oCalculationDetails.CALCULATION_NAME,
			"CURRENT_CALCULATION_VERSION_ID": iVersionId,
			"LAST_MODIFIED_ON": oCalculationDetails.LAST_MODIFIED_ON,
			"PROJECT_ID": oCalculationDetails.PROJECT_ID
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo =
				`Failed to set version with ID '${iVersionId}' as current in calculation with ID '${oCalculationDetails.CALCULATION_ID}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo =
				`Version with ID '${iVersionId}' from calculation with ID '${oCalculationDetails.CALCULATION_ID}' was set as current with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Get a calculation
	 * 
	 * @param {integer} iCalculationId - the calculation ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async getCalculation(iCalculationId) {

		let sQueryPath = "calculations";
		let aParams = [{
			"name": "calculation_id",
			"value": iCalculationId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get calculation with ID '${iCalculationId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Calculation with ID '${iCalculationId}' was retrieved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Create a calculation and a version
	 * 
	 * @param {object} oDetails - the calculation and version details
	 * @param {string} sCalculationName - the calculation name
	 * @param {string} sVersionName - the calculation version name
	 * @return {object} result / error - PLC response / PLC error
	 */
	async createCalculation(oDetails, sCalculationName, sVersionName) {

		let sQueryPath = "calculations";
		let aParams = [{
			"name": "action",
			"value": "create"
		}, {
			"name": "calculate",
			"value": "true"
		}];

		if (oDetails.VALUATION_DATE === undefined || oDetails.VALUATION_DATE === null || oDetails.VALUATION_DATE === "") {
			let sTodayDate = new Date().toISOString();
			let sToday = sTodayDate.split(/[t,T]/)[0];
			oDetails.VALUATION_DATE = sToday + "T00:00:00Z";
		} else {
			if (oDetails.VALUATION_DATE.length > 10) {
				oDetails.VALUATION_DATE = oDetails.VALUATION_DATE.substring(0, 10);
			}
		}

		let aBodyData = [{
			"PROJECT_ID": oDetails.PROJECT_ID,
			"CALCULATION_ID": -1,
			"CALCULATION_NAME": sCalculationName,
			"CALCULATION_VERSIONS": [{
				"CALCULATION_ID": -1,
				"CALCULATION_VERSION_ID": -1,
				"CALCULATION_VERSION_NAME": sVersionName,
				"REPORT_CURRENCY_ID": oDetails.REPORT_CURRENCY_ID,
				"ROOT_ITEM_ID": -1,
				"VALUATION_DATE": oDetails.VALUATION_DATE,
				"MATERIAL_PRICE_STRATEGY_ID": oDetails.MATERIAL_PRICE_STRATEGY_ID,
				"ACTIVITY_PRICE_STRATEGY_ID": oDetails.ACTIVITY_PRICE_STRATEGY_ID,
				"ITEMS": [{
					"CALCULATION_VERSION_ID": -1,
					"HIGHLIGHT_YELLOW": 0,
					"HIGHLIGHT_GREEN": 0,
					"HIGHLIGHT_ORANGE": 0,
					"IS_ACTIVE": 1,
					"IS_CONFIGURABLE_MATERIAL": 0,
					"IS_PHANTOM_MATERIAL": 0,
					"IS_PRICE_SPLIT_ACTIVE": 0,
					"IS_RELEVANT_TO_COSTING_IN_ERP": 0,
					"ITEM_ID": -1,
					"PRICE_FIXED_PORTION": "0",
					"PRICE_UNIT": "1",
					"PRICE_UNIT_UOM_ID": "PC",
					"PRICE_VARIABLE_PORTION": "0",
					"TOTAL_QUANTITY": "1",
					"TOTAL_QUANTITY_UOM_ID": "PC",
					"TRANSACTION_CURRENCY_ID": oDetails.REPORT_CURRENCY_ID
				}]
			}]
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo =
				`Failed to create a calculation with name '${sCalculationName}' in project with ID '${oDetails.PROJECT_ID}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sProjectId = oDetails.PROJECT_ID;
			let oNewCalculation = oResponseBody.body.transactionaldata[0];
			let sCalculationId = oNewCalculation.CALCULATION_ID;
			let sNewCalculationName = oNewCalculation.CALCULATION_NAME;
			let oNewVersion = oNewCalculation.CALCULATION_VERSIONS[0];
			let sVersionId = oNewVersion.CALCULATION_VERSION_ID;
			let sNewVersionName = oNewVersion.CALCULATION_VERSION_NAME;
			let sCalcMessageInfo =
				`The calculation with ID '${sCalculationId}' and name '${sNewCalculationName}' was created with success in project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sCalcMessageInfo, "message", undefined, this.Operation);
			let sVersMessageInfo =
				`The version with ID '${sVersionId}' and name '${sNewVersionName}' was created with success in calculation with ID '${sCalculationId}'.`;
			await Message.addLog(this.JOB_ID, sVersMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Save calculation version
	 * 
	 * @param {object} oVersion - the calculation version details
	 * @return {object} result / error - PLC response / PLC error
	 */
	async saveCalculationVersion(oVersion) {

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "action",
			"value": "save"
		}];

		let aBodyData = [{
			"CALCULATION_ID": oVersion.CALCULATION_ID,
			"CALCULATION_VERSION_ID": oVersion.CALCULATION_VERSION_ID,
			"CALCULATION_VERSION_NAME": oVersion.CALCULATION_VERSION_NAME
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save calculation version with ID '${oVersion.CALCULATION_VERSION_ID}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Calculation version with ID '${oVersion.CALCULATION_VERSION_ID}' was saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Create calculation version as copy of another version
	 * 
	 * @param {integer} iVersionId - version id to copy
	 * @return {object} result / error - PLC response / PLC error
	 */
	async createVersionAsCopy(iVersionId) {

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "action",
			"value": "copy"
		}, {
			"name": "id",
			"value": iVersionId
		}, {
			"name": "compressedResult",
			"value": "true"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo = `Failed to create a version as copy of calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let oCopyVersion = oResponseBody.body.transactionaldata[0];
			let sMessageInfo =
				`The version with ID '${oCopyVersion.CALCULATION_VERSION_ID}' was created with success as copy of version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oCopyVersion;
		}
	}

	/** @function
	 * Get calculation version from PLC
	 * 
	 * @param {string} iVersionId - the calculation version id
	 * @return {object} result / error - PLC response / the error
	 */
	async getCalculationVersion(iVersionId) {

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "id",
			"value": iVersionId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Calculation version with ID '${iVersionId}' was retrieved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

			if (oResponseBody.body !== undefined && oResponseBody.body.transactionaldata !== undefined &&
				oResponseBody.body.transactionaldata[0] !== undefined && oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS !== undefined &&
				oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0] !== undefined) {

				return oResponseBody.body.transactionaldata[0].CALCULATION_VERSIONS[0];
			} else {
				return undefined;
			}

		}
	}

	/** @function
	 * Open calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {boolean} bCompressedResult - flag if the response should be compressed
	 * @return {object} result / error - the opened calculation version or throw error
	 */
	async openCalculationVersion(iVersionId, bCompressedResult) {

		let response;

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "id",
			"value": parseInt(iVersionId)
		}, {
			"name": "loadMasterdata",
			"value": "false"
		}, {
			"name": "action",
			"value": "open"
		}];

		if (bCompressedResult !== undefined && bCompressedResult === true) {
			aParams.push({
				"name": "compressedResult",
				"value": "true"
			});
		}

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to open calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
		} else {
			let sMessageInfo = `Calculation version with ID '${iVersionId}' was opened with success!`;

			if (oResponseBody.head !== undefined && oResponseBody.head.messages !== undefined && oResponseBody.head.messages.length > 0) {
				let oMessage = _.find(oResponseBody.head.messages, function (oMsg) {
					return oMsg.code === "ENTITY_NOT_WRITEABLE_INFO";
				});
				if (oMessage !== undefined) {
					let aUsers;
					if (oMessage.details !== undefined && oMessage.details.calculationVersionObjs !== undefined &&
						oMessage.details.calculationVersionObjs.length > 0) {

						let oCalculationVersionDetails = _.find(oMessage.details.calculationVersionObjs, function (oDetailsCalculationVersion) {
							return oDetailsCalculationVersion.id === iVersionId;
						});

						if (oCalculationVersionDetails !== undefined && oMessage.details.userObjs !== undefined && oMessage.details.userObjs.length > 0) {
							aUsers = _.pluck(oMessage.details.userObjs, "id");
						}
					}
					if (aUsers !== undefined && aUsers.length > 0) {
						sMessageInfo = `Calculation version with ID '${iVersionId}' was opened in read-only mode! Locked by User(s): '${aUsers.join(", ")}'`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
						sMessageInfo =
							`Calculation version with ID '${iVersionId}' will be ignored since is not editable! Locked by User(s): '${aUsers.join(", ")}'`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
					} else {
						sMessageInfo = `Calculation version with ID '${iVersionId}' was opened in read-only mode!`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
						sMessageInfo = `Calculation version with ID '${iVersionId}' will be ignored since is not editable!`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
					}
					// close calculation version
					await this.closeCalculationVersion(iVersionId);

					response = false;
				}
			}
			if (oResponseBody.head !== undefined && oResponseBody.head.messages === undefined && oResponseBody.body !== undefined &&
				oResponseBody.body.transactionaldata !== undefined && oResponseBody.body.transactionaldata[0] !== undefined) {

				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

				response = oResponseBody.body.transactionaldata[0];
			}
		}

		return response;
	}

	/** @function
	 * Add a version as reference item into a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iItemId - the ID of the item that will be changed into reference item
	 * @param {integer} iReferenceVersionId - the ID of the version that will be referenced
	 * @return {object} result / error - PLC response / PLC error
	 */
	async addReferenceItem(iVersionId, iItemId, iReferenceVersionId) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "compressedResult",
			"value": "false"
		}];

		let aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId,
			"ITEM_CATEGORY_ID": 10,
			"ITEM_ID": iItemId,
			"REFERENCED_CALCULATION_VERSION_ID": iReferenceVersionId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to reference version with ID '${iReferenceVersionId}' into calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Calculation version with ID '${iVersionId}' was referenced with success into version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody.body.transactionaldata;
		}
	}

	/** @function
	 * Add a material item into a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {object} oParentItem - the parent item
	 * @param {integer} iPredecessorItemId - the predecessor item ID
	 * @param {string} sDescription - the material item description
	 * @return {object} result / error - PLC response / PLC error
	 */
	async addMaterialItem(iVersionId, oParentItem, iPredecessorItemId, sDescription) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "mode",
			"value": "normal"
		}, {
			"name": "compressedResult",
			"value": "false"
		}];

		let aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId,
			"ITEM_CATEGORY_ID": 2,
			"ITEM_DESCRIPTION": sDescription !== undefined ? sDescription : null,
			"ITEM_ID": -1,
			"PARENT_ITEM_ID": oParentItem.ITEM_ID,
			"PREDECESSOR_ITEM_ID": iPredecessorItemId !== undefined ? iPredecessorItemId : null,
			"IS_ACTIVE": 1,
			"BASE_QUANTITY": 1,
			"IS_RELEVANT_TO_COSTING_IN_ERP": 0,
			"IS_PHANTOM_MATERIAL": 0,
			"IS_CONFIGURABLE_MATERIAL": 0,
			"PRICE_FIXED_PORTION": "0",
			"PRICE_VARIABLE_PORTION": "0",
			"PRICE_UNIT": "1",
			"PRICE_UNIT_UOM_ID": (oParentItem.PRICE_UNIT_UOM_ID !== undefined && oParentItem.PRICE_UNIT_UOM_ID !== null) ? oParentItem.PRICE_UNIT_UOM_ID : "PC",
			"QUANTITY": 1,
			"QUANTITY_UOM_ID": (oParentItem.QUANTITY_UOM_ID !== undefined && oParentItem.QUANTITY_UOM_ID !==
				null) ? oParentItem.QUANTITY_UOM_ID : "PC",
			"TRANSACTION_CURRENCY_ID": (oParentItem.TRANSACTION_CURRENCY_ID !== undefined && oParentItem.TRANSACTION_CURRENCY_ID !==
				null) ? oParentItem.TRANSACTION_CURRENCY_ID : "EUR"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (!(oResponse.statusCode === 201 || oResponse.statusCode === 200)) {
			let sDeveloperInfo = `Failed to add material item with description '${sDescription}' in calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Material item with description '${sDescription}' was added with success in version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody.body.transactionaldata;
		}
	}

	/** @function
	 * Add a variable item into a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {object} oParentItem - the parent item
	 * @param {integer} iPredecessorItemId - the predecessor item ID
	 * @param {string} sDescription - the variable item description
	 * @return {object} result / error - PLC response / PLC error
	 */
	async addVariableItem(iVersionId, oParentItem, iPredecessorItemId, sDescription) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "mode",
			"value": "normal"
		}, {
			"name": "compressedResult",
			"value": "false"
		}];

		let aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId,
			"ITEM_CATEGORY_ID": 8,
			"ITEM_DESCRIPTION": sDescription !== undefined ? sDescription : null,
			"ITEM_ID": -1,
			"PARENT_ITEM_ID": oParentItem.ITEM_ID,
			"PREDECESSOR_ITEM_ID": iPredecessorItemId !== undefined ? iPredecessorItemId : null,
			"IS_ACTIVE": 1,
			"BASE_QUANTITY": 1,
			"PRICE_FIXED_PORTION": "0",
			"PRICE_VARIABLE_PORTION": "0",
			"PRICE_UNIT": "1",
			"PRICE_UNIT_UOM_ID": (oParentItem.PRICE_UNIT_UOM_ID !== undefined && oParentItem.PRICE_UNIT_UOM_ID !== null) ? oParentItem.PRICE_UNIT_UOM_ID : "PC",
			"QUANTITY": 1,
			"QUANTITY_UOM_ID": (oParentItem.QUANTITY_UOM_ID !== undefined && oParentItem.QUANTITY_UOM_ID !==
				null) ? oParentItem.QUANTITY_UOM_ID : "PC",
			"TRANSACTION_CURRENCY_ID": (oParentItem.TRANSACTION_CURRENCY_ID !== undefined && oParentItem.TRANSACTION_CURRENCY_ID !==
				null) ? oParentItem.TRANSACTION_CURRENCY_ID : "EUR"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (!(oResponse.statusCode === 201 || oResponse.statusCode === 200)) {
			let sDeveloperInfo = `Failed to add variable item with description '${sDescription}' in calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Variable item with description '${sDescription}' was added with success in version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody.body.transactionaldata;
		}
	}

	/** @function
	 * Delete the items from calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {array} aItemsToDelete - the items to be deleted
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteItemsFromVersion(iVersionId, aItemsToDelete) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "compressedResult",
			"value": "true"
		}];

		let aBodyData = [];
		for (let i = 0; i < aItemsToDelete.length; i++) {
			let oItemToDelete = {
				"ITEM_ID": aItemsToDelete[i].ITEM_ID,
				"CALCULATION_VERSION_ID": aItemsToDelete[i].CALCULATION_VERSION_ID
			};
			aBodyData.push(oItemToDelete);
		}

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "DELETE", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to delete ${aBodyData.length} item(s) from calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Delete of ${aBodyData.length} item(s) from version with ID '${iVersionId}' was done with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Deactivate the items from calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {array} aItemsToDelete - the items to be deactivated
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deactivateItemsFromVersion(iVersionId, aItemsToDeactivate) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "compressedResult",
			"value": "true"
		}];

		let aBodyData = [];
		for (let i = 0; i < aItemsToDeactivate.length; i++) {
			let oItemToDelete = {
				"IS_ACTIVE": 0,
				"ITEM_ID": aItemsToDeactivate[i].ITEM_ID,
				"CALCULATION_VERSION_ID": aItemsToDeactivate[i].CALCULATION_VERSION_ID
			};
			aBodyData.push(oItemToDelete);
		}

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to deactivate ${aBodyData.length} item(s) from calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Deactivate ${aBodyData.length} item(s) from version with ID '${iVersionId}' was done with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Update the selected referenced items from calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {array} aItemsToUpdate - the referenced items to be updated
	 * @return {object} result / error - PLC response / PLC error
	 */
	async updateReferencedItemsFromVersion(iVersionId, aItemsToUpdate) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}];

		let aBodyData = [];
		for (let i = 0; i < aItemsToUpdate.length; i++) {
			let oItemToUpdate = {
				"ITEM_ID": aItemsToUpdate[i].ITEM_ID,
				"ITEM_CATEGORY_ID": aItemsToUpdate[i].ITEM_CATEGORY_ID,
				"CALCULATION_VERSION_ID": aItemsToUpdate[i].CALCULATION_VERSION_ID,
				"REFERENCED_CALCULATION_VERSION_ID": aItemsToUpdate[i].CURRENT_CALCULATION_VERSION_ID
			};
			aBodyData.push(oItemToUpdate);
		}

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to update referenced items of calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Update referenced items of version with ID '${iVersionId}' was done with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Close calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async freezeCalculationVersion(iVersionId) {

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "action",
			"value": "freeze"
		}];

		let aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to freeze calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Calculation version with ID '${iVersionId}' was frozen with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Close calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async closeCalculationVersion(iVersionId) {

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "action",
			"value": "close"
		}];

		let aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to close calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Calculation version with ID '${iVersionId}' was closed with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Delete calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iCalculationId - the calculation ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteCalculationVersion(iVersionId, iCalculationId) {

		let sQueryPath = "calculation-versions";
		let aParams = [];

		let aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "DELETE", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		let sMessageInfo;
		if (oResponse.statusCode !== 200) {
			if (oResponseBody.head.messages !== undefined && oResponseBody.head.messages.length > 0) {
				let aErrorMessages = _.filter(oResponseBody.head.messages, function (oMessage) {
					return oMessage.code === "CALCULATIONVERSION_IS_SINGLE_ERROR" || oMessage.code === "DELETE_CURRENT_VERSION_ERROR";
				});
				if (aErrorMessages.length > 0 && iCalculationId !== undefined) {
					sMessageInfo =
						`The calculation version with ID '${iVersionId}' is the single version of the calculation with ID '${iCalculationId}'!`;
					await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
					// delete calculation
					await this.deleteCalculation(iCalculationId);

					return true;
				} else {
					let sDeveloperInfo = `Failed to delete calculation version with ID '${iVersionId}'.`;
					await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);

					return undefined;
				}
			} else {
				let sDeveloperInfo = `Failed to delete calculation version with ID '${iVersionId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);

				return undefined;
			}
		} else {
			sMessageInfo = `Calculation version with ID '${iVersionId}' was deleted with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

			return true;
		}
	}

	/** @function
	 * Delete calculation
	 * 
	 * @param {integer} iCalculationId - the calculation ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteCalculation(iCalculationId) {

		let sQueryPath = "calculations";
		let aParams = [];

		let aBodyData = [{
			"CALCULATION_ID": iCalculationId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "DELETE", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		let sMessageInfo;
		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to delete calculation with ID '${iCalculationId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			sMessageInfo = `Calculation with ID '${iCalculationId}' was deleted with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

			return true;
		}
	}

	/** @function
	 * Get statuses
	 * 
	 * @returns {array} - the statuses or throw error
	 */
	async getStatuses() {

		let sQueryPath = "statuses";
		let aParams = [{
			"name": "skip",
			"value": 0
		}, {
			"name": "expand",
			"value": "texts"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to get calculation version statuses from the system.";
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
			return undefined;
		} else {
			if (oResponseBody.entities !== undefined) {
				let sMessageInfo = "The statuses of calculation version were retrieved with success!";
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.entities;
			} else {
				let sDeveloperInfo = "Failed to get calculation version statuses from the system.";
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
				return undefined;
			}
		}
	}

	/** @function
	 * Update the calculation version status
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {string} sStatusId - the status id
	 * @return {object} result / error - PLC response / PLC error
	 */
	async updateStatusOfCalculationVersion(iVersionId, sStatusId) {

		let sQueryPath = "calculationVersions";
		let aParams = [];

		let aBodyData = [{
			"calculationVersionId": iVersionId,
			"statusId": sStatusId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to add status witn ID '${sStatusId}' at the calculation with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The status with ID '${sStatusId}' was added with success at calculation with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Delete the calculation version status
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteStatusOfCalculationVersion(iVersionId) {

		let sQueryPath = "calculationVersions";
		let aParams = [];

		let aBodyData = [{
			"calculationVersionId": iVersionId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to delete the status of calculation with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The status of calculation version ID '${iVersionId}' was deleted with success.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Add a tag to a calculation
	 * 
	 * @param {integer} iEntityId - the calculation entity ID
	 * @param {string} sTagName - the tag name to be added
	 * @return {object} result / error - PLC response / PLC error
	 */
	async addCalculationTag(iEntityId, sTagName) {

		let sQueryPath = "tags/calculationTags";
		let aParams = [];

		let aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo = `Failed to add tag witn name '${sTagName}' at the calculation with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The tag with name '${sTagName}' was added with success at calculation with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Delete tag from a calculation
	 * 
	 * @param {integer} iEntityId - the calculation entity ID
	 * @param {string} sTagName - the tag name to be deleted
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteCalculationTag(iEntityId, sTagName) {

		let sQueryPath = "tags/calculationTags";
		let aParams = [];

		let aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "DELETE", aParams, aBodyData);

		if (oResponse.statusCode !== 204) {
			let sDeveloperInfo = `Failed to delete tag witn name '${sTagName}' from calculation with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponse.body, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The tag with name '${sTagName}' was deleted with success from calculation with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Add a tag to a calculation version
	 * 
	 * @param {integer} iEntityId - the calculation version entity ID
	 * @param {string} sTagName - the tag name to be added
	 * @return {object} result / error - PLC response / PLC error
	 */
	async addCalculationVersionTag(iEntityId, sTagName) {

		let sQueryPath = "tags/calculationVersionTags";
		let aParams = [];

		let aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "POST", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo = `Failed to add tag witn name '${sTagName}' at the calculation version with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The tag with name '${sTagName}' was added with success at version with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Delete tag from a calculation version
	 * 
	 * @param {integer} iEntityId - the calculation version entity ID
	 * @param {string} sTagName - the tag name to be deleted
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteCalculationVersionTag(iEntityId, sTagName) {

		let sQueryPath = "tags/calculationVersionTags";
		let aParams = [];

		let aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "DELETE", aParams, aBodyData);

		if (oResponse.statusCode !== 204) {
			let sDeveloperInfo = `Failed to delete tag witn name '${sTagName}' from version with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponse.body, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The tag with name '${sTagName}' was deleted with success from version with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Open project
	 * 
	 * @param {string} sProjectId - project id
	 * @return {object} result / error - opened project or undefined in case of error
	 */
	async openProject(sProjectId) {

		let sQueryPath = "projects";
		let aParams = [{
			"name": "action",
			"value": "open"
		}];

		let oBodyData = {
			"PROJECT_ID": sProjectId
		};

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, oBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to open project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo;
			if (oResponseBody.head.messages !== undefined && oResponseBody.head.messages.length > 0) {
				let oMessage = _.find(oResponseBody.head.messages, function (oMsg) {
					return oMsg.code === "ENTITY_NOT_WRITEABLE_INFO";
				});
				if (oMessage !== undefined) {
					let aUsers;
					if (oMessage.details !== undefined && oMessage.details.projectObjs !== undefined && oMessage.details.projectObjs.length > 0) {
						let oPrjDetails = _.find(oMessage.details.projectObjs, function (oDetailsPrj) {
							return oDetailsPrj.id === sProjectId;
						});
						if (oPrjDetails !== undefined && oPrjDetails.openingUsers !== undefined && oPrjDetails.openingUsers.length > 0) {
							aUsers = _.pluck(oPrjDetails.openingUsers, "id");
						}
					}
					if (aUsers !== undefined && aUsers.length > 0) {
						sMessageInfo = `Project with ID '${sProjectId}' was opened in read-only mode! Locked by User(s): ${aUsers.join(", ")}`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
						sMessageInfo = `Project with ID '${sProjectId}' will be ignored since is not editable! Locked by User(s): ${aUsers.join(", ")}`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
					} else {
						sMessageInfo = `Project with ID '${sProjectId}' is locked and was opened in read-only mode!`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
						sMessageInfo = `Project with ID '${sProjectId}' will be ignored since is not editable!`;
						await Message.addLog(this.JOB_ID, sMessageInfo, "warning", undefined, this.Operation);
					}
					// close project
					this.closeProject(sProjectId);

					return false;
				} else {
					let sDeveloperInfo = `Failed to open project with ID '${sProjectId}'.`;
					await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);

					return undefined;
				}
			}
			if (oResponseBody.body !== undefined && oResponseBody.body.transactionaldata !== undefined &&
				oResponseBody.body.transactionaldata[0] !== undefined) {
				sMessageInfo = `Project with ID '${sProjectId}' was opened with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);

				return oResponseBody.body.transactionaldata[0];
			} else {
				let sDeveloperInfo = `Failed to open project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);

				return undefined;
			}
		}
	}

	/** @function
	 * Get Lifecycle configurations
	 * 
	 * @param {string} sProjectId - project id
	 * @returns {array} - Lifecycle configurations or throw error
	 */
	async getLifecycleConfigurations(sProjectId) {

		let sQueryPath = `lifecycleConfigurations/${sProjectId}`;
		let aParams = [{
			"name": "skip",
			"value": 0
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get lifecycle configurations of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
			return undefined;
		} else {
			if (oResponseBody.entities !== undefined) {
				let sMessageInfo = `The lifecycle configurations of project with ID '${sProjectId}' were retrieved with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.entities;
			} else {
				let sDeveloperInfo = `Failed to get lifecycle configurations of project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
				return undefined;
			}
		}
	}

	/** @function
	 * Save lLifecycle configurations
	 * 
	 * @param {string} sProjectId - project id
	 * @returns {array} - Lifecycle configurations or throw error
	 */
	async saveLifecycleConfigurations(sProjectId, aLifecycleConfigurations) {

		let sQueryPath = "lifecycleConfigurations";
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "PATCH", aParams, aLifecycleConfigurations);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save lifecycle configurations of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
			return undefined;
		} else {
			if (oResponseBody.success !== undefined && oResponseBody.success.entities !== undefined) {
				let sMessageInfo = `The lifecycle configurations of project with ID '${sProjectId}' were saved with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.entities;
			} else {
				let sDeveloperInfo = `Failed to save lifecycle configurations of project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
				return undefined;
			}
		}
	}

	/** @function
	 * Get lifecycle quantities
	 * 
	 * @param {string} sProjectId - project id
	 * @returns {array} - lifecycle quantities or throw error
	 */
	async getLifecycleQuantities(sProjectId) {

		let sQueryPath = `lifecycleQuantities/${sProjectId}`;
		let aParams = [{
			"name": "skip",
			"value": 0
		}];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get lifecycle quantities of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
			return undefined;
		} else {

			if (oResponseBody.entities !== undefined) {
				let sMessageInfo = `The lifecycle quantities of project with ID '${sProjectId}' were retrieved with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.entities;
			} else {
				let sDeveloperInfo = `Failed to get lifecycle quantities of project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
				return undefined;
			}
		}
	}

	/** @function
	 * Save lifecycle quantities
	 * 
	 * @param {string} sProjectId - project id
	 * @param {object} aQuantities - total quantities period values
	 * @returns {boolean} - true if success or throw error
	 */
	async saveLifecycleQuantities(sProjectId, aLifecycleQuantities) {

		let sQueryPath = "lifecycleQuantities";
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "PATCH", aParams, aLifecycleQuantities);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save lifecycle quantities of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
			return undefined;
		} else {

			if (oResponseBody.success !== undefined && oResponseBody.success.entities !== undefined) {
				let sMessageInfo = `The lifecycle quantities of project with ID '${sProjectId}' were saved with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.entities;
			} else {
				let sDeveloperInfo = `Failed to save lifecycle quantities of project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.error, this.Operation);
				return undefined;
			}

		}
	}

	/** @function
	 * Get project activity lifecycle surcharges
	 * 
	 * @param {string} sProjectId - project id
	 * @returns {array} - project activity lifecycle surcharges or throw error
	 */
	async getProjectActivityLifecycleSurcharges(sProjectId) {

		let sQueryPath = "projects/activity-price-surcharges";
		let aParams = [{
			"name": "id",
			"value": sProjectId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get project activity price surcharges of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			if (oResponseBody.body !== undefined && oResponseBody.body.transactionaldata !== undefined) {
				let sMessageInfo = `The project activity price surcharges of project with ID '${sProjectId}' were retrieved with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.body.transactionaldata;
			} else {
				let sDeveloperInfo = `Failed to get project activity price surcharges of project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
				return undefined;
			}
		}

	}

	/** @function
	 * Save project activity lifecycle surcharges
	 * 
	 * @param {string} sProjectId - project id
	 * @param {object} aActivityLifecycleSurcharges - activity lifecycle surcharges
	 * @returns {boolean} - true if success or throw error
	 */
	async saveProjectActivityLifecycleSurcharges(sProjectId, aActivityLifecycleSurcharges) {

		let sQueryPath = "projects/activity-price-surcharges";
		let aParams = [{
			"name": "id",
			"value": sProjectId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aActivityLifecycleSurcharges);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save project activity price surcharges of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The activity price surcharges for project with ID '${sProjectId}' were saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Get project material lifecycle surcharges
	 * 
	 * @param {string} sProjectId - project id
	 * @returns {array} - project material lifecycle surcharges or throw error
	 */
	async getProjectMaterialLifecycleSurcharges(sProjectId) {

		let sQueryPath = "projects/material-price-surcharges";
		let aParams = [{
			"name": "id",
			"value": sProjectId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get project material price surcharges of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			if (oResponseBody.body !== undefined && oResponseBody.body.transactionaldata !== undefined) {
				let sMessageInfo = `The project material price surcharges of project with ID '${sProjectId}' were retrieved with success!`;
				await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
				return oResponseBody.body.transactionaldata;
			} else {
				let sDeveloperInfo = `Failed to get project material price surcharges of project with ID '${sProjectId}'.`;
				await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
				return undefined;
			}
		}
	}

	/** @function
	 * Save project material lifecycle surcharges
	 * 
	 * @param {string} sProjectId - project id
	 * @param {object} aMaterialLifecycleSurcharges - material lifecycle surcharges
	 * @returns {boolean} - true if success or throw error
	 */
	async saveProjectMaterialLifecycleSurcharges(sProjectId, aMaterialLifecycleSurcharges) {

		let sQueryPath = "projects/material-price-surcharges";
		let aParams = [{
			"name": "id",
			"value": sProjectId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aMaterialLifecycleSurcharges);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to save project material price surcharges of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `The material price surcharges for project with ID '${sProjectId}' were saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Calculate project lifecycle costs - will generate the lifecycle versions
	 * 
	 * @param {string} sProjectId - project id
	 */
	async calculateProjectLifecycleCosts(sProjectId) {

		let sQueryPath = "projects";
		let aParams = [{
			"name": "id",
			"value": sProjectId
		}, {
			"name": "action",
			"value": "calculate_lifecycle_versions"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to calculate project lifecycle costs of project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Project lifecycle costs for project with ID '${sProjectId}' have been calculated successfully!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Check task status
	 * 
	 * @param {string} sTaskId - task id
	 * @returns {string} - task status or throw error
	 */
	async checkTaskStatus(sTaskId) {

		let sQueryPath = "tasks";
		let aParams = [{
			"name": "id",
			"value": sTaskId
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get the status of task with ID '${sTaskId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		}

		return oResponseBody.body.transactionaldata[0].STATUS;
	}

	/** @function
	 * Close project
	 * 
	 * @param {string} sProjectId - project id
	 * @returns {boolean} - true if closed with success or throw error
	 */
	async closeProject(sProjectId) {

		let sQueryPath = "projects";
		let aParams = [{
			"name": "action",
			"value": "close"
		}];

		let oBodyData = {
			"PROJECT_ID": sProjectId
		};

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, oBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to close project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {

			let sMessageInfo = `Project with ID '${sProjectId}' was closed with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * Init session with PLC
	 * 
	 * @param {string} sLanguage - logon language
	 * @return {object} result / error - PLC response / PLC error
	 */
	async initPlcSession(sLanguage) {

		let sQueryPath = "init-session";
		let aParams = [{
			"name": "language",
			"value": sLanguage
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to initialize session with PLC. If this error persists, please contact your system administrator!";
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = "Init PLC session with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * End PLC session
	 * 
	 * @return {object} result / error - PLC response / PLC error
	 */
	async logoutPlcSession() {

		let sQueryPath = "logout";
		let aParams = [];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to logout from PLC. If this error persists, please contact your system administrator!";
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = "Logout from PLC with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Get Addin Configuration from PLC
	 * 
	 * @param {string} addinGuid - addin unique guid
	 * @param {string} addinVersion - addin version
	 * @return {object} result / error - PLC response / the error
	 */
	async getAddinConfiguration(addinGuid, addinVersion) {

		let sQueryPath = "addin-configurations";
		let aParams = [{
			"name": "guid",
			"value": addinGuid
		}, {
			"name": "version",
			"value": addinVersion
		}, {
			"name": "use_previous_version",
			"value": "false"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to get addin configuration with ID '${addinGuid}' and version '${addinVersion}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `Addin configuration with ID '${addinGuid}' and version '${addinVersion}' was retrieved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Copy version items to PLC
	 * 
	 * @param {array} Items Array
	 * @return {object} result / error - PLC response / the error
	 */
	async copyItems(aItems) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "mode",
			"value": "replace"
		}, {
			"name": "compressedResult",
			"value": "true"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aItems);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			let sDeveloperInfo = "Failed to copy version items to PLC.";
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = "Copy version items to PLC with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * Update version items to PLC
	 * 
	 * @param {array} Items Array
	 * @return {object} result / error - PLC response / the error
	 */
	async updateItems(iVersionId, aBodyData) {

		let sQueryPath = "items";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "compressedResult",
			"value": "true"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to update items of calculation version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = `'${aBodyData.length}' item(s) of calculation version with ID '${iVersionId}' were updated with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return true;
		}
	}

	/** @function
	 * GET trasportation (t_metadata info) from PLC
	 * 
	 * @return {object} result / error - PLC response / the error
	 */
	async getTransportationMetadata() {

		let sQueryPath = "transportation";
		let aParams = [{
			"name": "businessObjects",
			"value": "customizing"
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to get metadata from PLC.";
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = "Metadata from PLC was retrieved with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody;
		}
	}

	/** @function
	 * GET metadata (t_metadata info) from PLC
	 * @param {string} sPath - the metadata path
	 * @param {string} sBusinessObject - the metadata business object
	 * @param {string} sColumnId - the metadata column
	 * @param {string} isCustom - flag if should return all the custom fields for master data objects
	 * 
	 * @return {object} result / error - PLC response / the error
	 */
	async getMetadata(sPath, sBusinessObject, sColumnId, isCustom) {

		let sQueryPath = "customfieldsformula";
		let aParams = [{
			"name": "path",
			"value": sPath
		}, {
			"name": "business_object",
			"value": sBusinessObject
		}];

		if (sColumnId !== undefined && sColumnId !== "") {
			aParams.push({
				"name": "column",
				"value": sColumnId
			});
		}
		if (isCustom !== undefined && isCustom === true) {
			aParams.push({
				"name": "is_custom",
				"value": isCustom
			});
		}

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = "Failed to get metadata from PLC.";
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo = "Metadata from PLC was retrieved with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody.body.METADATA;
		}
	}

	/** @function
	 * Update master data for calculation version
	 * 
	 * @param {object} oCalculatonVersion - the calculation version
	 * @param {boolean} bCompressedResult - flag if the response should be compressed
	 * @return {object} result / error - PLC response / PLC error
	 */
	async updateMasterData(oCalculatonVersion, bCompressedResult) {

		let sQueryPath = "calculation-versions";
		let aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "updateMasterdataTimestamp",
			"value": "true"
		}, {
			"name": "loadMasterdata",
			"value": "true"
		}];

		if (bCompressedResult !== undefined && bCompressedResult === true) {
			aParams.push({
				"name": "compressedResult",
				"value": "true"
			});
		}

		let aBodyData = [{
			"CALCULATION_ID": oCalculatonVersion.CALCULATION_ID,
			"CALCULATION_VERSION_ID": oCalculatonVersion.CALCULATION_VERSION_ID,
			"CALCULATION_VERSION_NAME": oCalculatonVersion.CALCULATION_VERSION_NAME,
			"CUSTOMER_ID": oCalculatonVersion.CUSTOMER_ID,
			"REPORT_CURRENCY_ID": oCalculatonVersion.REPORT_CURRENCY_ID,
			"EXCHANGE_RATE_TYPE_ID": oCalculatonVersion.EXCHANGE_RATE_TYPE_ID,
			"ROOT_ITEM_ID": oCalculatonVersion.ROOT_ITEM_ID,
			"SALES_PRICE_CURRENCY_ID": oCalculatonVersion.SALES_PRICE_CURRENCY_ID,
			"SALES_DOCUMENT": oCalculatonVersion.SALES_DOCUMENT,
			"VALUATION_DATE": oCalculatonVersion.VALUATION_DATE,
			"MATERIAL_PRICE_STRATEGY_ID": oCalculatonVersion.MATERIAL_PRICE_STRATEGY_ID,
			"ACTIVITY_PRICE_STRATEGY_ID": oCalculatonVersion.ACTIVITY_PRICE_STRATEGY_ID,
			"STATUS_ID": oCalculatonVersion.STATUS_ID,
			"SELECTED_TOTAL_COSTING_SHEET": oCalculatonVersion.SELECTED_TOTAL_COSTING_SHEET,
			"SELECTED_TOTAL_COMPONENT_SPLIT": oCalculatonVersion.SELECTED_TOTAL_COMPONENT_SPLIT
		}];

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		let oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			let sDeveloperInfo = `Failed to update master data for calculation version with ID '${oCalculatonVersion.CALCULATION_VERSION_ID}'.`;
			await Message.addLog(this.JOB_ID, sDeveloperInfo, "error", oResponseBody.head.messages, this.Operation);
			return undefined;
		} else {
			let sMessageInfo =
				`Update master data for calculation version with ID '${oCalculatonVersion.CALCULATION_VERSION_ID}' was done with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message", undefined, this.Operation);
			return oResponseBody.body.transactionaldata[0];
		}
	}

	async upsertMaterial(aMaterials) {

		let sQueryPath = "administration",
			aParameters = [];

		aParameters.push({
			name: "ignoreBadData",
			value: "true"
		});
		aParameters.push({
			name: "business_object",
			value: "Material"
		});

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParameters, aMaterials);
		let oResponseBody = oResponse.body;

		return oResponseBody;
	}

	async upsertMaterialPlant(aMaterialPlants) {

		let sQueryPath = "administration",
			aParameters = [];

		aParameters.push({
			name: "ignoreBadData",
			value: "true"
		});
		aParameters.push({
			name: "business_object",
			value: "Material_Plant"
		});

		let oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParameters, aMaterialPlants);
		let oResponseBody = oResponse.body;

		return oResponseBody;
	}

	async upsertMaterialPrices(aMaterialPrices) {

		let sQueryPath = "materialPrices/upsert",
			aParameters = [];

		aParameters.push({
			name: "returnType",
			value: "full"
		});

		let oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "PUT", aParameters, aMaterialPrices);
		let oResponseBody = oResponse.body;

		return oResponseBody;
	}

}
exports.Dispatcher = module.exports.Dispatcher = Dispatcher;
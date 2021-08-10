/*eslint-env node, es6 */
"use strict";

/**
 * @fileOverview
 * 
 * List of all service implementations of Standard PLC Routes
 * 
 * @name standardPlcService.js
 */

const DispatcherPlc = require(global.appRoot + "/lib/util/plcDispatcher.js").PlcDispatcher;

const MessageLibrary = require(global.appRoot + "/lib/util/message.js");
const Code = MessageLibrary.Code;
const Message = MessageLibrary.Message;
const PlcException = MessageLibrary.PlcException;

/** @class
 * @classdesc Standard PLC services
 * @name Dispatcher 
 */
class Dispatcher {

	/** @constructor
	 * Is setting the JOB_ID in order to log the messages
	 */
	constructor(request) {

		this.JOB_ID = request.JOB_ID;
		this.PlcDispatcher = new DispatcherPlc(request);

	}

	/** @function
	 * Open variant matrix of a version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async openVariantMatrix(iVersionId) {

		const sQueryPath = "calculation-versions/" + iVersionId;
		const aParams = [];

		const oBodyData = {
			"LOCK": {
				"CONTEXT": "variant_matrix",
				"IS_WRITEABLE": 1
			}
		};

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PATCH", aParams, oBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to open variant matrix of calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variant matrix of version with ID '${iVersionId}' was opened with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * Create new variant for a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {object} oVariant - the variant details
	 * @return {object} result / error - PLC response / PLC error
	 */
	async createNewVariant(iVersionId, oVariant) {

		const sQueryPath = `calculation-versions/${iVersionId}/variants`;
		const aParams = [];

		var oBodyData = {
			"VARIANT_NAME": oVariant.VARIANT_NAME,
			"COMMENT": oVariant.COMMENT,
			"VARIANT_TYPE": oVariant.VARIANT_TYPE !== undefined ? oVariant.VARIANT_TYPE : 0,
			"IS_SELECTED": oVariant.IS_SELECTED !== undefined ? oVariant.IS_SELECTED : 1,
			"REPORT_CURRENCY_ID": oVariant.REPORT_CURRENCY_ID,
			"EXCHANGE_RATE_TYPE_ID": oVariant.EXCHANGE_RATE_TYPE_ID,
			"SALES_PRICE_CURRENCY_ID": oVariant.SALES_PRICE_CURRENCY_ID,
			"ITEMS": []
		};
		for (var i = 0; i < oVariant.ITEMS.length; i++) {
			const oItem = oVariant.ITEMS[i];
			const oVariantItem = {
				"ITEM_ID": oItem.ITEM_ID,
				"IS_INCLUDED": oItem.IS_INCLUDED,
				"QUANTITY_STATE": oItem.QUANTITY_STATE,
				"QUANTITY_UOM_ID": oItem.QUANTITY_UOM_ID,
				"QUANTITY": oItem.QUANTITY
			};
			oBodyData.ITEMS.push(oVariantItem);
		}

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, oBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			const sDeveloperInfo = `Failed to create variant for calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variant with name '${oVariant.VARIANT_NAME}' for version with ID '${iVersionId}' was created with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "calculation-versions/" + iVersionId + "/variants";
		const aParams = [];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PATCH", aParams, aVariantsLastModifiedOn);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to save all variants of calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variants of calculation version with ID '${iVersionId}' were saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "calculation-versions/" + iVersionId + "/variants/" + iVariantId;
		const aParams = [];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "DELETE", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to delete variant with ID '${iVariantId}' of version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variant with ID '${iVariantId}' of version with ID '${iVersionId}' was deleted with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
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

		const sQueryPath = `calculation-versions/${iVersionId}/variant-calculator`;
		const aParams = [];

		var oBodyData = {
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
		for (var i = 0; i < oVariant.ITEMS.length; i++) {
			const oItem = oVariant.ITEMS[i];

			const iItemId = oItem.ITEM_ID !== undefined ? oItem.ITEM_ID : null;
			oBodyData.ITEMS.ITEM_ID.push(iItemId);

			const iQuantity = oItem.QUANTITY !== undefined ? oItem.QUANTITY : null;
			oBodyData.ITEMS.QUANTITY.push(iQuantity);

			const iQuantityState = oItem.QUANTITY_STATE !== undefined ? oItem.QUANTITY_STATE : null;
			oBodyData.ITEMS.QUANTITY_STATE.push(iQuantityState);

			const sQuantityUomId = oItem.QUANTITY_UOM_ID !== undefined ? oItem.QUANTITY_UOM_ID : null;
			oBodyData.ITEMS.QUANTITY_UOM_ID.push(sQuantityUomId);
		}

		var aBodyData = [];
		aBodyData.push(oBodyData);

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo =
				`Failed to calculate the variant with ID '${oVariant.VARIANT_ID}' of version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variant with ID '${oVariant.VARIANT_ID}' of version with ID '${iVersionId}' was calculated with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * Save a newly calculated variant from variant matrix of a calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @param {integer} iVariantId - the variant ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async saveNewlyCalculatedVariant(iVersionId, iVariantId) {

		const sQueryPath = `calculation-versions/${iVersionId}/variant-calculator/${iVariantId}`;
		const aParams = [];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo =
				`Failed to save the variant with ID '${iVariantId}' of version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variant with ID '${iVariantId}' of version with ID '${iVersionId}' was saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = `calculation-versions/${iVersionId}/variant-generator/${iVariantId}`;
		const aParams = [];

		const oBodyData = {
			"TARGET_CALCULATION_ID": iTargetCalculationId,
			"CALCULATION_VERSION_NAME": sCalculationVersionName
		};

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, oBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			const sDeveloperInfo =
				`Failed to generate a version in calculation with ID '${iTargetCalculationId}' from variant with ID '${iVariantId}' of version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const oResult = oResponseBody.body.transactionaldata[0];
			const iNewVersionId = oResult.LAST_GENERATED_VERSION_ID;
			const sMessageInfo =
				`Version with ID '${iNewVersionId}' and name '${sCalculationVersionName}' was generated with success into calculation with ID '${iTargetCalculationId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "calculation-versions/" + iVersionId;
		const aParams = [];

		const oBodyData = {
			"LOCK": {
				"CONTEXT": "variant_matrix",
				"IS_WRITEABLE": 0
			}
		};

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PATCH", aParams, oBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to close variant matrix of calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variant matrix of version with ID '${iVersionId}' was closed with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "calculations";
		const aParams = [];

		const aBodyData = [{
			"CALCULATION_ID": oCalculationDetails.CALCULATION_ID,
			"CALCULATION_NAME": oCalculationDetails.CALCULATION_NAME,
			"CURRENT_CALCULATION_VERSION_ID": iVersionId,
			"LAST_MODIFIED_ON": oCalculationDetails.LAST_MODIFIED_ON,
			"PROJECT_ID": oCalculationDetails.PROJECT_ID
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo =
				`Failed to set version with ID '${iVersionId}' as current in calculation with ID '${oCalculationDetails.CALCULATION_ID}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo =
				`Version with ID '${iVersionId}' from calculation with ID '${oCalculationDetails.CALCULATION_ID}' was set as current with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "calculations";
		const aParams = [{
			"name": "calculation_id",
			"value": iCalculationId
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "GET", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to get calculation with ID '${iCalculationId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Calculation with ID '${iCalculationId}' was retrieved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * Create a new calculation and a new version
	 * 
	 * @param {object} oDetails - the calculation and version details
	 * @param {string} sCalculationName - the calculation name
	 * @param {string} sVersionName - the calculation version name
	 * @return {object} result / error - PLC response / PLC error
	 */
	async createNewCalculation(oDetails, sCalculationName, sVersionName) {

		const sQueryPath = "calculations";
		const aParams = [{
			"name": "action",
			"value": "create"
		}, {
			"name": "calculate",
			"value": "true"
		}];

		if (oDetails.VALUATION_DATE === undefined || oDetails.VALUATION_DATE === null || oDetails.VALUATION_DATE === "") {
			const sTodayDate = new Date().toISOString();
			const sToday = sTodayDate.split(/[t,T]/)[0];
			oDetails.VALUATION_DATE = sToday + "T00:00:00Z";
		} else {
			if (oDetails.VALUATION_DATE.length > 10) {
				oDetails.VALUATION_DATE = oDetails.VALUATION_DATE.substring(0, 10);
			}
		}

		const aBodyData = [{
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

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			const sDeveloperInfo =
				`Failed to create a new calculation with name '${sCalculationName}' in project with ID '${oDetails.PROJECT_ID}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sProjectId = oDetails.PROJECT_ID;
			const oNewCalculation = oResponseBody.body.transactionaldata[0];
			const sCalculationId = oNewCalculation.CALCULATION_ID;
			const sNewCalculationName = oNewCalculation.CALCULATION_NAME;
			const oNewVersion = oNewCalculation.CALCULATION_VERSIONS[0];
			const sVersionId = oNewVersion.CALCULATION_VERSION_ID;
			const sNewVersionName = oNewVersion.CALCULATION_VERSION_NAME;
			const sCalcMessageInfo =
				`The calculation with ID '${sCalculationId}' and name '${sNewCalculationName}' was created with success in project with ID '${sProjectId}'.`;
			await Message.addLog(this.JOB_ID, sCalcMessageInfo, "message");
			const sVersMessageInfo =
				`The version with ID '${sVersionId}' and name '${sNewVersionName}' was created with success in calculation with ID '${sCalculationId}'.`;
			await Message.addLog(this.JOB_ID, sVersMessageInfo, "message");
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

		const sQueryPath = "calculation-versions";
		const aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "action",
			"value": "save"
		}];

		const aBodyData = [{
			"CALCULATION_ID": oVersion.CALCULATION_ID,
			"CALCULATION_VERSION_ID": oVersion.CALCULATION_VERSION_ID,
			"CALCULATION_VERSION_NAME": oVersion.CALCULATION_VERSION_NAME
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to save calculation version with ID '${oVersion.CALCULATION_VERSION_ID}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Calculation version with ID '${oVersion.CALCULATION_VERSION_ID}' was saved with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody.body.transactionaldata[0];
		}
	}

	/** @function
	 * Create new calculation version as copy of another version
	 * 
	 * @param {integer} iVersionId - version id to copy
	 * @return {object} result / error - PLC response / PLC error
	 */
	async createNewVersionAsCopy(iVersionId) {

		const sQueryPath = "calculation-versions";
		const aParams = [{
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

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			const sDeveloperInfo = `Failed to create new version as copy of calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const oNewCopyVersion = oResponseBody.body.transactionaldata[0];
			const sMessageInfo =
				`The version with ID '" + oNewCopyVersion.CALCULATION_VERSION_ID + "' was created with success as copy of version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oNewCopyVersion;
		}
	}

	/** @function
	 * Open calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async openCalculationVersion(iVersionId) {

		const sQueryPath = "calculation-versions";
		const aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "id",
			"value": parseInt(iVersionId)
		}, {
			"name": "compressedResult",
			"value": "true"
		}, {
			"name": "loadMasterdata",
			"value": "false"
		}, {
			"name": "action",
			"value": "open"
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to open calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Calculation version with ID '${iVersionId}' was opened with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody.body.transactionaldata[0];
		}
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

		const sQueryPath = "items";
		const aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "compressedResult",
			"value": "false"
		}];

		const aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId,
			"ITEM_CATEGORY_ID": 10,
			"ITEM_ID": iItemId,
			"REFERENCED_CALCULATION_VERSION_ID": iReferenceVersionId
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo =
				`Failed to reference version with ID '${iReferenceVersionId}' into calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Calculation version with ID '${iVersionId}' was referenced with success into version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "items";
		const aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "mode",
			"value": "normal"
		}, {
			"name": "compressedResult",
			"value": "false"
		}];

		const aBodyData = [{
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

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (!(oResponse.statusCode === 201 || oResponse.statusCode === 200)) {
			const sDeveloperInfo = `Failed to add material item with description '${sDescription}' in calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Material item with description '${sDescription}' was added with success in version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "items";
		const aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "mode",
			"value": "normal"
		}, {
			"name": "compressedResult",
			"value": "false"
		}];

		const aBodyData = [{
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

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (!(oResponse.statusCode === 201 || oResponse.statusCode === 200)) {
			const sDeveloperInfo =
				`Failed to add variable item with description '${sDescription}'  in calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Variable item with description '${sDescription}' was added with success in version with ID '${iVersionId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody.body.transactionaldata;
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

		const sQueryPath = "items";
		const aParams = [{
			"name": "calculate",
			"value": "true"
		}];

		var aBodyData = [];
		for (var i = 0; i < aItemsToUpdate.length; i++) {
			const oItemToUpdate = {
				"ITEM_ID": aItemsToUpdate[i].ITEM_ID,
				"ITEM_CATEGORY_ID": aItemsToUpdate[i].ITEM_CATEGORY_ID,
				"CALCULATION_VERSION_ID": aItemsToUpdate[i].CALCULATION_VERSION_ID,
				"REFERENCED_CALCULATION_VERSION_ID": aItemsToUpdate[i].CURRENT_CALCULATION_VERSION_ID
			};
			aBodyData.push(oItemToUpdate);
		}

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to update referenced items of calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Update referenced items of version with ID '${iVersionId}' was done with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * Close calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async closeCalculationVersion(iVersionId) {

		const sQueryPath = "calculation-versions";
		const aParams = [{
			"name": "calculate",
			"value": "false"
		}, {
			"name": "action",
			"value": "close"
		}];

		const aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to close calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Calculation version with ID '${iVersionId}' was closed with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * Delete calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async deleteCalculationVersion(iVersionId) {

		const sQueryPath = "calculation-versions";
		const aParams = [];

		const aBodyData = [{
			"CALCULATION_VERSION_ID": iVersionId
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "DELETE", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to delete calculation version with ID '${iVersionId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = `Calculation version with ID '${iVersionId}' was deleted with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "tags/calculationTags";
		const aParams = [];

		const aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		const oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			const sDeveloperInfo = `Failed to add tag witn name '${sTagName}' at the calculation with ID '${iEntityId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody);
		} else {
			const sMessageInfo = `The tag with name '${sTagName}' was added with success at calculation with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "tags/calculationTags";
		const aParams = [];

		const aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		const oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "DELETE", aParams, aBodyData);

		if (oResponse.statusCode !== 204) {
			const sDeveloperInfo = `Failed to delete tag witn name '${sTagName}' from calculation with ID '${iEntityId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponse.body);
		} else {
			const sMessageInfo = `The tag with name '${sTagName}' was deleted with success from calculation with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "tags/calculationVersionTags";
		const aParams = [];

		const aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		const oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "POST", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 201) {
			const sDeveloperInfo = `Failed to add tag witn name '${sTagName}' at the calculation version with ID '${iEntityId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody);
		} else {
			const sMessageInfo = `The tag with name '${sTagName}' was added with success at version with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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

		const sQueryPath = "tags/calculationVersionTags";
		const aParams = [];

		const aBodyData = [{
			"entityId": iEntityId,
			"tagName": sTagName
		}];

		const oResponse = await this.PlcDispatcher.dispatchPublicApi(sQueryPath, "DELETE", aParams, aBodyData);

		if (oResponse.statusCode !== 204) {
			const sDeveloperInfo = `Failed to delete tag witn name '${sTagName}' from version with ID '${iEntityId}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponse.body);
		} else {
			const sMessageInfo = `The tag with name '${sTagName}' was deleted with success from version with ID '${iEntityId}'.`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
		}
	}

	/** @function
	 * Init session with PLC
	 * 
	 * @param {string} sLanguage - logon language
	 * @return {object} result / error - PLC response / PLC error
	 */
	async initPlcSession(sLanguage) {

		const sQueryPath = "init-session";
		const aParams = [{
			"name": "language",
			"value": sLanguage
		}];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = "Failed to initialize session with PLC. If this error persists, please contact your system administrator!";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = "Init PLC session with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * End PLC session
	 * 
	 * @return {object} result / error - PLC response / PLC error
	 */
	async logoutPlcSession() {

		const sQueryPath = "logout";
		const aParams = [];

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "POST", aParams);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = "Failed to logout from PLC. If this error persists, please contact your system administrator!";
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo = "Logout from PLC with success!";
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
			return oResponseBody;
		}
	}

	/** @function
	 * Update master data for calculation version
	 * 
	 * @param {integer} iVersionId - the calculation version ID
	 * @return {object} result / error - PLC response / PLC error
	 */
	async updateMasterData(oCalculatonVersion) {

		const sQueryPath = "calculation-versions";
		const aParams = [{
			"name": "calculate",
			"value": "true"
		}, {
			"name": "updateMasterdataTimestamp",
			"value": "true"
		}, {
			"name": "compressedResult",
			"value": "true"
		}, {
			"name": "loadMasterdata",
			"value": "true"
		}];

		var aBodyData = [{
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

		const oResponse = await this.PlcDispatcher.dispatchPrivateApi(sQueryPath, "PUT", aParams, aBodyData);
		const oResponseBody = JSON.parse(oResponse.body);

		if (oResponse.statusCode !== 200) {
			const sDeveloperInfo = `Failed to update master data for calculation version with ID '${oCalculatonVersion.CALCULATION_VERSION_ID}'.`;
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sDeveloperInfo, oResponseBody.head.messages);
		} else {
			const sMessageInfo =
				`Update master data for calculation version with ID '${oCalculatonVersion.CALCULATION_VERSION_ID}' was done with success!`;
			await Message.addLog(this.JOB_ID, sMessageInfo, "message");
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
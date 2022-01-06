/*eslint-env node, es6 */
/*eslint eqeqeq: 0 */
"use strict";

const _ = require("underscore");

/**
 * @fileOverview
 * 
 * Helper functionality used to validate an array of items:
 *		- delete all unnecessary properties of Items based on PLC metadata in order to avoid validation errors
 *		- delete some fields that should not be in all parent (assembly) items
 * 
 * @name itemValidator.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");
const StandardPlcDispatcher = require(global.appRoot + "/lib/routerService/standardPlcService.js").Dispatcher;

/** @class
 * @classdesc Item Validator
 * @name ItemValidator 
 */
class ItemValidator {

	constructor(request) {

		this.StandardPlcService = new StandardPlcDispatcher(request);

		if (helpers.isRequestFromJob(request) || (request.IS_ONLINE_MODE !== undefined && request.IS_ONLINE_MODE === false)) {
			this.userId = global.TECHNICAL_USER; // technical user
		} else {
			this.userId = request.user.id.toUpperCase(); // request user
		}

	}

	/** @function
	 * Returns full metdadata properties list with custom fields
	 * 
	 * @param {array} aMetaData - the PLC metadata
	 * @return {array} aMetaData - the extend PLC metadata with custom fields info
	 */
	extendMetadataCustomFields(aMetaData) {

		let sColRegex = /^CUST_[A-Z][A-Z0-9_]*$/;
		let aCustomFields = _.filter(aMetaData, function (oPropertyMetadata) {
			return oPropertyMetadata.IS_CUSTOM == 1 && oPropertyMetadata.UOM_CURRENCY_FLAG != 1;
		});
		_.each(aCustomFields, function (oPropertyValue) {

			let columnName = oPropertyValue.COLUMN_ID;
			let aCustAttr = _.clone(oPropertyValue.ATTRIBUTES);
			_.each(oPropertyValue.ATTRIBUTES, function (oPropertyValueAttr, index) {
				oPropertyValue.ATTRIBUTES[index].COLUMN_ID = oPropertyValueAttr.COLUMN_ID + "_MANUAL";
			});

			oPropertyValue.COLUMN_ID = columnName + "_MANUAL";

			if (sColRegex.exec(oPropertyValue.COLUMN_ID)) {
				let oCustField = {};
				oCustField.COLUMN_ID = columnName + "_IS_MANUAL";
				oCustField.SEMANTIC_DATA_TYPE = "BooleanInt";
				oCustField.IS_CUSTOM = oPropertyValue.IS_CUSTOM;
				oCustField.ROLLUP_TYPE_ID = oPropertyValue.ROLLUP_TYPE_ID;
				_.each(aCustAttr, function (oPropertyValueAttr, index) {
					aCustAttr[index].COLUMN_ID = oPropertyValueAttr.COLUMN_ID + "_IS_MANUAL";
				});
				oCustField.ATTRIBUTES = aCustAttr;
				aMetaData.push(oCustField);
			}
		});

		return aMetaData;
	}

	/**
	 * Creates a map of items containing the item-id as key and an object with the 
	 *      {   item-id, 
	 *          array of children
	 *          and the parent-id
	 *      }
	 *  as value. This is used to faster validate item structures for create item.
	 */
	createItemsTree(sMode, aBodyItems) {
		let iTopNodeId;
		let bTopNodeFound = false;
		let mItems = new Map();

		let bModeReplace = sMode === "replace";
		let bModeNotReplace = sMode === "updatemasterdataandprices" || sMode === "noupdatemasterdataandprices";

		aBodyItems.forEach(function (oItem) {

			if ((bModeReplace && oItem.ITEM_ID >= 0) || (bModeNotReplace && oItem.PARENT_ITEM_ID >= 0)) {
				if (!bTopNodeFound) {
					iTopNodeId = oItem.ITEM_ID;
					bTopNodeFound = true;
				}
			}
			mItems.set(oItem.ITEM_ID, {
				iItemId: oItem.ITEM_ID,
				aChildren: [],
				iParentItemId: oItem.PARENT_ITEM_ID
			});
		});

		//build tree
		for (let value of mItems.values()) {
			if (!helpers.isUndefinedOrNull(value.iParentItemId)) {
				let oValue = mItems.get(value.iParentItemId);
				//could be undefined for top node
				if (!helpers.isUndefinedOrNull(oValue)) {
					oValue.aChildren.push(value);
				}
			}
		}

		return {
			itemTree: mItems,
			topNodeId: iTopNodeId
		};
	}

	/**
	 * Returns an array containing all distinct parent_item_ids within an (opened) calculation version. Can be used to decide if an item
	 * is an assembly or not. The root item's parent_item_id (null) is not included in this array.
	 *
	 * @return Array containing the ids.
	 */
	async getParentItemIds(iCalculationVersionId, sSessionId) {
		let hdbClient = await DatabaseClass.createConnection();
		let connection = new DatabaseClass(hdbClient);
		let statement = await connection.preparePromisified(
			`
			select distinct parent_item_id
			from "sap.plc.db::basis.t_item_temporary"
			where 	calculation_version_id = ?
					and session_id = ?
					and parent_item_id is not null
					and is_deleted = 0
		`
		);
		let aResults = await connection.statementExecPromisified(statement, [iCalculationVersionId, sSessionId]);
		hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db

		return Array.from(aResults.slice()).map(oRow => oRow.PARENT_ITEM_ID);
	}

	/** @function
	 * Used to get metadata attrybute key
	 * 
	 * @param {object} oInput - the item entry (containing also the metadata)
	 * @param {string} sPropertyKey - the item property key
	 */
	getMetadataAttributeKey(oInput, sPropertyKey) {
		return [sPropertyKey, oInput.metadata[0].PATH, oInput.categoryId, oInput.subitemState].toString();
	}

	/** @function
	 * Returns a filtered and valid input item entity
	 * 
	 * @param {object} oInput - the item entry (containing also the metadata)
	 */
	checkItem(oInput, oPropertyMetadataCache, oPropertyMetadataAttributesCache) {

		let that = this;
		let sIsManualRegex = /^CUST_[A-Z][A-Z0-9_]*_IS_MANUAL$/;

		let oValidatedEnity = {};
		_.each(oInput.entity, function (oPropertyValue, sPropertyKey) {
			let aPropertyMetadata = null;
			let aPropertyMetadataAttributes = null;
			let sMetadataAttributeKey = that.getMetadataAttributeKey(oInput, sPropertyKey);
			if (oPropertyMetadataAttributesCache.has(sMetadataAttributeKey)) {
				aPropertyMetadata = oPropertyMetadataCache.get(sPropertyKey);
				aPropertyMetadataAttributes = oPropertyMetadataAttributesCache.get(sMetadataAttributeKey);
			} else {
				aPropertyMetadata = _.filter(oInput.metadata, function (oPropertyMetadataEntry) {
					return oPropertyMetadataEntry.COLUMN_ID === sPropertyKey;
				});
				if (aPropertyMetadata.length === 0) {
					delete oInput.entity[sPropertyKey];
					return;
				}
				if (aPropertyMetadata.length > 1) {
					delete oInput.entity[sPropertyKey];
					return;
				}
				aPropertyMetadataAttributes = _.filter(aPropertyMetadata[0].ATTRIBUTES, function (oAttributeMetadata) {
					return oAttributeMetadata.ITEM_CATEGORY_ID == oInput.categoryId && oAttributeMetadata.SUBITEM_STATE === oInput.subitemState;
				});
				if (aPropertyMetadataAttributes.length === 0) {
					delete oInput.entity[sPropertyKey];
					return;
				}

				if (aPropertyMetadataAttributes.length > 1) {
					delete oInput.entity[sPropertyKey];
					return;
				}

				// is property allowed to be contained in the request even it is a known one?; => check if it is read-only and transferable property
				if (aPropertyMetadataAttributes[0].IS_READ_ONLY === 1 && aPropertyMetadataAttributes[0].IS_TRANSFERABLE !== 1) {
					if (aPropertyMetadataAttributes[0].SUBITEM_STATE !== 1 || aPropertyMetadata[0].ROLLUP_TYPE_ID === 0 ||
						aPropertyMetadata[0].IS_CUSTOM !== 1 || (!sIsManualRegex.exec(aPropertyMetadata[0].COLUMN_ID)) || oPropertyValue !== 0) {
						delete oInput.entity[sPropertyKey];
						return;
					}
				}
				oPropertyMetadataCache.set(sPropertyKey, aPropertyMetadata);
				oPropertyMetadataAttributesCache.set(sMetadataAttributeKey, aPropertyMetadataAttributes);
			}
			oValidatedEnity[sPropertyKey] = oPropertyValue;
		});

		return oValidatedEnity;
	}

	/** @function
	 * Used to delete all unnecessary properties of Items based on PLC metadata in order to avoid validation errors
	 * 
	 * @param {integer} iCalculationVersionId - the calculation version id
	 * @param {string} sMode - update items mode
	 * @return {array} aValidatedItems - the validated items
	 */
	async validate(iCalculationVersionId, sMode, aItems) {

		//get metadata info
		let aMetadataResult = await this.StandardPlcService.getMetadata("Item", "Item");
		if (aMetadataResult === undefined) {
			// return no items if metadata was not retrieved
			return [];
		}

		// extend metadata with custon fields info
		let aMetaDataCF = this.extendMetadataCustomFields(aMetadataResult);

		let bModeReplace = sMode === "replace";
		let bModeNotReplace = sMode === "updatemasterdataandprices" || sMode === "noupdatemasterdataandprices";

		// create items tree
		let oItemTree = this.createItemsTree(sMode, aItems);

		// constructing a set containing all parent item ids in the calculation version,
		// in order to later decide if an item is an assembly or leaf item.
		let aDbParentItemIds = await this.getParentItemIds(iCalculationVersionId, this.userId);
		let oDbParentItemIds = new Set(aDbParentItemIds);

		// constructing a set containing all item ids that are referened as parent_item_id in the body items of the request
		let oRequestParentItemIds = new Set();
		aItems.forEach(oItem => {
			if (oItem.PARENT_ITEM_ID !== undefined && oItem.PARENT_ITEM_ID !== null) {
				oRequestParentItemIds.add(oItem.PARENT_ITEM_ID);
			}
		});

		// used for faster validation of item structures
		let oPropertyMetadataCache = new Map();
		let oPropertyMetadataAttributesCache = new Map();

		let aValidatedItems = [];
		for (let i = 0; i < aItems.length; i++) {
			let oItem = aItems[i];

			// depending if an update of a single item shall be updated or a mass update is requested iSubitemState
			// must be determined differently; for mass update look in the request if an item has children; for
			// simple update => look in db
			let iSubitemState;
			if (bModeReplace || bModeNotReplace) {
				let oItemValue = oItemTree.itemTree.get(oItem.ITEM_ID);
				iSubitemState = oItemValue.aChildren.length > 0 ? 1 : 0;
			} else {
				// Check if the current ITEM_ID is in the set of PARENT_ITEM_IDs, both in the request items and in the DB.
				// If yes, it means the item is an assembly, otherwise a leaf item.
				iSubitemState = oDbParentItemIds.has(oItem.ITEM_ID) || oRequestParentItemIds.has(oItem.ITEM_ID) ? 1 : 0;
			}

			let oItemToCheck = {
				entity: oItem,
				categoryId: oItem.ITEM_CATEGORY_ID,
				subitemState: iSubitemState,
				metadata: aMetaDataCF,
				mandatoryPropertyCheckMode: "notNull"
			};

			let oValidatedItem = this.checkItem(oItemToCheck, oPropertyMetadataCache, oPropertyMetadataAttributesCache);
			aValidatedItems.push(oValidatedItem);
		}

		// all parent (assembly) items should not have some fields
		for (let iIndex = 0; iIndex < aValidatedItems.length; iIndex++) {

			let aChildren = aValidatedItems.filter(function (item) {
				return item.PARENT_ITEM_ID === aValidatedItems[iIndex].ITEM_ID;
			});
			let hasChildren = aChildren.length > 0 ? true : false;

			if (hasChildren) {
				delete aValidatedItems[iIndex].PRICE_FIXED_PORTION;
				delete aValidatedItems[iIndex].PRICE_VARIABLE_PORTION;
				delete aValidatedItems[iIndex].TRANSACTION_CURRENCY_ID;
				delete aValidatedItems[iIndex].PRICE_UNIT;
				delete aValidatedItems[iIndex].PRICE_UNIT_UOM_ID;
			} else {
				if (aValidatedItems[iIndex].PRICE_FIXED_PORTION === null) {
					aValidatedItems[iIndex].PRICE_FIXED_PORTION = 0;
				}
				if (aValidatedItems[iIndex].PRICE_VARIABLE_PORTION === null) {
					aValidatedItems[iIndex].PRICE_VARIABLE_PORTION = 0;
				}
			}
		}

		return aValidatedItems;
	}
}
exports.ItemValidator = module.exports.ItemValidator = ItemValidator;
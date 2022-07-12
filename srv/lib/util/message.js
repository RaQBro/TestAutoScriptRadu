/*eslint-env node, es6 */
"use strict";

const _ = require("underscore");

/**
 * @fileOverview
 * 
 * Contains:
 *		- a list of response status codes
 *		- Messages and Errors classes with utility helpers
 * The list of error messages is imported from standard PLC: sap.plc.xs.util.message.xsjslib
 * @see {@ https://github.wdf.sap.corp/plc/hana-xsa/blob/development/xsjs/lib/xs/util/message.js Message}
 * 
 * @name message.js
 */

const helpers = require(global.appRoot + "/lib/util/helpers.js");
const DatabaseClass = require(global.appRoot + "/lib/util/dbPromises.js");

/**
 * Object containing the response status codes that are used in case of an error
 * This object is containg the error messages from standard PLC
 * Is used in order to maintain a consistency with standard PLC backend services
 */
let Code = Object.freeze({
	GENERAL_VALIDATION_ERROR: {
		code: "GENERAL_VALIDATION_ERROR",
		responseCode: 500
	},
	GENERAL_BATCH_VALIDATION_ERROR: {
		code: "GENERAL_BATCH_VALIDATION_ERROR",
		responseCode: 500
	},
	GENERAL_UNEXPECTED_EXCEPTION: {
		code: "GENERAL_UNEXPECTED_EXCEPTION",
		responseCode: 500
	},
	GENERAL_SQL_INJECTION_EXCEPTION: {
		code: "GENERAL_SQL_INJECTION_EXCEPTION",
		responseCode: 500
	},
	/*
	 * 307 Temporary Redirect - used to inform user that must relogin
	 * see https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
	 * Do not define any other code with the same 307 response code
	 */
	GENERAL_SESSION_NOT_FOUND_EXCEPTION: {
		code: "GENERAL_SESSION_NOT_FOUND_EXCEPTION",
		responseCode: 307
	},
	GENERAL_GENERATION_EXCEPTION: {
		code: "GENERAL_GENERATION_EXCEPTION",
		responseCode: 500
	},
	GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR: {
		code: "GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR",
		responseCode: 404
	},
	GENERAL_METHOD_NOT_ALLOWED_ERROR: {
		code: "GENERAL_METHOD_NOT_ALLOWED_ERROR",
		responseCode: 405
	},
	GENERAL_ACCESS_DENIED: {
		code: "GENERAL_ACCESS_DENIED",
		responseCode: 403
	},
	GENERAL_ENTITY_NOT_FOUND_ERROR: {
		code: "GENERAL_ENTITY_NOT_FOUND_ERROR",
		responseCode: 404
	},
	GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR: {
		code: "GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR",
		responseCode: 404
	},
	GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR: {
		code: "GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR",
		responseCode: 404
	},
	GENERAL_ATTRIBUTE_ENTITY_NOT_FOUND_ERROR: {
		code: "GENERAL_ATTRIBUTE_ENTITY_NOT_FOUND_ERROR",
		responseCode: 404
	},
	GENERAL_FORMULA_ENTITY_NOT_FOUND_ERROR: {
		code: "GENERAL_FORMULA_ENTITY_NOT_FOUND_ERROR",
		responseCode: 404
	},
	GENERAL_ENTITY_ALREADY_EXISTS_ERROR: {
		code: "GENERAL_ENTITY_ALREADY_EXISTS_ERROR",
		responseCode: 422
	},
	GENERAL_ENTITY_NOT_CURRENT_ERROR: {
		code: "GENERAL_ENTITY_NOT_CURRENT_ERROR",
		responseCode: 400
	},
	GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR: {
		code: "GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR",
		responseCode: 400
	},
	GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR: {
		code: "GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR",
		responseCode: 403
	},
	GENERAL_SYSTEMMESSAGE_INFO: {
		code: "GENERAL_SYSTEMMESSAGE_INFO",
		responseCode: 200
	},
	GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR: {
		code: "GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR",
		responseCode: 500
	},
	GENERAL_ENTITY_PART_OF_CALCULATION_ERROR: {
		code: "GENERAL_ENTITY_PART_OF_CALCULATION_ERROR",
		responseCode: 400
	},
	// Code has to be used in special when no error handling for this case is expected in client
	GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR: {
		code: "GENERAL_UNIQUE_CONSTRAINT_VIOLATED_ERROR",
		responseCode: 400
	},
	CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR: {
		code: "CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR",
		responseCode: 500
	},
	ADDIN_STATUS_ALREADY_SET_INFO: {
		code: "ADDIN_STATUS_ALREADY_SET_INFO",
		responseCode: 200
	},
	STATUS_NOT_ACTIVE_ERROR: {
		code: "STATUS_NOT_ACTIVE_ERROR",
		responseCode: 500
	},
	CALCULATION_NAME_NOT_UNIQUE_ERROR: {
		code: "CALCULATION_NAME_NOT_UNIQUE_ERROR",
		responseCode: 409
	},
	CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR: {
		code: "CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_NOT_WRITABLE_ERROR: {
		code: "CALCULATIONVERSION_NOT_WRITABLE_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_STILL_OPENED_ERROR: {
		code: "CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
		responseCode: 400
	},
	LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR: {
		code: "LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
		responseCode: 400
	},
	CALCULATION_VERSION_NOT_OPEN_ERROR: {
		code: "CALCULATION_VERSION_NOT_OPEN_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_FROZEN_ERROR: {
		code: "CALCULATIONVERSION_IS_FROZEN_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR: {
		code: "CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_SINGLE_ERROR: {
		code: "CALCULATIONVERSION_IS_SINGLE_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_TEMPORARY_ERROR: {
		code: "CALCULATIONVERSION_IS_TEMPORARY_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR: {
		code: "CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR",
		responseCode: 400
	},
	LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR: {
		code: "LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_IS_SOURCE_VERSION_INFO: {
		code: "CALCULATIONVERSION_IS_SOURCE_VERSION_INFO",
		responseCode: 200
	},
	CALCULATIONVERSION_NOT_SAVED_ERROR: {
		code: "CALCULATIONVERSION_NOT_SAVED_ERROR",
		responseCode: 400
	},
	CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING: {
		code: "CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING",
		responseCode: 200
	},
	CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING: {
		code: "CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING",
		responseCode: 200
	},
	CALCULATIONVERSION_ALREADY_FROZEN_INFO: {
		code: "CALCULATIONVERSION_ALREADY_FROZEN_INFO",
		responseCode: 200
	},
	CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING: {
		code: "CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING",
		responseCode: 200
	},
	DELETE_CURRENT_VERSION_ERROR: {
		code: "DELETE_CURRENT_VERSION_ERROR",
		responseCode: 400
	},
	FIRST_CALCULATIONVERSION_NOT_SAVED: {
		code: "FIRST_CALCULATIONVERSION_NOT_SAVED",
		responseCode: 400
	},
	PRICEDETERMINATION_SEQUENCE_ERROR: {
		code: "PRICEDETERMINATION_SEQUENCE_ERROR",
		responseCode: 400
	},
	DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO: {
		code: "DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO",
		responseCode: 200
	},
	DEPENDENTFIELDSDETERMINATION_PLANTS_SET_FOR_CHANGED_COMPANY_CODES_INFO: {
		code: "DEPENDENTFIELDSDETERMINATION_PLANTS_SET_FOR_CHANGED_COMPANY_CODES_INFO",
		responseCode: 200
	},
	DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO: {
		code: "DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO",
		responseCode: 200
	},
	DEPENDENTFIELDSDETERMINATION_COST_CENTER_SET_FOR_CHANGED_WORK_CENTER_INFO: {
		code: "DEPENDENTFIELDSDETERMINATION_COST_CENTER_SET_FOR_CHANGED_WORK_CENTER_INFO",
		responseCode: 200
	},
	PRICEDETERMINATION_REQUESTED_PRICESOURCE_SET_INFO: {
		code: "PRICEDETERMINATION_REQUESTED_PRICESOURCE_SET_INFO",
		responseCode: 200
	},
	PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO: {
		code: "PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO",
		responseCode: 200
	},
	PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING: {
		code: "PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING",
		responseCode: 200
	},
	PRICEDETERMINATION_NO_PRICE_FOR_PRICESOURCE_FOUND_WARNING: {
		code: "PRICEDETERMINATION_NO_PRICE_FOR_PRICESOURCE_FOUND_WARNING",
		responseCode: 200
	},
	PROJECT_IS_STILL_OPENED_ERROR: {
		code: "PROJECT_IS_STILL_OPENED_ERROR",
		responseCode: 400
	},
	ENTITY_NOT_WRITEABLE_INFO: {
		code: "ENTITY_NOT_WRITEABLE_INFO",
		responseCode: 200
	},
	ENTITY_NOT_WRITABLE_ERROR: {
		code: "ENTITY_NOT_WRITABLE_ERROR",
		responseCode: 400
	},
	PROJECT_NOT_WRITABLE_ERROR: {
		code: "PROJECT_NOT_WRITABLE_ERROR",
		responseCode: 400
	},
	PROJECT_OPEN_BY_OTHERS_INFO: {
		code: "PROJECT_OPEN_BY_OTHERS_INFO",
		responseCode: 200
	},
	PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR: {
		code: "PROJECT_CALCULATE_LIFECYCLEVERSION_CONFLICT_ERROR",
		responseCode: 409
	},
	PROJECT_CALCULATE_LIFECYCLEVERSION_ERROR: {
		code: "PROJECT_CALCULATE_LIFECYCLEVERSION_ERROR",
		responseCode: 500
	},
	PROJECT_CALCULATE_LIFECYCLE_MAN_DISTRIB_ERROR: {
		code: "PROJECT_CALCULATE_LIFECYCLE_MAN_DISTRIB_ERROR",
		responseCode: 400
	},
	PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING: {
		code: "PROJECT_SURCHARGES_ACCOUNT_GROUPS_OVERLAPPING_WARNING",
		responseCode: 200
	},
	DIFFERENT_CONTROLLING_AREA_IN_TARGET_PROJECT: {
		code: "DIFFERENT_CONTROLLING_AREA_IN_TARGET_PROJECT",
		responseCode: 400
	},
	DIFFERENT_CONTROLLING_AREA_IN_TARGET_CALCULATION_VERSION: {
		code: "DIFFERENT_CONTROLLING_AREA_IN_TARGET_CALCULATION_VERSION",
		responseCode: 400
	},
	ACCOUNTDETERMINATION_ACCOUNT_SET_INFO: {
		code: "ACCOUNTDETERMINATION_ACCOUNT_SET_INFO",
		responseCode: 200
	},
	BATCH_OPPERATION_ERROR: {
		code: "BATCH_OPPERATION_ERROR",
		responseCode: 400
	},
	VERSION_PATTERN_NOT_SUPPORTED_ERROR: {
		code: "VERSION_PATTERN_NOT_SUPPORTED_ERROR",
		responseCode: 400
	},
	UPGRADE_PREPARATION_NOT_SUPPORTED_ERROR: {
		code: "UPGRADE_PREPARATION_NOT_SUPPORTED_ERROR",
		responseCode: 500
	},
	LOGON_LANGUAGE_NOT_SUPPORTED_ERROR: {
		code: "LOGON_LANGUAGE_NOT_SUPPORTED_ERROR",
		responseCode: 400
	},
	GENERAL_ENTITY_DUPLICATE_ERROR: {
		code: "GENERAL_ENTITY_DUPLICATE_ERROR",
		responseCode: 400
	},
	SERVICE_UNAVAILABLE_ERROR: {
		code: "SERVICE_UNAVAILABLE_ERROR",
		responseCode: 503
	},
	CALCULATIONENGINE_UOM_NOT_FOUND_WARNING: {
		code: "CALCULATIONENGINE_UOM_NOT_FOUND_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_DIMENSION_NOT_FOUND_WARNING: {
		code: "CALCULATIONENGINE_DIMENSION_NOT_FOUND_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_DIMENSIONS_DO_NOT_MATCH_WARNING: {
		code: "CALCULATIONENGINE_DIMENSIONS_DO_NOT_MATCH_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_DIVISION_BY_ZERO_WARNING: {
		code: "CALCULATIONENGINE_DIVISION_BY_ZERO_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_EXCHANGERATE_NOT_DEFINED_WARNING: {
		code: "CALCULATIONENGINE_EXCHANGERATE_NOT_DEFINED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_REQUIRED_FIELD_NOT_DEFINED_WARNING: {
		code: "CALCULATIONENGINE_REQUIRED_FIELD_NOT_DEFINED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_INVALID_ARGUMENT_ERROR: {
		code: "CALCULATIONENGINE_INVALID_ARGUMENT_ERROR",
		responseCode: 500
	},
	CALCULATIONENGINE_SYNTAX_ERROR_WARNING: {
		code: "CALCULATIONENGINE_SYNTAX_ERROR_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_SEMANTIC_MAPPING_NOT_FOUND_WARNING: {
		code: "CALCULATIONENGINE_SEMANTIC_MAPPING_NOT_FOUND_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_SEMANTIC_MAPPING_UNDEFINED_WARNING: {
		code: "CALCULATIONENGINE_SEMANTIC_MAPPING_UNDEFINED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_OPERAND_DATATYPES_INCOMPATIBLE_WARNING: {
		code: "CALCULATIONENGINE_OPERAND_DATATYPES_INCOMPATIBLE_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_RECIEVING_FIELD_NOT_DEFINED_WARNING: {
		code: "CALCULATIONENGINE_RECIEVING_FIELD_NOT_DEFINED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_RECIEVING_FIELD_DATATYPE_MISMATCH_WARNING: {
		code: "CALCULATIONENGINE_RECIEVING_FIELD_DATATYPE_MISMATCH_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING: {
		code: "CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_CYCLIC_OR_UNRESOLVABLE_REFERENCE_DETECTED_WARNING: {
		code: "CALCULATIONENGINE_CYCLIC_OR_UNRESOLVABLE_REFERENCE_DETECTED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_WARNING: {
		code: "CALCULATIONENGINE_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING: {
		code: "CALCULATIONENGINE_FUNCTION_NOT_FOUND_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_UOM_CONVERSION_NOT_SUPPORTED_WARNING: {
		code: "CALCULATIONENGINE_UOM_CONVERSION_NOT_SUPPORTED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_CURRENCY_CONVERSION_NOT_SUPPORTED_WARNING: {
		code: "CALCULATIONENGINE_CURRENCY_CONVERSION_NOT_SUPPORTED_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_RESULT_OVERFLOW_WARNING: {
		code: "CALCULATIONENGINE_RESULT_OVERFLOW_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_BASE_VERSION_ITEM_NOT_FOUND_WARNING: {
		code: "CALCULATIONENGINE_BASE_VERSION_ITEM_NOT_FOUND_WARNING",
		responseCode: 500
	},
	CALCULATIONENGINE_VARIANT_UNDEFINED_VALUE: {
		code: "CALCULATIONENGINE_VARIANT_UNDEFINED_VALUE",
		responseCode: 500
	},
	CALCULATIONENGINE_FIELD_IS_CALCULATED: {
		code: "CALCULATIONENGINE_FIELD_IS_CALCULATED",
		responseCode: 404
	},
	FORMULA_RESULT_NOT_BOOLEAN: {
		code: "FORMULA_RESULT_NOT_BOOLEAN",
		responseCode: 404
	},
	CALCULATIONENGINE_INVALID_VALUE_LINK_WARNING: {
		code: "CALCULATIONENGINE_INVALID_VALUE_LINK_WARNING",
		responseCode: 500
	},
	PLC_NOT_INITIALIZED_ERROR: {
		code: "PLC_NOT_INITIALIZED_ERROR",
		responseCode: 500
	},
	REFERENCED_CALCULATION_VALIDATION_ERROR: {
		code: "REFERENCED_CALCULATION_VALIDATION_ERROR",
		responseCode: 500
	},
	TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED: {
		code: "TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED",
		responseCode: 500
	},
	TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED: {
		code: "TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED",
		responseCode: 500
	},
	TRANSPORT_FORMULA_CANNOT_BE_MODIFIED: {
		code: "TRANSPORT_FORMULA_CANNOT_BE_MODIFIED",
		responseCode: 500
	},
	TRANSPORT_FORMULA_CANNOT_BE_DELETED: {
		code: "TRANSPORT_FORMULA_CANNOT_BE_DELETED",
		responseCode: 500
	},
	WRITE_LAYOUT_NAMING_CONFLICT: {
		code: "WRITE_LAYOUT_NAMING_CONFLICT",
		responseCode: 409
	},
	GROUPS_NOT_WRITABLE_ERROR: {
		code: "GROUPS_NOT_WRITABLE_ERROR",
		responseCode: 400
	},
	PROJECT_WITH_NO_ADMINISTRATOR_ERROR: {
		code: "PROJECT_WITH_NO_ADMINISTRATOR_ERROR",
		responseCode: 400
	},
	GROUP_CYCLE_ERROR: {
		code: "GROUP_CYCLE_ERROR",
		responseCode: 400
	},
	WRITE_FRONTEND_SETTING_NAMING_CONFLICT: {
		code: "WRITE_FRONTEND_SETTING_NAMING_CONFLICT",
		responseCode: 409
	},
	VARIANT_NAME_NOT_UNIQUE_ERROR: {
		code: "VARIANT_NAME_NOT_UNIQUE_ERROR",
		responseCode: 400
	},
	PERSONAL_DATA_IN_FORMULA: {
		code: "PERSONAL_DATA_IN_FORMULA",
		responseCode: 200
	},
	CUSTOM_FIELDS_TEXT_ERROR: {
		code: "CUSTOM_FIELDS_TEXT_ERROR",
		responseCode: 400
	},
	NUMBER_OF_VARIANTS_ERROR: {
		code: "NUMBER_OF_VARIANTS_ERROR",
		responseCode: 500
	}
});

/**
 * Object containing PLC object types
 */
let PlcObjects = Object.freeze({
	Project: "PROJECT_ID",
	Calculation: "CALCULATION_ID",
	Version: "CALCULATION_VERSION_ID"
});

/** @class
 * @classdesc General success message class. Used from any layer of the application
 * @name Message
 * 
 * @param {string} sMessage - message used for client messages
 * @param {object} oDetails - object that will contain details if necessary
 */
function Message(sMessage, oDetails) {
	this.message = sMessage;
	this.details = oDetails;
}
Message.prototype = Object.create(Message.prototype);
Message.prototype.constructor = Message;

/** @function
 * Used to save the message into HANA database table. Used from any layer of the application
 * The message is saved only if the iJobId is defined
 *
 * @param {integer} iJobId - the job id
 * @param {string} sMessage - the log message
 * @param {string} sType - the type of the message: Error, Warning or Info/Message
 * @param {object} oDetails - object that will contain details if necessary
 * @param {string} sOperation - the operation/category of the message if necessary
 * @param {object} sPlcObjectType - PLC object type
 * @param {string} sPlcObjectId - PLC object id
 */
Message.addLog = async function (iJobId, sMessage, sType, oDetails, sOperation, sPlcObjectType, sPlcObjectId) {

	if (iJobId === undefined || typeof iJobId !== "number") {
		return;
	}

	let sSeverity = "";
	if (sType.toLowerCase() === "error") {
		sSeverity = "Error";
	}
	if (sType.toLowerCase() === "warning") {
		sSeverity = "Warning";
	}
	if (sType.toLowerCase() === "message" || sType.toLowerCase() === "info") {
		sSeverity = "Info";
	}
	// details
	let sTrimmedDetails = null;
	let sDetails = oDetails !== undefined && oDetails !== null ? JSON.stringify(helpers.recursivePropertyFinder(oDetails)) : null;
	if (sDetails !== null) {
		sTrimmedDetails = sDetails.length > 5000 ? sDetails.substring(0, 5000 - 3) + "..." : sDetails;
	}
	// operation
	let sOperationToSave = sOperation !== undefined && sOperation !== null ? sOperation : null;
	// message
	let sTrimmedMessage = sMessage.length > 5000 ? sMessage.substring(0, 5000 - 3) + "..." : sMessage;
	// job id
	let iJobIdToSave = iJobId !== undefined ? iJobId : null;
	// PLC object type
	let sPlcObjectTypeToSave = sPlcObjectType !== undefined && sPlcObjectType !== null ? sPlcObjectType : null;
	// PLC object id
	let sPlcObjectIdToSave = sPlcObjectId !== undefined && sPlcObjectId !== null ? sPlcObjectId.toString() : null;

	let hdbClient = await DatabaseClass.createConnection();
	let connection = new DatabaseClass(hdbClient);

	let statement = await connection.preparePromisified(
		`
			insert into "sap.plc.extensibility::template_application.t_messages"
			( MESSAGE_ID, TIMESTAMP, JOB_ID, SEVERITY, TEXT, DETAILS, OPERATION, PLC_OBJECT_TYPE, PLC_OBJECT_ID ) values ( (SELECT NEWUID() FROM DUMMY), CURRENT_UTCTIMESTAMP, ?, ?, ?, ?, ? );
		`
	);
	await connection.statementExecPromisified(statement, [iJobIdToSave, sSeverity, sTrimmedMessage, sTrimmedDetails, sOperationToSave,
		sPlcObjectTypeToSave, sPlcObjectIdToSave
	]);
	hdbClient.close(); // hdbClient connection must be closed if created from DatabaseClass, not required if created from request.db
};

/** @class
 * @classdesc General error message class. Thrown from any layer of the application
 * @name PlcException
 * 
 * @param {object} oCode - error response status code
 * @param {string} sMessage - message used for client messages
 * @param {object} oDetails - object that will contain error details
 * @param {object} oInnerException - inner exception passed here
 */
function PlcException(oCode, sMessage, oDetails, oInnerException) {

	this.code = oCode;
	this.message = sMessage;
	this.details = oDetails;
	if (_.isNull(oInnerException) || _.isUndefined(oInnerException)) {
		this.stack = (new Error()).stack;
	} else {
		this.stack = oInnerException.stack;
	}
}
PlcException.prototype = Object.create(Error.prototype);
PlcException.prototype.constructor = PlcException;

/** @function
 * Used to create new PlcException object based on the instance of error exception received
 * The error is saved into the messages table
 * Used from any layer of the application
 * 
 * @param {object} oException - the error exception
 * @param {integer} iJobId - the job id needed to save the message
 * @param {string} sOperation - the operation/category of the message if necessary
 * @return {PlcException} oPlcException - the new PlcException error object 
 */
PlcException.createPlcException = async function (oException, iJobId, sOperation) {

	let oPlcException, sLogMessage;

	// create exception
	if (oException instanceof PlcException) {
		sLogMessage = oException.message;
		oPlcException = new PlcException(oException.code, oException.message, oException.details, oException);
	} else {
		sLogMessage = `Unexpected error occurred: ${oException.message || oException.msg || oException}`;
		oPlcException = new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, oException);
	}

	// save message log
	await Message.addLog(iJobId, sLogMessage, "error", oPlcException, sOperation);

	// return exception
	return oPlcException;
};

module.exports.Code = Code;
module.exports.Message = Message;
module.exports.PlcException = PlcException;
module.exports.PlcObjects = PlcObjects;
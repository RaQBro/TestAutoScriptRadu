sap.ui.define([], function () {
	"use strict";

	var Constants = {

		INFOMESSAGES: {
			ERROR: "Error",
			WARNING: "Warning",
			INFORMATION: "Information",
			NONE: "None",
			SUCCESS: "Success"
		},

		SAP_ICONS: {
			ERROR: "sap-icon://message-error",
			WARNING: "sap-icon://message-warning",
			SUCCESS: "sap-icon://message-success",
			INFORMATION: "sap-icon://message-information"
		},

		SAP_BUTTON_TYPE: {
			ERROR: "Negative",
			WARNING: "Critical",
			SUCCESS: "Success",
			INFORMATION: "Neutral"
		},
		timeout: {
			SESSION_TIMEOUT: 60000,
			TEN_SECONDS: 10000
		},
		headers: {
			CONTENT_TYPE_JSON: "application/json; charset=utf-8"
		},

		CONTENT_DENSITY: {
			COMPACT: "sapUiSizeCompact",
			COZY: "sapUiSizeCozy"
		}
	};

	return Constants;
});
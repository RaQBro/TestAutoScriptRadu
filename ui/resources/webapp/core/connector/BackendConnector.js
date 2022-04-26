sap.ui.define([
	"jquery.sap.global",
	"./BaseConnector"
], function ($, BaseConnector) {
	"use strict";

	let BackendConnector = {
		doGet: function (vURL, fnSuccess, fnError, bSync, dataType, oHeaders) {
			return BaseConnector.doAjaxCall("GET", vURL, null, fnSuccess, fnError, oHeaders, true, bSync, dataType);
		},

		doPost: function (vURL, oData, fnSuccess, fnError, bSync, dataType) {
			return BaseConnector.doAjaxCall("POST", vURL, oData, fnSuccess, fnError, null, true, bSync, dataType);
		},

		doPut: function (vURL, oData, fnSuccess, fnError, bSync, dataType) {
			return BaseConnector.doAjaxCall("PUT", vURL, oData, fnSuccess, fnError, null, true, bSync, dataType);
		},

		doDelete: function (vURL, oData, fnSuccess, fnError, bSync, dataType) {
			return BaseConnector.doAjaxCall("DELETE", vURL, oData, fnSuccess, fnError, null, true, bSync, dataType);
		},

		doPatch: function (vURL, oData, fnSuccess, fnError, bSync, dataType) {
			return BaseConnector.doAjaxCall("PATCH", vURL, oData, fnSuccess, fnError, null, true, bSync, dataType);
		}
	};

	return BackendConnector;
});
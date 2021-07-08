/* global _:true */
sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("template_application.ui.controller.DefaultValues", {
		/**
		 * @file ConfigurationController here is logic for the Configuration view
		 */

		/** @function called when the controller is initialized
		 * gets the i18n model, creates message popover, disabling save button from footer
		 */
		onInit: function () {
			this.createMessagePopover();
			this.handleControlEnabledState("saveBtn", false);
		},
		/** @function called after onInit*/
		onAfterRendering: function () {
			this.handleMessagePopover(this.aMessages);
		},

		/** @function Used to saved the updated default values*/
		onSavePress: function () {
			var sMessage,
				oDefaultValues = [],
				that = this;

			// setTimeout(function () {
			// 	$.ajax({
			// 		type: "POST",
			// 		url: "/extensibility/maintainDefaultValues",
			// 		data: JSON.stringify(oDefaultValues),
			// 		contentType: "application/json",
			// 		async: false,

			// 		complete: function (response) {
			// 			sMessage = {
			// 				type: "Success",
			// 				title: that.oResourceBundle.getText("succesSaveDefaultValues"),
			// 				description: ""
			// 			};
			// 			this.aMessages.unshift(sMessage);
			// 			that.handleControlEnabledState("saveBtn", false);
			// 		},
			// 		error: function (errMsg) {
			// 			sMessage = {
			// 				type: "Error",
			// 				title: that.oResourceBundle.getText("errorSaveDefaultValues"),
			// 				description: ""
			// 			};
			// 			this.aMessages.unshift(sMessage);
			// 		}
			// 	});
			// 	that.handleMessagePopover(this.aMessages);
			// 	dialog.close();
			// }, 200);
		}
	});
}, /* bExport= */ true);
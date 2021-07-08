sap.ui.define([
	"./BaseController"
], function (Controller) {
	"use strict";
	return Controller.extend("template_application.ui.controller.View", {
		/**
		 * @file ViewController - ce sa si faca
		 */

		/** @function called when controller is initialized	*/
		onInit: function () {
			//Open loading dialog
			this.openBusyDialog();
			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s
			this._mViewSettingsDialogs = {};
			this.oResourceBundle = this.getResourceBundle();
			this.createMessagePopover();
			this.byId("saveBtn").setEnabled(false);

			this.handleMessagePopover(this.getMessages());
			this.closeBusyDialog();
		},
		/** @function called after onInit*/
		onAfterRendering: function () {

		},
		// unde folosim oare?
		onExit: function () {
			var oDialogKey,
				oDialogValue;
			for (oDialogKey in this._mViewSettingsDialogs) {
				oDialogValue = this._mViewSettingsDialogs[oDialogKey];
				if (oDialogValue) {
					oDialogValue.destroy();
				}
			}
		}
	});

}, /* bExport= */ true);
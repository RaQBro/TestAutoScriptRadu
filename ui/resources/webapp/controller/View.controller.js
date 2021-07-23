sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, ToolBarMessages) {
	"use strict";
	return Controller.extend("webapp.ui.controller.View", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("view").attachPatternMatched(this._onObjectMatched, this);
		},

		onAfterRendering: function () {

			// Get configuration
			this.getConfiguration();
			// Get default values
			this.getDefaultValues();
			// Get technical user
			this.getTechnicalUser();
			// Get all jobs
			this.getAllJobs();
			// Triggered to initialize the PLC session if INIT_SESSION_AT_OPEN_APP is true
			this.plcInitSession();
			// Triggered to activate the event listener for logging out of PLC when LOGOUT_AT_CLOSE_APP is true. The logout will happen on window/browser close.
			this.handleWindowClose();
		},

		_onObjectMatched: function () {
			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {

			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s
			this._mViewSettingsDialogs = {};

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", false);

			this.closeBusyDialog();
		},

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
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

			this.sViewName = this.getView().getParent().getParent().getSideContent().getAggregation("item").getSelectedItem().getProperty(
				"text");

			// Get configuration
			this.getConfiguration(this.sViewName);
			// Get default values
			this.getDefaultValues(this.sViewName);
			// Get technical user
			this.getTechnicalUser(this.sViewName);
			// Get all jobs
			this.getAllJobs(this.sViewName);
			// Triggered to initialize the PLC session if INIT_SESSION_AT_OPEN_APP is true
			this.plcInitSession(this.sViewName);
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
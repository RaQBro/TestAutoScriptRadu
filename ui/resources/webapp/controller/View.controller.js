sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages",
	"webapp/ui/core/utils/MessageHelpers"
], function (Controller, ToolBarMessages, MessageHelpers) {
	"use strict";
	return Controller.extend("webapp.ui.controller.View", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oAuth = this.checkAuthorization("V");
			if (oAuth.display === true) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("view").attachPatternMatched(this._onObjectMatched, this);
			} else {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}

		},

		onAfterRendering: function () {

			// Get configuration
			this.getConfiguration(this.getViewName("item"));
			// Get default values
			this.getDefaultValues(this.getViewName("item"));
			// Get environment variables
			this.getEnvironmentVariables(this.getViewName("item"));
			// Get all jobs
			this.getAllJobs(this.getViewName("item"));
			// Triggered to initialize the PLC session if INIT_SESSION_AT_OPEN_APP is true
			this.plcInitSession(this.getViewName("item"));
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

			this.handleControlEnabledState("editBtn", false);
			this.handleControlVisibleState("editBtn", false);

			this.setSideContentSelectedKey("view");

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
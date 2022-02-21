sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages",
	"webapp/ui/core/utils/MessageHelpers"
], function (Controller, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.View", {

		ToolBarMessages: ToolBarMessages,
		oAuth: {},

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("V");

			if (this.oAuth.display) {
				oRouter.getRoute("view").attachPatternMatched(this.onObjectMatched, this);
			} else {
				this.getView().setVisible(false);
				oRouter.getRoute("view").attachPatternMatched(this.onUnauthorizedMatched, this);
			}
		},

		onAfterRendering: function () {},

		onObjectMatched: function () {

			this.openBusyDialog();
			this.setupView();
			this.initialiseViewLogic();
		},

		onUnauthorizedMatched: function () {

			this.navTo("error");
		},

		setupView: function () {

			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s
			this.mViewSettingsDialogs = {};

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", false);

			this.handleControlEnabledState("editBtn", false);
			this.handleControlVisibleState("editBtn", false);

			this.setSideContentSelectedKey("view");

			this.closeBusyDialog();
		},

		initialiseViewLogic: function () {

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

		onExit: function () {

			let oDialogKey,
				oDialogValue;

			for (oDialogKey in this.mViewSettingsDialogs) {
				oDialogValue = this.mViewSettingsDialogs[oDialogKey];
				if (oDialogValue) {
					oDialogValue.destroy();
				}
			}
		}
	});

}, /* bExport= */ true);
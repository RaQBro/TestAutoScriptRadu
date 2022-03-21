sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.View", {

		oAuth: {},
		sViewName: "view",
		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("V");

			if (this.oAuth.display) {
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onObjectMatched, this);
			} else {
				this.getView().setVisible(false);
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onUnauthorizedMatched, this);
			}

		},

		onAfterRendering: function () {},

		onObjectMatched: function () {

			this.openBusyDialog();
			this.setupView();
			this.initialiseViewLogic();
			this.closeBusyDialog();
		},

		onUnauthorizedMatched: function () {
			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getPageModel(this.sViewName), "pageModel");
			this.oButtonPopover = this.byId("buttonMessagePopover");
			this.setSideContentSelectedKey(this.sViewName);

			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s
			this.mViewSettingsDialogs = {};

		},

		initialiseViewLogic: function () {

			// Get configuration
			this.getConfiguration(this.getViewName("item"));
			// Get default values
			this.getDefaultValues(this.getViewName("item"));
			// Get application settings
			this.getApplicationSettings(this.getViewName("item"));
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
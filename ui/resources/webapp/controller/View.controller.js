sap.ui.define([
	"./BaseController",
	"sap/m/library",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"

], function (Controller, mobileLibrary, BackendConnector, MessageHelpers, ToolBarMessages) {
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
		},
		
		onOnlinePress: function () {
			mobileLibrary.URLHelper.redirect("/extensibility/plc/example-service?IS_ONLINE_MODE=true", true);
		},
		
		onOfflinePress: function () {
			let oView = this.getView();
			let oController = oView.getController();
			let sMessage;

			var onSuccess = function (result) {
				sMessage = {
					type: "Success"
				};
				MessageHelpers.addMessageToPopover.call(this, `Job with ID (${result.details.JOB_ID}) started.`,
					result.message,
					null, sMessage.type, oController.getViewName("item"), true, result.details.JOB_ID, oController.oButtonPopover);
			};
			var onError = function (oXHR, sTextStatus, sErrorThrown) {
				sMessage = {
					type: "Error"
				};
				MessageHelpers.addMessageToPopover.call(this, sMessage.title, oXHR.responseText, sErrorThrown, sMessage.type,
					oController.getViewName("item"), false, null, oController.oButtonPopover);
			};
			BackendConnector.doGet("JOB_START_OFFLINE", onSuccess, onError, true);
		}
	});

}, /* bExport= */ true);
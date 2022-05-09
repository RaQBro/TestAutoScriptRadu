/* global _:true */
sap.ui.define([
	"./BaseController",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, BackendConnector, MessageHelpers, ToolBarMessages) {
	"use strict";

	const technicalNameUser = "TECHNICAL_USER";
	const technicalNameClient = "CLIENT_ID";

	return Controller.extend("webapp.ui.controller.ApplicationSettings", {

		oAuth: {},
		sViewName: "applicationSettings",
		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("AS");

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
			this.pageModel = this.getModel("pageModel");
			this.oButtonPopover = this.byId("buttonMessagePopover");
			this.setSideContentSelectedKey(this.sViewName);

			this.handleMaintainApplicationSettings();
		},

		initialiseViewLogic: function () {

			// Get application settings
			this.getApplicationSettings(this.getViewName("fixedItem"));
		},

		handleMaintainApplicationSettings: function () {

			let aApplicationSettings = sap.ui.getCore().aApplicationSettings;
			let oTechnicalUser = _.find(aApplicationSettings, (item) => {
				return item.FIELD_NAME === "TECHNICAL_USER";
			});
			let oClientId = _.find(aApplicationSettings, (item) => {
				return item.FIELD_NAME === "CLIENT_ID";
			});
			if (oTechnicalUser !== undefined) {
				if (oTechnicalUser.FIELD_VALUE !== null) {
					this.getView().byId("technicalUsername").setValue(oTechnicalUser.FIELD_VALUE);
					this.handleControlEnabledState("logoutBtn", true);
				}
			}
			if (oClientId !== undefined) {
				if (oClientId.FIELD_VALUE !== null) {
					this.getView().byId("clientId").setValue(oClientId.FIELD_VALUE);
				}
			}
		},

		onSavePress: function () {

			this.maintainApplicationSettings();
			this.getApplicationSettings();
		},

		onEditPress: function () {

			if (this.oAuth.maintain === true) {

				this.pageModel.setProperty("/editEnabled", false);
				this.pageModel.setProperty("/editVisible", false);
				this.pageModel.setProperty("/cancelEnabled", true);
				this.pageModel.setProperty("/cancelVisible", true);

				this.handleControlEditableState("clientId", true);
				this.handleControlEditableState("clientSecret", true);
				this.handleControlEditableState("technicalUsername", true);
				this.handleControlEditableState("technicalPassword", true);

			} else {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},
		onCancelPress: function () {

			if (this.oAuth.maintain === true) {

				this.pageModel.setProperty("/editEnabled", true);
				this.pageModel.setProperty("/editVisible", true);
				this.pageModel.setProperty("/cancelEnabled", false);
				this.pageModel.setProperty("/cancelVisible", false);

				this.handleControlEditableState("clientId", false);
				this.handleControlEditableState("clientSecret", false);
				this.handleControlEditableState("technicalUsername", false);
				this.handleControlEditableState("technicalPassword", false);

				this.setupView();
				this.getView().byId("technicalPassword").setValue("");
				this.getView().byId("clientSecret").setValue("");

			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		maintainApplicationSettings: function () {

			let sTechnicalUsername = this.getView().byId("technicalUsername").getValue();
			let sTechnicalPassword = this.getView().byId("technicalPassword").getValue();
			let sClientId = this.getView().byId("clientId").getValue();
			let sClientSecret = this.getView().byId("clientSecret").getValue();

			if (sTechnicalUsername && sTechnicalPassword && sClientId && sClientSecret) {
				this.deleteFromSecureStore(sTechnicalUsername, technicalNameUser);
				this.deleteFromSecureStore(sClientId, technicalNameClient);
				this.insertIntoSecureStore(sTechnicalUsername, sTechnicalPassword, technicalNameUser);
				this.insertIntoSecureStore(sClientId, sClientSecret, technicalNameClient);

				this.pageModel.setProperty("/saveEnabled", false);
				this.pageModel.setProperty("/editEnabled", true);

				this.handleControlEditableState("clientId", false);
				this.handleControlEditableState("clientSecret", false);
				this.handleControlEditableState("technicalUsername", false);
				this.handleControlEditableState("technicalPassword", false);

			} else {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorMandatoryFieldsApplicationSettings"), null, null,
					"Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		deleteFromSecureStore: function (sKey, sFieldName) {

			let onSuccess = function () {};
			let onError = function () {};

			let data = {
				"FIELD_NAME": sFieldName,
				"VALUE": null
			};

			let url = {
				constant: "DELETE_SEC_STORE",
				parameters: {
					KEY: sKey
				}
			};

			BackendConnector.doPost(url, data, onSuccess, onError, true);
		},

		insertIntoSecureStore: function (sKey, sValue, sFieldName) {

			let oController = this,
				data = {
					"FIELD_NAME": sFieldName,
					"VALUE": sValue
				};

			let onSuccess = function () {
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("succesMaintainApplicationSettings", [sKey]),
					null, null,
					"Success", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};

			let onError = function () {
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorMaintainApplicationSettings", [sKey]), null,
					null,
					"Error", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};

			let url = {
				constant: "SET_SEC_STORE",
				parameters: {
					KEY: sKey
				}
			};

			BackendConnector.doPost(url, data, onSuccess, onError, true);
		},

		onChangeUsername: function () {

			this.pageModel.setProperty("/saveEnabled", false);
		},

		onChangePassword: function () {

			this.pageModel.setProperty("/saveEnabled", false);
		},

		onChangeClientId: function () {

			this.pageModel.setProperty("/saveEnabled", false);
		},

		onChangeClientSecret: function () {

			this.pageModel.setProperty("/saveEnabled", false);
		},

		logoutPress: function () {
			
			let oView = this.getView();
			let oController = oView.getController();
			let sMessage;

			let onSuccess = function (result) {
				sMessage = {
					type: "Success"
				};

				MessageHelpers.addMessageToPopover.call(this, `Job with ID (${result.details.JOB_ID}) started to logout technical user.`,
					result.message,
					null, sMessage.type, oController.getViewName("fixedItem"), true, result.details.JOB_ID, oController.oButtonPopover);
			};
			
			let onError = function (oXHR, sTextStatus, sErrorThrown) {
				sMessage = {
					type: "Error"
				};
				MessageHelpers.addMessageToPopover.call(this, sMessage.title, oXHR.responseText, sErrorThrown, sMessage.type,
					oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};
			BackendConnector.doGet("LOGOUT_SERVICE", onSuccess, onError, true);
		}
	});

}, /* bExport= */ true);
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

		onObjectMatched: function () {
			this.openBusyDialog();
			this.setupView();
			this.closeBusyDialog();
		},

		onUnauthorizedMatched: function () {
			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getPageModel(this.sViewName), "pageModel");
			this.oButtonPopover = this.byId("buttonMessagePopover");
			this.setSideContentSelectedKey(this.sViewName);

			this.handleMaintainApplicationSettings();

		},

		onAfterRendering: function () {},

		handleMaintainApplicationSettings: function () {

			let aApplicationSettings = sap.ui.getCore().aApplicationSettings;
			let sTechnicalUser = _.find(aApplicationSettings, (item) => {
				return item.FIELD_NAME === "TECHNICAL_USER";
			});
			let sClientId = _.find(aApplicationSettings, (item) => {
				return item.FIELD_NAME === "CLIENT_ID";
			});
			if (sTechnicalUser) {
				if (sTechnicalUser.FIELD_VALUE !== null) {
					this.getView().byId("technicalUsername").setValue(sTechnicalUser.FIELD_VALUE);
					this.handleControlEnabledState("logoutBtn", true);
				}
			}
			if (sClientId) {
				if (sClientId.FIELD_VALUE !== null) {
					this.getView().byId("clientId").setValue(sClientId.FIELD_VALUE);
				}
			}
		},

		onSavePress: function () {

			this.maintainApplicationSettings();
			this.getApplicationSettings();

		},

		onEditPress: function () {
			if (this.oAuth.maintain === true) {
				this.handleControlEnabledState("editBtn", false);
				this.handleControlEditableState("clientId", true);
				this.handleControlEditableState("clientSecret", true);
				this.handleControlEditableState("technicalUsername", true);
				this.handleControlEditableState("technicalPassword", true);

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

				this.handleControlEnabledState("saveBtn", false);
				this.handleControlEnabledState("editBtn", true);
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

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangePassword: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeClientId: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeClientSecret: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		logoutPress: function () {
			let oView = this.getView();
			let oController = oView.getController();
			let sMessage;

			var onSuccess = function (result) {
				sMessage = {
					type: "Success"
				};

				MessageHelpers.addMessageToPopover.call(this, `Job with ID (${result.details.JOB_ID}) started to logout technical user.`,
					result.message,
					null, sMessage.type, oController.getViewName("fixedItem"), true, result.details.JOB_ID, oController.oButtonPopover);
			};
			var onError = function (oXHR, sTextStatus, sErrorThrown) {
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
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

	return Controller.extend("webapp.ui.controller.EnvironmentVariables", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("environmentVariables").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {

			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", true);

			this.setSideContentSelectedKey("environmentVariables");

			this.handleMaintainEnvironmentVariables();

			this.closeBusyDialog();
		},

		onAfterRendering: function () {},

		handleMaintainEnvironmentVariables: function () {

			let aEnvironmentVariable = sap.ui.getCore().aEnvironmentVariable;
			let sTechnicalUser = _.find(aEnvironmentVariable, (item) => {
				return item.FIELD_NAME === "TECHNICAL_USER";
			});
			let sClientId = _.find(aEnvironmentVariable, (item) => {
				return item.FIELD_NAME === "CLIENT_ID";
			});
			if (sTechnicalUser) {
				if (sTechnicalUser.FIELD_VALUE !== null) {
					this.getView().byId("technicalUsername").setValue(sTechnicalUser.FIELD_VALUE);
				}
			}
			if (sClientId) {
				if (sClientId.FIELD_VALUE !== null) {
					this.getView().byId("clientId").setValue(sClientId.FIELD_VALUE);
				}
			}
		},

		onSavePress: function () {

			this.maintainEnvironmentVariables();
			this.getEnvironmentVariables();
		},

		maintainEnvironmentVariables: function () {

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
			} else {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorMandatoryFieldsEnvironmentVariables"), null, null,
					"Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		deleteFromSecureStore: function (sKey, sDescription) {

			let onSuccess = function () {};
			let onError = function () {};

			let data = {
				"TECHNICAL_NAME": sDescription,
				"VALUE": null
			};

			let url = {
				constant: "DELETE_SEC_STORE",
				parameters: {
					KEY: sKey
				}
			};

			BackendConnector.doPost(url, data, onSuccess, onError, false);
		},

		insertIntoSecureStore: function (sKey, sValue, sDescription) {

			let oController = this,
				data = {
					"TECHNICAL_NAME": sDescription,
					"VALUE": sValue
				};

			let onSuccess = function () {
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("succesMaintainEnvironmentVariables"), null, null,
					"Success", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};

			let onError = function () {
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorMaintainEnvironmentVariables"), null, null,
					"Error", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};

			let url = {
				constant: "SET_SEC_STORE",
				parameters: {
					KEY: sKey
				}
			};

			BackendConnector.doPost(url, data, onSuccess, onError, false);
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
		}
	});

}, /* bExport= */ true);
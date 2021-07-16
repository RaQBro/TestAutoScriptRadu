/* global _:true */
sap.ui.define([
	"./BaseController",
	"webapp/ui/core/connector/BackendConnector"
], function (Controller, BackendConnector) {
	"use strict";
	return Controller.extend("webapp.ui.controller.TechnicalUser", {
		/**
		 * @file TechnicalUser - ce sa si faca
		 */

		/** @function called when the controller is initialized
		 * gets the i18n model, creates message popover, disabling save button from footer
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("technicalUser").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {
			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {
			this.createMessagePopover();
			this.handleMessagePopover(this.aMessages);

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", true);

			this.handleMaintainTechnicalUser();
			this.closeBusyDialog();
		},

		/** @function called after onInit*/
		onAfterRendering: function () {

		},

		handleMaintainTechnicalUser: function () {
			var aTechnicalUser = sap.ui.getCore().aTechnicalUser;
			var sTechnicalUser = _.find(aTechnicalUser, (item) => {
				return item.FIELD_NAME === "TECHNICAL_USER";
			});
			if (sTechnicalUser) {
				if (sTechnicalUser.FIELD_VALUE !== null) {
					this.getView().byId("technicalUsername").setValue(sTechnicalUser.FIELD_VALUE);
				}
			}
		},

		onSavePress: function () {
			this.maintainTechnicalUser();
		},

		maintainTechnicalUser: function () {
			var sTechnicalUsername = this.getView().byId("technicalUsername").getValue();
			var sTechnicalPassword = this.getView().byId("technicalPassword").getValue();
			if (sTechnicalUsername && sTechnicalPassword) {
				this.deleteFromSecureStore(sTechnicalUsername);
				this.insertIntoSecureStore(sTechnicalUsername, sTechnicalPassword);
				sap.ui.getCore().aTechnicalUser[0].FIELD_VALUE = sTechnicalUsername;
			} else {
				var sMessage = {
					type: "Error",
					title: "Please fill both username and password",
					description: "",
					groupName: this.getResourceBundleText("TechnicalUser")
				};
				this.aMessages.unshift(sMessage);
				this.handleMessagePopover(this.aMessages);
			}
		},

		deleteFromSecureStore: function (sKey) {
			var onSuccess = function () {};
			var onError = function () {};

			BackendConnector.doGet({
				constant: "DELETE_SEC_STORE",
				parameters: {
					KEY: sKey
				}
			}, onSuccess, onError, true);
		},

		insertIntoSecureStore: function (sKey, sValue) {
			var oController = this,
				data = {
					"VALUE": sValue
				};
			var onSuccess = function (oData) {
				var sMessage = {
					type: "Success",
					title: oData.message,
					description: "",
					groupName: oController.getResourceBundleText("TechnicalUser")
				};
				oController.aMessages.unshift(sMessage);
				oController.handleMessagePopover(oController.aMessages);
			};
			var onError = function (oXHR, sTextStatus) {
				var sMessage = {
					type: "Error",
					title: sTextStatus,
					description: "",
					groupName: oController.getResourceBundleText("TechnicalUser")
				};
				oController.aMessages.unshift(sMessage);
				oController.handleMessagePopover(oController.aMessages);
			};
			var url = {
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
		}
	});

}, /* bExport= */ true);
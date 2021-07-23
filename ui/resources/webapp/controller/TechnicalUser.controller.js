/* global _:true */
sap.ui.define([
	"./BaseController",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, BackendConnector, MessageHelpers, ToolBarMessages) {
	"use strict";
	return Controller.extend("webapp.ui.controller.TechnicalUser", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			this.redirectToLaunchpadOnRefresh();

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("technicalUser").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {

			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", true);

			this.handleMaintainTechnicalUser();
			this.closeBusyDialog();
		},

		onAfterRendering: function () {

			this.sViewName = this.getView().getParent().getParent().getSideContent().getAggregation("fixedItem").getSelectedItem().getProperty(
				"text");
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
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorMandatoryFieldsTechnicalUser"), null, "Error", this.sViewName, this.oButtonPopover);
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

			var onSuccess = function () {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("succesMaintainTechnicalUser"), null, "Success", this.sViewName, oController.oButtonPopover);
			};

			var onError = function () {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorMaintainTechnicalUser"), null, "Error", this.sViewName, oController.oButtonPopover);
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
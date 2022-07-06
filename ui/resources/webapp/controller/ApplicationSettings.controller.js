/* global _:true */
sap.ui.define([
	"./BaseController",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages",
	"sap/ui/core/Fragment",
	"webapp/ui/core/utils/Formatters"
], function (Controller, BackendConnector, MessageHelpers, ToolBarMessages, Fragment, Formatters) {
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
		},

		initialiseViewLogic: function () {

			// Get application settings
			this.getApplicationSettings(this.getViewName("fixedItem"));

			this.handleMaintainApplicationSettings();
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
					this.pageModel.setProperty("/logoutEnabled", true);
				}
			}
			if (oClientId !== undefined) {
				if (oClientId.FIELD_VALUE !== null) {
					this.getView().byId("clientId").setValue(oClientId.FIELD_VALUE);
				}
			}
		},

		onSavePress: function () {

			let that = this;
			this.openBusyDialog();
			setTimeout(function () {

				that.maintainApplicationSettings();
				that.getApplicationSettings();

			}, 200);
			this.closeBusyDialog();
		},

		onEditPress: function () {

			if (this.oAuth.maintain === true) {

				this.pageModel.setProperty("/saveEnabled", false);
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

				this.pageModel.setProperty("/saveEnabled", false);
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

			let sTechnicalUser = this.getView().byId("technicalUsername").getValue();
			let sTechnicalPassword = this.getView().byId("technicalPassword").getValue();
			let sPlcClientId = this.getView().byId("clientId").getValue();
			let sPlcClientSecret = this.getView().byId("clientSecret").getValue();

			if (sTechnicalUser && sTechnicalPassword && sPlcClientId && sPlcClientSecret) {

				// check if PLC token can be generated based on the input
				if (this.generateTechnicalUserPlcToken(sTechnicalUser, sTechnicalPassword, sPlcClientId, sPlcClientSecret)) {

					this.deleteFromSecureStore(sTechnicalUser, technicalNameUser);
					this.deleteFromSecureStore(sPlcClientId, technicalNameClient);
					this.insertIntoSecureStore(sTechnicalUser, sTechnicalPassword, technicalNameUser);
					this.insertIntoSecureStore(sPlcClientId, sPlcClientSecret, technicalNameClient);

					this.pageModel.setProperty("/saveEnabled", false);
					this.pageModel.setProperty("/editEnabled", true);
					this.pageModel.setProperty("/editVisible", true);
					this.pageModel.setProperty("/cancelEnabled", false);
					this.pageModel.setProperty("/cancelVisible", false);
					this.pageModel.setProperty("/logoutEnabled", true);

					this.handleControlEditableState("clientId", false);
					this.handleControlEditableState("clientSecret", false);
					this.handleControlEditableState("technicalUsername", false);
					this.handleControlEditableState("technicalPassword", false);
				}
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

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangePassword: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangeClientId: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangeClientSecret: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onLogoutPress: function () {

			if (this.oAuth.maintain === true) {

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
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		onArchivePress: function () {

			if (this.oAuth.maintain === true) {

				let oView = this.getView();

				if (!this._oArchiveDialog) {

					this._oArchiveDialog = Fragment.load({
						name: "webapp.ui.view.fragment.ArchiveDialog",
						controller: this
					}).then(function (oArchiveDialog) {
						oView.addDependent(oArchiveDialog);
						oArchiveDialog.getContent().filter(_ => _.sId === "DP1")[0].setDateValue(new Date());
						return oArchiveDialog;
					}.bind());
				}

				this._oArchiveDialog.then(function (oArchiveDialog) {
					oArchiveDialog.open();
				}.bind());
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		onArchiveDialogOk: function () {

			this._oArchiveDialog.then((oArchiveDialog) => {

				let oView = this.getView();
				let oController = oView.getController();
				let sMessage;
				let date = sap.ui.getCore().byId("DP1").getDateValue();

				let onSuccess = function (result) {
					sMessage = {
						type: "Success"
					};

					MessageHelpers.addMessageToPopover.call(this, `Job with ID (${result.details.JOB_ID}) started to archive job's messages.`,
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

				BackendConnector.doGet({
					constant: "ARCHIVE_JOB_LOGS_MESSAGES",
					parameters: {
						DATE: Formatters.getDateByPattern("YYYY-MM-DD", date)
					}
				}, onSuccess, onError, true);

				oArchiveDialog.close();
			});
		},

		onArchiveDialogCancel: function () {

			this._oArchiveDialog.then((oArchiveDialog) => {
				oArchiveDialog.close();
			});
		}
	});
}, /* bExport= */ true);
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

			sap.ui.getCore().oAuthError = true;

			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getToolBarMessagesModel(this.sViewName), "toolBarMessagesModel");
			this.toolBarMessagesModel = this.getModel("toolBarMessagesModel");
			this.getView().setModel(this.getVisibilitySettingsModel(this.sViewName), "visibilitySettingsModel");
			this.visibilitySettingsModel = this.getModel("visibilitySettingsModel");
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
			if (oTechnicalUser !== undefined) {
				if (oTechnicalUser.FIELD_VALUE !== null) {
					this.getView().byId("technicalUsername").setValue(oTechnicalUser.FIELD_VALUE);
					this.toolBarMessagesModel.setProperty("/logoutEnabled", true);
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

				this.toolBarMessagesModel.setProperty("/saveEnabled", false);
				this.toolBarMessagesModel.setProperty("/editEnabled", false);
				this.toolBarMessagesModel.setProperty("/editVisible", false);
				this.toolBarMessagesModel.setProperty("/cancelEnabled", true);
				this.toolBarMessagesModel.setProperty("/cancelVisible", true);

				this.handleControlEditableState("technicalUsername", true);
				this.handleControlEditableState("technicalPassword", true);
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		onCancelPress: function () {

			if (this.oAuth.maintain === true) {

				this.toolBarMessagesModel.setProperty("/saveEnabled", false);
				this.toolBarMessagesModel.setProperty("/editEnabled", true);
				this.toolBarMessagesModel.setProperty("/editVisible", true);
				this.toolBarMessagesModel.setProperty("/cancelEnabled", false);
				this.toolBarMessagesModel.setProperty("/cancelVisible", false);

				this.handleControlEditableState("technicalUsername", false);
				this.handleControlEditableState("technicalPassword", false);

				this.setupView();
				this.getView().byId("technicalPassword").setValue("");
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		maintainApplicationSettings: function () {

			let sTechnicalUser = this.getView().byId("technicalUsername").getValue();
			let sTechnicalPassword = this.getView().byId("technicalPassword").getValue();

			if (sTechnicalUser && sTechnicalPassword) {

				// check if PLC token can be generated based on the input
				if (this.generateTechnicalUserPlcToken(sTechnicalUser, sTechnicalPassword)) {

					this.deleteFromSecureStore(sTechnicalUser, technicalNameUser);
					this.insertIntoSecureStore(sTechnicalUser, sTechnicalPassword, technicalNameUser);

					this.toolBarMessagesModel.setProperty("/saveEnabled", false);
					this.toolBarMessagesModel.setProperty("/editEnabled", true);
					this.toolBarMessagesModel.setProperty("/editVisible", true);
					this.toolBarMessagesModel.setProperty("/cancelEnabled", false);
					this.toolBarMessagesModel.setProperty("/cancelVisible", false);
					this.toolBarMessagesModel.setProperty("/logoutEnabled", true);

					this.handleControlEditableState("technicalUsername", false);
					this.handleControlEditableState("technicalPassword", false);
				}
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorMandatoryFieldsApplicationSettings"), null, null,
					"Error", this.getViewName("fixedItem"), false, null, this.oButtonPopover);
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
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("successMaintainApplicationSettings", [sKey]),
					null, null, "Success", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};

			let onError = function () {
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorMaintainApplicationSettings", [sKey]), null,
					null, "Error", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
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

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onChangePassword: function () {

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onLogoutPress: function () {

			if (this.oAuth.maintain === true) {

				let oView = this.getView();
				let oController = oView.getController();

				let onSuccess = function (result) {

					MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("successLogoutTechnicalUser", [result.details.JOB_ID]),
						result.message, null, "Success", oController.getViewName("fixedItem"), true, result.details.JOB_ID, oController.oButtonPopover
					);
				};

				let onError = function (oXHR, sTextStatus, sErrorThrown) {

					MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorLogoutTechnicalUser"), oXHR.responseText,
						sErrorThrown, "Error", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
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
						oArchiveDialog.getContent()[0]._aElements.filter(_ => _.sId === "archiveDatePicker")[0].setDateValue(new Date());
						return oArchiveDialog;
					}.bind());
				}

				this._oArchiveDialog.then(function (oArchiveDialog) {
					jQuery.sap.syncStyleClass(oView.getController().getContentDensityClass(), oView, oArchiveDialog);

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
				let dDate = sap.ui.getCore().byId("archiveDatePicker").getDateValue();

				let onSuccess = function (result) {

					MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("successArchiveMessages", [result.details.JOB_ID]),
						result.message, null, "Success", oController.getViewName("fixedItem"), true, result.details.JOB_ID, oController.oButtonPopover
					);
				};

				let onError = function (oXHR, sTextStatus, sErrorThrown) {

					MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorArchiveMessages"), oXHR.responseText,
						sErrorThrown, "Error", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
				};

				BackendConnector.doGet({
					constant: "ARCHIVE_JOB_LOGS_MESSAGES",
					parameters: {
						DATE: Formatters.getDateByPattern("YYYY-MM-DD", dDate)
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

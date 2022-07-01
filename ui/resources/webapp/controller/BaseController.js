/* global _:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/toolBarMessages/ToolBarMessages",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/core/utils/Constants",
	"sap/ui/core/library",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/Text"

], function (Controller, UIComponent, Fragment, BackendConnector, ToolBarMessages, MessageHelpers, Constants, CoreLibrary, Dialog, Button,
	MobileLibrary, Text) {
	"use strict";

	return Controller.extend("webapp.ui.controller.BaseController", {
		/**
		 * @file BaseController is used to define basic functions or functions that will be reused in all other controllers
		 */

		/**
		 * @description The functions below are requiered for the basic functionality of the app
		 * Please write new functions above this comment
		 */

		onInit: function () {

			ToolBarMessages.initialiseMessagePopover.call(this);
		},

		getResourceBundleText: function (text, aValues) {

			if (this.bundle === undefined || this.bundle === null) {
				this.bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			}

			return this.bundle.getText(text, aValues);
		},

		/** @function Used to get Router*/
		getRouter: function () {

			return UIComponent.getRouterFor(this);
		},

		/** 
		 * function used to clear global messages on each hash change/navigation 
		 * @param {string} sTarget The target name defined in the manifest
		 * @param {Object} oParams containing key - value pairs for parameters
		 */
		navTo: function (sTarget, oParams) {

			this.getRouter().navTo(sTarget, oParams);
		},

		/** @function Used to get model*/
		getModel: function (sName) {

			return this.getView().getModel(sName);
		},

		/** @function Used to set model*/
		setModel: function (oModel, sName) {

			return this.getView().setModel(oModel, sName);
		},

		/** @function Used to get translation model*/
		getResourceBundle: function () {

			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/** @function Used to get toolBarMessages model*/
		getToolBarMessagesModel: function () {

			return this.getOwnerComponent().getModel("toolBarMessagesModel");
		},

		/** @function used to open BusyDialog
		 */
		openBusyDialog: function () {

			let oView = this.getView();

			if (!this._busyDialog) {
				this._busyDialog = Fragment.load({
					name: "webapp.ui.view.fragment.BusyDialog",
					controller: this
				}).then(function (oBusyDialog) {
					oView.addDependent(oBusyDialog);
					return oBusyDialog;
				}.bind());
			}

			this._busyDialog.then(function (oBusyDialog) {
				oBusyDialog.open();
			}.bind());
		},

		closeBusyDialog: function () {

			setTimeout(function () {
				this._busyDialog.then((oBusyDialog) => {
					oBusyDialog.close();
				});
			}.bind(this), 1000);
		},

		/** @function used to handle the enable state of a control
		 * @param {string} controlId - used to select the control id
		 * @param {boolean} state - used to set the state of the control true/false
		 */
		handleControlEnabledState: function (controlId, state) {

			this.byId(controlId).setEnabled(state);
		},

		/** @function used to handle the editable state of a control
		 * @param {string} controlId - used to select the control id
		 * @param {boolean} state - used to set the state of the control true/false
		 */
		handleControlEditableState: function (controlId, state) {

			this.byId(controlId).setEditable(state);
		},

		/** @function used to handle the visible state of a control
		 * @param {string} controlId - used to select the control id
		 * @param {boolean} state - used to set the state of the control true/false
		 */
		handleControlVisibleState: function (controlId, state) {

			this.byId(controlId).setVisible(state);
		},

		/** @function used to get the user details to show them on the ui
		 */
		getUserDetails: function () {

			let oController = this,
				oUserDetails = {};

			let onSuccess = function (response) {
				oUserDetails.Error = false;
				oUserDetails.BODY = response;
				oController.aUserDetails = response;
			};
			let onError = function (error) {
				oUserDetails.Error = true;
				oUserDetails.Message =
					`User details could not bet loaded. If the error persists, please contact your administrator.  Error: ${error.status} - ${error.statusText}`;
				oUserDetails.Description = `${JSON.stringify(error)}`;
			};
			BackendConnector.doGet("GET_USER_DETAILS", onSuccess, onError, true);

			return oUserDetails;
		},

		/** @function used to initialize the PLC session
		 */
		plcInitSession: function (sViewName) {

			let oController = this;

			let sInitSesstionAtOpenApp = _.find(sap.ui.getCore().aConfiguration, (item) => {
				return item.FIELD_NAME === "INIT_SESSION_AT_OPEN_APP";
			});

			if (sInitSesstionAtOpenApp) {
				if (sInitSesstionAtOpenApp.FIELD_VALUE === "true") {

					let onSuccess = function () {};
					let onError = function () {
						let oButtonPopover = oController.byId("buttonMessagePopover");
						MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorInitPLCSession"), null, null, "Error",
							sViewName, false, null, oButtonPopover);
					};

					BackendConnector.doGet("INIT_PLC_SESSION", onSuccess, onError, true);
				}
			}
		},

		/** @function used to get configuration which are used in the configuration logic
		 */
		getConfiguration: function (sViewName) {

			let oController = this;
			let onSuccess = function (oData) {
				sap.ui.getCore().aConfiguration = oData.d.results;
			};
			let onError = function () {
				let oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetConfiguration"), null, null, "Error",
					sViewName, false, null, oButtonPopover);
			};

			BackendConnector.doGet("GET_CONFIGURATION", onSuccess, onError.bind(this), true);
		},

		/** @function used to get default values which are used in the configuration logic
		 */
		getDefaultValues: function (sViewName) {

			let oController = this;
			let onSuccess = function (oData) {
				sap.ui.getCore().aDefaultValues = oData.d.results;
			};
			let onError = function () {
				let oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetDefaultValues"), null, null, "Error",
					sViewName, false, null, oButtonPopover);
			};

			BackendConnector.doGet("GET_DEFAULT_VALUES", onSuccess, onError, true);
		},

		/** @function used to get the technical user and client id
		 */
		getApplicationSettings: function (sViewName) {
			let oController = this;
			let onSuccess = function (oData) {
				sap.ui.getCore().aApplicationSettings = oData.d.results;
			};
			let onError = function () {
				let oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetApplicationSettings"), null, null,
					"Error",
					sViewName, false, null, oButtonPopover);
			};
			BackendConnector.doGet("GET_APPLICATION_SETTINGS", onSuccess, onError, true);
		},

		/** @function used to get details of all existing jobs
		 */
		getAllJobs: function (sViewName) {

			let oController = this;
			let onSuccess = function (oData) {
				sap.ui.getCore().aAllJobs = oData.details.results;
			};
			let onError = function () {
				let oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetAllJobs"), null, null, "Error",
					sViewName, false, null, oButtonPopover);
			};

			BackendConnector.doGet("GET_ALL_JOBS", onSuccess, onError, true);
		},

		/** @function used to logout from PLC
		 */
		plcLogout: function () {

			BackendConnector.doGet("LOGOUT_PLC", null, null, true);
		},

		/** @function used to add an eventlistener so when the window is closed, it triggers logout from PLC
		 */
		handleWindowClose: function () {

			let oController = this;
			let sLogoutAtCloseApp = _.find(sap.ui.getCore().aConfiguration, (item) => {
				return item.FIELD_NAME === "LOGOUT_AT_CLOSE_APP";
			});
			if (sLogoutAtCloseApp) {
				if (sLogoutAtCloseApp.FIELD_VALUE === "true") {
					window.addEventListener("beforeunload", function () {
						oController.plcLogout();
					});
				}
			}
		},

		setSideContentSelectedKey: function (sViewId) {

			let sideContent = this.getView().getParent().getParent().getSideContent();
			let selectedKey = sideContent.getSelectedKey();
			if (selectedKey !== sViewId) {
				sideContent.setSelectedKey(sViewId);
			}
		},

		getViewName: function (sAggregationName) {

			return this.getView().getParent().getParent().getSideContent().getAggregation(sAggregationName).getSelectedItem().getProperty(
				"text");
		},

		getContentDensityClass: function () {

			if (!this._sContentDensityClass) {
				this._sContentDensityClass = Constants.CONTENT_DENSITY.COMPACT;
			}
			return this._sContentDensityClass;
		},

		onMessageTitlePress: function (oEvent) {

			this.navTo("messages", {
				jobID: oEvent.getParameters().item.getBindingContext("message").getObject().technicalDetails.JOB_ID
			});
		},

		/** @function used to check user authorization
		 * @param {string} sScopeId - id used in xs-security.json for a custom scope (part of string before '_Maintain' or '_Display')
		 * example for Default Values View we have $XSAPPNAME.DV_Display". Scope ID here will be "DV"
		 **/
		checkAuthorization: function (sScopeId) {

			let oController = this;
			let oAuth = {};

			let onSuccess = function (oData) {
				oAuth = {
					display: oData.display,
					maintain: oData.maintain
				};
			};

			let onError = function (error) {
				let oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetAuth"),
					error.status + "-" + error.statusText, null, "Error",
					oController.oView.sViewName.substring(oController.oView.sViewName.lastIndexOf(".") + 1), //View Name
					false, null, oButtonPopover);
			};

			BackendConnector.doGet({
				constant: "GET_AUTH",
				parameters: {
					ID: sScopeId
				}
			}, onSuccess, onError, true);

			return oAuth;

		},

		getPageModel: function (view) {

			let fullModel = this.getToolBarMessagesModel();
			let data = fullModel.oData[view] || fullModel.oData.default || {};

			return new sap.ui.model.json.JSONModel(data);
		},

		checkPlcToken: function () {

			let bWithSuccess;

			let onSuccess = function () {

				bWithSuccess = true;
			};
			let onError = function () {

				bWithSuccess = false;
			};
			let url = {

				constant: "CHECK_PLC_TOKEN"
			};

			BackendConnector.doGet(url, onSuccess, onError, true);

			return bWithSuccess;
		},

		onErrorPlcToken: function () {

			if (!this.oErrorPlcToken) {
				this.oErrorPlcToken = new Dialog({
					type: MobileLibrary.DialogType.Message,
					title: "Error",
					state: CoreLibrary.ValueState.Error,
					closeOnNavigation: false,
					content: new Text({
						text: this.getResourceBundleText("errorCheckToken")
					}),
					beginButton: new Button({
						type: MobileLibrary.ButtonType.Emphasized,
						text: "OK",
						press: function () {
							this.navTo("messages");
							this.navTo("applicationSettings");
							this.oErrorPlcToken.close();
						}.bind(this)
					})
				});
			}

			this.oErrorPlcToken.open();
		}
	});
});
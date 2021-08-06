/* global _:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/MessagePopover",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/core/routing/History",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/toolBarMessages/ToolBarMessages",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/core/utils/Constants"
], function (Controller, UIComponent, MessagePopover, JSONModel, Fragment, History, BackendConnector, ToolBarMessages,
	MessageHelpers, Constants) {
	"use strict";

	return Controller.extend("webapp.ui.controller.BaseController", {
		/**
		 * @file BaseController is used to define basic functions or functions that will be reused in all other controllers
		 */

		/**
		 * @description The functions below are requiered for the basic functionality of the app
		 * Please write new functions above this comment
		 */

		/**
		 * @type {array}
		 * used globally for show meesages of the application
		 */
		mViewsData: {},

		onInit: function () {
			ToolBarMessages.initialiseMessagePopover.call(this);
		},

		getResourceBundleText: function (text) {
			if (this.bundle === undefined || this.bundle === null) {
				this.bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			}

			return this.bundle.getText(text);
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

		/** @function used to open BusyDialog
		 */
		openBusyDialog: function () {
			var oView = this.getView();

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

		/** @function used to handle the state of a control
		 * @param {string} controlId - used to select the control id
		 * @param {boolean} state - used to set the state of the control true/false
		 */
		handleControlEnabledState: function (controlId, state) {
			this.byId(controlId).setEnabled(state);
		},

		/** @function used to handle the visibility of a control
		 * @param {string} controlId - used to select the control id
		 * @param {boolean} state - used to set the state of the control true/false
		 */
		handleControlVisibleState: function (controlId, state) {
			this.byId(controlId).setVisible(state);
		},

		/** @function used to get the user details to show them on the ui
		 */
		getUserDetails: function () {
			var that = this,
				oUserDetails = {};

			var onSuccess = function (response) {
				oUserDetails.Error = false;
				oUserDetails.BODY = response;
				that.aUserDetails = response;
			};
			var onError = function (error) {
				oUserDetails.Error = true;
				oUserDetails.BODY =
					`User details could not bet loaded. If the error persists, please contact your administrator.  Error: ( ${error} ; ${error} )`;
			};
			BackendConnector.doGet("GET_USER_DETAILS", onSuccess, onError, true);

			return oUserDetails;
		},

		/** @function used to initialize the PLC session
		 */
		plcInitSession: function (sViewName) {
			var oController = this;

			var sInitSesstionAtOpenApp = _.find(sap.ui.getCore().aConfiguration, (item) => {
				return item.FIELD_NAME === "INIT_SESSION_AT_OPEN_APP";
			});

			if (sInitSesstionAtOpenApp) {
				if (sInitSesstionAtOpenApp.FIELD_VALUE === "true") {

					var onSuccess = function () {};
					var onError = function () {
						var oButtonPopover = oController.byId("buttonMessagePopover");
						MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorInitPLCSession"), null, "Error",
							sViewName, false, null, oButtonPopover);
					};

					BackendConnector.doGet("INIT_PLC_SESSION", onSuccess, onError, true);
				}
			}
		},

		/** @function used to get configuration which are used in the configuration logic
		 */
		getConfiguration: function (sViewName) {
			var oController = this;
			var onSuccess = function (oData) {
				sap.ui.getCore().aConfiguration = oData.d.results;
			};
			var onError = function () {
				var oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetConfiguration"), null, "Error",
					sViewName, false, null, oButtonPopover);
			};

			BackendConnector.doGet("GET_CONFIGURATION", onSuccess, onError.bind(this), true);
		},

		/** @function used to get default values which are used in the configuration logic
		 */
		getDefaultValues: function (sViewName) {
			var oController = this;
			var onSuccess = function (oData) {
				sap.ui.getCore().aDefaultValues = oData.d.results;
			};
			var onError = function () {
				var oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetDefaultValues"), null, "Error",
					sViewName, false, null, oButtonPopover);
			};

			BackendConnector.doGet("GET_DEFAULT_VALUES", onSuccess, onError, true);
		},

		/** @function used to get the technical user
		 */
		getTechnicalUser: function (sViewName) {
			var oController = this;
			var onSuccess = function (oData) {
				sap.ui.getCore().aTechnicalUser = oData.d.results;
			};
			var onError = function () {
				var oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetTechnicalUser"), null, "Error",
					sViewName, false, null, oButtonPopover);
			};
			BackendConnector.doGet("GET_TECHNICAL_USER", onSuccess, onError, true);
		},

		/** @function used to get details of all existing jobs
		 */
		getAllJobs: function (sViewName) {
			var oController = this;
			var onSuccess = function (oData) {
				sap.ui.getCore().aAllJobs = oData.details.results;
			};
			var onError = function () {
				var oButtonPopover = oController.byId("buttonMessagePopover");
				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorGetAllJobs"), null, "Error", sViewName,
					false, null, oButtonPopover);
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
			var that = this;
			var sLogoutAtCloseApp = _.find(sap.ui.getCore().aConfiguration, (item) => {
				return item.FIELD_NAME === "LOGOUT_AT_CLOSE_APP";
			});
			if (sLogoutAtCloseApp) {
				if (sLogoutAtCloseApp.FIELD_VALUE === "true") {
					window.addEventListener("beforeunload", function () {
						that.plcLogout();
					});
				}
			}
		},

		setSideContentSelectedKey: function (sViewId) {
			var sideContent = this.getView().getParent().getParent().getSideContent();
			var selectedKey = sideContent.getSelectedKey();
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
				jobID: oEvent.getParameters().item.getType()
			});
		}
	});
});
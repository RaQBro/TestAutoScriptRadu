/* global _:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/MessagePopover",
	"sap/m/MessageItem",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageStrip",
	"sap/ui/core/MessageType",
	"sap/ui/core/Fragment",
	"sap/ui/core/syncStyleClass"

], function (Controller, UIComponent, MessagePopover, MessageItem, JSONModel, MessageStrip, MessageType, Fragment,
	syncStyleClass) {
	"use strict";

	return Controller.extend("template_application.ui.controller.BaseController", {
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
		aMessages: [],

		/** @function Used to get messages*/
		getMessages: function () {
			return this.aMessages;
		},
		/** @function Used to get Router*/
		getRouter: function () {
			return UIComponent.getRouterFor(this);
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
		/** @function Used to create the message popover control*/
		createMessagePopover: function () {
			var oMessagePopoverBtn = this.getView().byId("messagePopoverBtn");

			var oMessageTemplate = new sap.m.MessageItem({
				type: "{oMessageModel>type}",
				title: "{oMessageModel>title}",
				description: "{oMessageModel>description}",
				subtitle: "{oMessageModel>subtitle}",
				groupName: "{oMessageModel>groupName}"
			});

			this.oMessagePopover = new MessagePopover({
				items: {
					path: "oMessageModel>/",
					template: oMessageTemplate
				},
				groupItems: true
			});

			oMessagePopoverBtn.setVisible(true);
			oMessagePopoverBtn.addDependent(this.oMessagePopover);
		},
		/** @function Used to handle the message button press*/
		handleMessagePopoverPress: function (oEvent) {
			if (!this.oMessagePopover) {
				this.createMessagePopover();
			}
			this.oMessagePopover.toggle(oEvent.getSource());
		},
		/** @function Used to show the message popover if there is an success or error message
		 * @param {array} aMessages - used to store messages
		 */
		handleMessagePopover: function (aMessages) {
			// if (aMessages.length === 0) {
			// 	return;
			// }
			var oMessagePopoverBtn = this.getView().byId("messagePopoverBtn");
			oMessagePopoverBtn.setVisible(true);

			var oMessageModel = new JSONModel();
			oMessageModel.setData(aMessages);

			this.oMessagePopover.setModel(oMessageModel, "oMessageModel");
			oMessagePopoverBtn.setType(this.buttonTypeFormatter());
			oMessagePopoverBtn.setIcon(this.buttonIconFormatter());

			var errorMessage = _.find(aMessages, function (message) {
				return message.type === "Error";
			});
			var successMessage = _.find(aMessages, function (message) {
				return message.type === "Success";
			});

			if ((errorMessage !== null && errorMessage !== undefined) || (successMessage !== null && successMessage !== undefined)) {
				this.oMessagePopover.openBy(oMessagePopoverBtn);
			}

			let sShowAllMessagesInPopover = _.find(sap.ui.getCore().aDefaultValues, (item) => {
				return item.FIELD_NAME === "SHOW_ALL_MESSAGES_IN_POPOVER";
			});
			if (sShowAllMessagesInPopover) {
				if (sShowAllMessagesInPopover.FIELD_VALUE === "true") {} else {
					aMessages.length = 0;
				}
			}

		},

		/** @function Used to format the button type according to the message with the highest severity of the message popover
		 * 	Display the button type according to the message with the highest severity
		 *	The priority of the message types are as follows: Error > Warning > Success > Info
		 */
		buttonTypeFormatter: function () {
			var sHighestSeverity,
				aMessagesTemp = this.oMessagePopover.getModel("oMessageModel").oData;

			aMessagesTemp.forEach(function (sMessageTemp) {
				switch (sMessageTemp.type) {
				case "Error":
					sHighestSeverity = "Negative";
					break;
				case "Warning":
					sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
					break;
				case "Success":
					sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
					break;
				default:
					sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
					break;
				}
			});

			return sHighestSeverity;
		},

		/** @function Used to Set the button icon according to the message with the highest severity
		 */
		buttonIconFormatter: function () {
			var sIcon,
				aMessagesTemp = this.oMessagePopover.getModel("oMessageModel").oData;

			aMessagesTemp.forEach(function (sMessageTemp) {
				switch (sMessageTemp.type) {
				case "Error":
					sIcon = "sap-icon://message-error";
					break;
				case "Warning":
					sIcon = sIcon !== "sap-icon://message-error" ? "sap-icon://message-warning" : sIcon;
					break;
				case "Success":
					sIcon = "sap-icon://message-error" && sIcon !== "sap-icon://message-warning" ? "sap-icon://message-success" : sIcon;
					break;
				default:
					sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
					break;
				}
			});
			return sIcon;
		},
		/** @function used to open BusyDialog
		 */
		openBusyDialog: function () {
			var oView = this.getView();

			if (!this._busyDialog) {
				this._busyDialog = Fragment.load({
					name: "template_application.ui.view.fragment.BusyDialog",
					controller: this
				}).then(function (oBusyDialog) {
					oView.addDependent(oBusyDialog);
					syncStyleClass("sapUiSizeCompact", oView, oBusyDialog);
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
		handleControlEnabledVisible: function (controlId, state) {
			this.byId(controlId).setVisible(state);
		},
		/** @function used to get the XCSRF token from PLC , returns the token in a global variable
		 */
		getXCSRFToken: function () {
			if (this.XCSRFToken) {
				return this.XCSRFToken;
			}
			var that = this;
			$.ajax({
				url: "/standard/plc/token",
				type: "GET",
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("X-CSRF-Token", "Fetch");
				},
				complete: function (response) {
					that.XCSRFToken = response.getResponseHeader("X-CSRF-Token");
					jQuery.ajaxSetup({
						beforeSend: function (xhr) {
							xhr.setRequestHeader("X-CSRF-Token", that.XCSRFToken);
						}
					});
				},
				error: function () {}
			});
			return this.XCSRFToken;
		},
		/** @function used to get the user details to show them on the ui
		 */
		getUserDetails: function () {
			var that = this,
				oUserDetails = {};

			$.ajax({
				type: "GET",
				url: "/standard/plc/userDetails",
				contentType: "application/json; charset=utf-8",
				async: false,
				success: function (oData) {
					oUserDetails.Error = false;
					oUserDetails.BODY = oData;
					that.aUserDetails = oData;
				},
				error: function (oXHR, sTextStatus, sErrorThrown) {
					oUserDetails.Error = true;
					oUserDetails.BODY =
						`User details could not bet loaded. If the error persists, please contact your administrator.  Error: ( ${sTextStatus} ; ${sErrorThrown} )`;
				}
			});
			return oUserDetails;
		},
		/** @function used to initialize the PLC session
		 */
		plcInitSession: function () {
			let sMessage,
				that = this;

			let sInitSesstionAtOpenApp = _.find(sap.ui.getCore().aDefaultValues, (item) => {
				return item.FIELD_NAME === "INIT_SESSION_AT_OPEN_APP";
			});
			if (sInitSesstionAtOpenApp) {
				if (sInitSesstionAtOpenApp.FIELD_VALUE === "true") {
					$.ajax({
						type: "GET",
						url: "/standard/plc/initSession",
						contentType: "application/json; charset=utf-8",
						async: false,
						success: function (oData) {},
						error: function (oXHR, sTextStatus, sErrorThrown) {
							sMessage = {
								type: "Error",
								title: that.oResourceBundle.getText("errorInitPLCSession"),
								description: "",
								groupName: ""
							};
							that.aMessages.unshift(sMessage);
						}
					});
				}
			}
		},
		/** @function used to get default values which are used in the configuration logic
		 */
		getDefaultValues: function () {
			var sMessage,
				that = this;
			$.ajax({
				type: "GET",
				url: "/odataService.xsodata/GetDefaultValues?$format=json",
				contentType: "application/json; charset=utf-8",
				async: false,
				success: function (oData) {
					sap.ui.getCore().aDefaultValues = oData.d.results;
				},
				error: function (oXHR, sTextStatus, sErrorThrown) {
					sMessage = {
						type: "Error",
						title: that.oResourceBundle.getText("errorGetDefaultValues"),
						description: "",
						groupName: ""
					};
					that.aMessages.unshift(sMessage);
				}
			});
		},
		/** @function used to logout from PLC
		 */
		plcLogout: function () {
			$.ajax({
				type: "GET",
				url: "/standard/plc/logoutSession",
				contentType: "application/json; charset=utf-8",
				async: false,
				success: function (oData, sStatus) {},
				error: function (oXHR, sTextStatus, sErrorThrown) {}
			});
		},
		/** @function used to add an eventlistener so when the window is closed, it triggers logout from PLC
		 */
		handleWindowClose: function () {
			let sLogoutAtCloseApp = _.find(sap.ui.getCore().aDefaultValues, (item) => {
				return item.FIELD_NAME === "LOGOUT_AT_CLOSE_APP";
			});
			if (sLogoutAtCloseApp) {
				if (sLogoutAtCloseApp.FIELD_VALUE === "true") {
					window.addEventListener('beforeunload', function (e) {
						this.plcLogout();
					});
				}
			}
		}
	});
});
/* global _:true */
sap.ui.define([
	"./BaseController"
], function (Controller) {
	"use strict";
	return Controller.extend("template_application.ui.controller.TechnicalUser", {
		/**
		 * @file TechnicalUser - ce sa si faca
		 */

		/** @function called when controller is initialized	*/
		onInit: function () {
			this.oResourceBundle = this.getResourceBundle();
			this.createMessagePopover();
			this.handleMaintainTechnicalUser();
		},
		/** @function called after onInit*/
		onAfterRendering: function () {},

		handleMaintainTechnicalUser: function () {
			let aDefaultValues = sap.ui.getCore().aDefaultValues;
			let sTechnicalUser = _.find(aDefaultValues, (item) => {
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
			let sTechnicalUsername = this.getView().byId("technicalUsername").getValue();
			let sTechnicalPassword = this.getView().byId("technicalPassword").getValue();
			if (sTechnicalUsername && sTechnicalPassword) {
				this.deleteFromSecureStore(sTechnicalUsername);
				this.insertIntoSecureStore(sTechnicalUsername, sTechnicalPassword);
			} else {
				let sMessage = {
					type: "Error",
					title: "Please fill both username and password",
					description: "",
					groupName: this.oResourceBundle.getText("TechnicalUser")
				};
				this.aMessages.unshift(sMessage);
				this.handleMessagePopover(this.aMessages);
			}
		},
		deleteFromSecureStore: function (sKey) {
			$.ajax({
				type: "GET",
				url: `/secure/store/delete?KEY=${sKey}`,
				contentType: "application/json; charset=utf-8",
				async: false,
				success: function () {},
				error: function () {}
			});
		},
		insertIntoSecureStore: function (sKey, sValue) {
			let sMessage,
				that = this;
			$.ajax({
				type: "POST",
				url: `/secure/store/insert?KEY=${sKey}`,
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify({
					"VALUE": sValue
				}),
				async: false,
				success: function (oData) {
					sMessage = {
						type: "Success",
						title: oData,
						description: "",
						groupName: that.oResourceBundle.getText("TechnicalUser")
					};
				},
				error: function (oXHR, sTextStatus) {
					sMessage = {
						type: "Error",
						title: sTextStatus,
						description: "",
						groupName: that.oResourceBundle.getText("TechnicalUser")
					};
				}
			});
			this.aMessages.unshift(sMessage);
			this.handleMessagePopover(this.aMessages);
		}
	});

}, /* bExport= */ true);
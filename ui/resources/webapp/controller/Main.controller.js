/* global _:true */
sap.ui.define([
	"./BaseController",
	"sap/ui/core/Fragment"
], function (BaseController, Fragment) {
	"use strict";

	return BaseController.extend("webapp.ui.controller.Main", {
		/**
		 * @file MainController - contains logic for the structure of the application
		 */

		/** @function called when controller is initialized	*/
		onInit: function () {
			this.getView().addStyleClass(BaseController.prototype.getContentDensityClass.call(this));

			BaseController.prototype.onInit.call(this);

			var oUserDetails = this.getUserDetails();

			if (oUserDetails.Error === true) {

				sap.ui.getCore().oApplicationError = oUserDetails;

				this.navTo("error");
			} else {

				var avatarBtn = this.getView().byId("avatarBtn");
				avatarBtn.setInitials(this.aUserDetails.givenName.slice(0, 1) + this.aUserDetails.familyName.slice(0, 1));
			}
			this.onRenderingAboutBtn();
		},
		onRenderingAboutBtn: function () {
			let isPhone = sap.ui.Device.system.phone;
			let isTablet = sap.ui.Device.system.tablet;
			let isDesktop = sap.ui.Device.system.desktop;
			let isCombi = sap.ui.Device.system.combi;
			let device = "";
			let optimised = "";
			let supportTouch = "";
			if (isPhone) {
				device = "Phone";
				optimised = "Yes";
			} else if (isCombi) {
				device = "Combi";
				optimised = "No";
			} else if (isDesktop) {
				device = "Desktop";
				optimised = "No";
			} else if (isTablet) {
				device = "Tablet";
				optimised = "Yes";
			}
			if (sap.ui.Device.support.touch) {
				supportTouch = "Yes";
			} else {
				supportTouch = "No";
			}
			let aboutModel = {

				frameId: "UI5",
				frameVersion: sap.ui.version,
				dType: device,
				theme: "",
				touchInput: supportTouch,
				optimisedTouch: optimised,
				userAgent: navigator.userAgent
			};
			let oModel = new sap.ui.model.json.JSONModel(aboutModel);
			this.getView().setModel(oModel, "aboutModel");
		},
		/** @function called after onInit*/
		onAfterRendering: function () {},

		/** @function used when the user details avatar is pressed*/
		onIndividualPress: function () {
			var oAvatarBtn = this.getView().byId("avatarBtn");
			if (!this._oIndividuaLPopover) {
				Fragment.load({
					name: "webapp.ui.view.fragment.IndividualPopover",
					controller: this
				}).then(function (oPopover) {
					this._oIndividuaLPopover = oPopover;
					this.getView().addDependent(this._oIndividuaLPopover);
					this._oIndividuaLPopover.setTitle(this.aUserDetails.givenName + " " + this.aUserDetails.familyName);
					this._oIndividuaLPopover.openBy(oAvatarBtn);
				}.bind(this));
			} else {
				this._oIndividuaLPopover.close();
				this._oIndividuaLPopover.openBy(oAvatarBtn);
			}
		},

		/** @function used when About is pressed from the user details*/
		onAboutPress: function () {
			var oView = this.getView(),
				oController = oView.getController(),
				oAboutModel = oView.getModel("aboutModel");
			// instantiate dialog
			if (!oController._aboutDialog) {
				oController._aboutDialog = sap.ui.xmlfragment("webapp.ui.view.fragment.AboutDialog", oController);
				oView.addDependent(this._aboutDialog);
			}
			oAboutModel.setProperty("/theme", sap.ui.getCore().getConfiguration().getTheme());
			// open dialog
			oController._aboutDialog.open();
		},

		/** @function used when OK is pressed from the About from the user details*/
		onAboutDialogOk: function () {
			var oView = this.getView(),
				oController = oView.getController();
			oController._aboutDialog.close();
		},

		/** @function used when How To is pressed from the user details*/
		onHowToPress: function () {
			var oView = this.getView(),
				oController = oView.getController();
			// instantiate dialog
			if (!oController._howToDialog) {
				oController._howToDialog = sap.ui.xmlfragment("webapp.ui.view.fragment.HowToDialog", oController);
				oView.addDependent(this._howToDialog);
			}

			// open dialog
			oController._howToDialog.open();
		},

		onAfterHowToOpen: function (oEvent) {
			let sRTE;

			let oRTE = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === "RTE";
			});

			sRTE = oRTE !== null && oRTE !== undefined ? oRTE.FIELD_VALUE : "";

			oEvent.getSource().getContent()[0].setHtmlText(sRTE);
		},

		/** @function used when OK is pressed from the  How To from the user details*/
		onHowToDialogOk: function () {
			var oView = this.getView(),
				oController = oView.getController();
			oController._howToDialog.close();
		},

		/** @function called when logout is pressed*/
		onLogoutPress: function () {
			sap.m.URLHelper.redirect("/logout");
		},

		/** @function called when button the expand the toolPage from the left side*/
		onMenuButtonPress: function () {
			var toolPage = this.byId("toolPage");
			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		/** @function called when button the expand the toolPage from the left side*/
		colapseSideNavigation: function () {
			var toolPage = this.byId("toolPage");
			toolPage.setSideExpanded(false);
		},

		/** @function called when a view from the left list is selected and it's navigating to that specific view*/
		onViewChange: function (oEvent) {
			var item = oEvent.getParameter("item");
			this.navTo(item.getKey());
		}
	});
});
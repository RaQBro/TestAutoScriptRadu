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

			let oUserDetails = this.getUserDetails();

			if (oUserDetails.Error === true) {

				sap.ui.getCore().oApplicationError = oUserDetails;

				this.navTo("error");
			} else {

				let avatarBtn = this.getView().byId("avatarBtn");
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

		/** @function used when the user details avatar is pressed*/
		onIndividualPress: function () {

			let oView = this.getView();
			let oAvatarBtn = this.getView().byId("avatarBtn");

			if (!this._oIndividuaLPopover) {

				Fragment.load({
					name: "webapp.ui.view.fragment.IndividualPopover",
					controller: this
				}).then(function (oPopover) {
					this._oIndividuaLPopover = oPopover;
					oView.addDependent(this._oIndividuaLPopover);
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

			let oView = this.getView();
			let oAboutModel = oView.getModel("aboutModel");

			if (!this._oAboutDialog) {

				this._oAboutDialog = Fragment.load({
					name: "webapp.ui.view.fragment.AboutDialog",
					controller: this
				}).then(function (oAboutDialog) {
					oView.addDependent(oAboutDialog);
					oAboutModel.setProperty("/theme", sap.ui.getCore().getConfiguration().getTheme());
					return oAboutDialog;
				}.bind());
			}

			this._oAboutDialog.then(function (oAboutDialog) {
				oAboutDialog.open();
			}.bind());
		},

		/** @function used when OK is pressed from the About from the user details*/
		onAboutDialogOk: function () {

			this._oAboutDialog.then((oAboutDialog) => {
				oAboutDialog.close();
			});
		},

		/** @function used when How To is pressed from the user details*/
		onHowToPress: function () {

			let oView = this.getView();

			if (!this._oHowToDialog) {

				this._oHowToDialog = Fragment.load({
					name: "webapp.ui.view.fragment.HowToDialog",
					controller: this
				}).then(function (oHowToDialog) {
					oView.addDependent(oHowToDialog);
					return oHowToDialog;
				}.bind());
			}

			this._oHowToDialog.then(function (oHowToDialog) {
				oHowToDialog.open();
			}.bind());
		},

		onAfterHowToOpen: function (oEvent) {

			let sRTE;
			let oRTE = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === "RTE";
			});

			sRTE = oRTE !== null && oRTE !== undefined ? oRTE.FIELD_DESCRIPTION : "";

			oEvent.getSource().getContent()[0].setHtmlText(sRTE);
		},

		/** @function used when OK is pressed from the  How To from the user details*/
		onHowToDialogOk: function () {

			this._oHowToDialog.then((oHowToDialog) => {
				oHowToDialog.close();
			});
		},

		/** @function called when logout is pressed*/
		onLogoutBtnPress: function () {

			sap.m.URLHelper.redirect("/logout");
		},

		/** @function called when button the expand the toolPage from the left side*/
		onMenuButtonPress: function () {

			let toolPage = this.byId("toolPage");

			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		/** @function called when homeicon is pressed*/
		onLogoPress: function () {

			sap.m.URLHelper.redirect(this.getBaseUrl());
		},

		/** @function used to get the url without the hash*/
		getBaseUrl: function () {

			if (window.location.href.slice(-1) === "#") {
				return window.location.href.slice(0, -1);
			} else {
				return window.location.href.replace(window.location.hash, "");
			}
		},

		/** @function called when button the expand the toolPage from the left side*/
		colapseSideNavigation: function () {

			let toolPage = this.byId("toolPage");

			toolPage.setSideExpanded(false);
		},

		/** @function called when a view from the left list is selected and it's navigating to that specific view*/
		onViewChange: function (oEvent) {

			let item = oEvent.getParameter("item");

			this.navTo(item.getKey());
		}
	});
});
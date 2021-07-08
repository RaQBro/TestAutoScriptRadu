sap.ui.define([
	"./BaseController",
	"sap/ui/core/Fragment"
], function (BaseController, Fragment) {
	"use strict";

	return BaseController.extend("template_application.ui.controller.Main", {
		/**
		 * @file MainController - contains logic for the structure of the application
		 */

		/** @function called when controller is initialized	*/
		onInit: function () {
			let sXCSRFToken = this.getXCSRFToken();
			let oUserDetails = this.getUserDetails();

			if (!sXCSRFToken) {
				this.getRouter().navTo("error", {
					item: `Something went wrong with application token, please try again. If the error persists, please contact your administrator.`
				});
			} else {
				if (oUserDetails.Error === true) {
					this.getRouter().navTo("error", {
						item: JSON.stringify(oUserDetails)
					});
				} else {
					this.getRouter().navTo("view");
					this.oResourceBundle = this.getResourceBundle();
					let avatarBtn = this.getView().byId("avatarBtn");
					avatarBtn.setInitials(this.aUserDetails.givenName.slice(0, 1) + this.aUserDetails.familyName.slice(0, 1));
					//Get default configuration values
					this.getDefaultValues();
					//Triggered to initialize the PLC session if INIT_SESSION_AT_OPEN_APP is true
					this.plcInitSession();
					//Triggered to activate the event listener for logging out of PLC when LOGOUT_AT_CLOSE_APP is true. The logout will happen on window/browser close.
					this.handleWindowClose();
				}
			}

		},
		/** @function called after onInit*/
		onAfterRendering: function () {},
		/** @function used when the user details avatar is pressed*/
		onIndividualPress: function () {
			var oAvatarBtn = this.getView().byId("avatarBtn");
			if (!this._oIndividuaLPopover) {
				Fragment.load({
					name: "template_application.ui.view.fragment.IndividualPopover",
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
				oController = oView.getController();
			// instantiate dialog
			if (!oController._aboutDialog) {
				oController._aboutDialog = sap.ui.xmlfragment("template_application.ui.view.fragment.AboutDialog", oController);
				oView.addDependent(this._aboutDialog);
			}
			// open dialog
			jQuery.sap.syncStyleClass("sapUiSizeCompact", oView, oController._aboutDialog);
			oController._aboutDialog.open();
		},
		/** @function used when OK is pressed from the About from the user details*/
		onAboutDialogOk: function () {
			var oView = this.getView(),
				oController = oView.getController();
			oController._aboutDialog.close();
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
			this.getRouter().navTo(item.getKey());
		}
	});
});
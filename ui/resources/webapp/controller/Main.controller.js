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

				this.navTo("error", {
					item: JSON.stringify(oUserDetails)
				});
			} else {

				var avatarBtn = this.getView().byId("avatarBtn");
				avatarBtn.setInitials(this.aUserDetails.givenName.slice(0, 1) + this.aUserDetails.familyName.slice(0, 1));
			}
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
				oController = oView.getController();
			// instantiate dialog
			if (!oController._aboutDialog) {
				oController._aboutDialog = sap.ui.xmlfragment("webapp.ui.view.fragment.AboutDialog", oController);
				oView.addDependent(this._aboutDialog);
			}
			// open dialog
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
			this.navTo(item.getKey());
		}
	});
});
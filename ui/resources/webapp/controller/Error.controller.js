sap.ui.define([
	"./BaseController",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, MessageHelpers, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.Error", {

		sViewName: "default",
		ToolBarMessages: ToolBarMessages,

		/** @function called when controller is initialized	*/
		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("error").attachMatched(this.onObjectMatched, this);
		},

		onObjectMatched: function () {

			this.setupView();
		},

		setupView: function () {

			this.getView().setModel(this.getPageModel(this.sViewName), "pageModel");
			this.pageModel = this.getModel("pageModel");
			this.oButtonPopover = this.byId("buttonMessagePopover");

			this._popUpMessage();
		},

		/** @function called when an error from get user details appears */
		_popUpMessage: function () {

			let oApplicationError = sap.ui.getCore().oApplicationError;
			let oAuthError = sap.ui.getCore().oAuthError;

			if (this.oButtonPopover !== undefined) {

				if (oApplicationError) {

					MessageHelpers.addMessageToPopover.call(this, oApplicationError.Message, oApplicationError.Description, null, "Error", "Error",
						false, null, this.oButtonPopover);

					this.oButtonPopover.firePress();
				}

				if (oAuthError) {

					MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error", "Error", false,
						null, this.byId("buttonMessagePopover"));

					this.oButtonPopover.firePress();
				}
			}
		}
	});
});
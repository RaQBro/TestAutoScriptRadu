sap.ui.define([
	"./BaseController",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, MessageHelpers, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.Error", {

		ToolBarMessages: ToolBarMessages,

		/** @function called when controller is initialized	*/
		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("error").attachMatched(this._popUpMessage, this);

			this.oButtonPopover = this.byId("buttonMessagePopover");
		},

		/** @function called when an error from get user details appears */
		_popUpMessage: function () {
			if (!sap.ui.getCore().oApplicationError) {
				return;
			}
			let oApplicationError = sap.ui.getCore().oApplicationError;

			if (this.oButtonPopover !== undefined) {

				MessageHelpers.addMessageToPopover.call(this, oApplicationError.Message, oApplicationError.Description, null, "Error", "Error",
					false, null, this.oButtonPopover);

				this.oButtonPopover.firePress();
			}
		}
	});
});
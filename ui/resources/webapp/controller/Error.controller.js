sap.ui.define([
	"./BaseController",
	"sap/m/MessageStrip",
	"sap/ui/core/MessageType"
], function (BaseController, MessageStrip, MessageType) {
	"use strict";

	return BaseController.extend("webapp.ui.controller.Error", {
		/**
		 * @file ErrorController -  
		 */

		/** @function called when controller is initialized	*/
		onInit: function () {
			this.redirectToLaunchpadOnRefresh();
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("error").attachMatched(this._popUpMessage, this);
		},

		/** @function called when an error from get user details appears */
		_popUpMessage: function (oEvent) {
			var oParam = oEvent.getParameter("arguments").item;
			var oErrorMessageStrip = new MessageStrip({
				text: JSON.parse(oParam).BODY,
				type: MessageType.Error,
				showIcon: true,
				showCloseButton: false
			});

			this.getView().byId("oVerticalContent").addContent(oErrorMessageStrip);
		}
	});
});
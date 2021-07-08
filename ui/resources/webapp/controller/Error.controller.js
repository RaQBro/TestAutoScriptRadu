sap.ui.define([
	"./BaseController",
	"sap/m/MessageStrip",
	"sap/ui/core/MessageType"
], function (BaseController, MessageStrip, MessageType) {
	"use strict";

	return BaseController.extend("template_application.ui.controller.Error", {
		/**
		 * @file NoDetailController -  
		 */
		 
		/** @function called when controller is initialized	*/
		onInit: function () {
			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("error").attachMatched(this._popUpMessage, this);
		},
		/** @function called when an error from get user details appears */
		_popUpMessage: function (oEvent) {
			let oParam = oEvent.getParameter("arguments").item;
			let oErrorMessageStrip = new MessageStrip({
				text: JSON.parse(oParam).BODY,
				type: MessageType.Error,
				showIcon: true,
				showCloseButton: false
			});

			this.getView().byId("oVerticalContent").addContent(oErrorMessageStrip);
		}
	});
});
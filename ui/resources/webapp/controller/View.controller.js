sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, ToolBarMessages) {
	"use strict";
	return Controller.extend("webapp.ui.controller.View", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("view").attachPatternMatched(this._onObjectMatched, this);
		},

		onAfterRendering: function () {},

		_onObjectMatched: function () {
			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {

			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s
			this._mViewSettingsDialogs = {};

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", false);

			this.closeBusyDialog();
		},

		onExit: function () {
			var oDialogKey,
				oDialogValue;
			for (oDialogKey in this._mViewSettingsDialogs) {
				oDialogValue = this._mViewSettingsDialogs[oDialogKey];
				if (oDialogValue) {
					oDialogValue.destroy();
				}
			}
		}
	});

}, /* bExport= */ true);
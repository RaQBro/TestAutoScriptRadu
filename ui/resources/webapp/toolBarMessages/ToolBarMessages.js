sap.ui.define([
	"sap/ui/core/Fragment"
], function (Fragment) {
	"use strict";

	var oMessagePopover = null;
	var initialised = false;

	var toolBarMessages = {

		initialiseMessagePopover: function () {
			if (initialised === false) {
				initialised = true;
				var oView = this.getView();
				oView.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");

				Fragment.load({
					id: oView.getId(),
					name: "webapp.ui.toolBarMessages.MessagePopover",
					controller: this
				}).then(function (oFragment) {
					oView.addDependent(oFragment);
					oMessagePopover = oFragment;
				});
			}
		},

		onMessagePopoverPress: function (oEvent) {
			oMessagePopover.openBy(oEvent.getSource());
		}
	};

	return toolBarMessages;
});
sap.ui.define([
	"sap/ui/core/Fragment"
], function (Fragment) {
	"use strict";

	let oMessagePopover = null;
	let initialised = false;

	let toolBarMessages = {

		initialiseMessagePopover: function () {
			if (initialised === false) {
				initialised = true;
				let oView = this.getView();
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
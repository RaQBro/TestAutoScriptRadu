sap.ui.define([
	"./Constants",
	"sap/ui/core/message/Message"
], function (Constants, Message) {
	"use strict";

	var MessageHelpers = {
		buttonIconFormatter: function (sMessageType) {
			switch (sMessageType) {
			case Constants.INFOMESSAGES.ERROR:
				return Constants.SAP_ICONS.ERROR;
			case Constants.INFOMESSAGES.WARNING:
				return Constants.SAP_ICONS.WARNING;
			case Constants.INFOMESSAGES.SUCCESS:
				return Constants.SAP_ICONS.SUCCESS;
			default:
				return Constants.SAP_ICONS.INFORMATION;
			}
		},

		buttonTypeFormatter: function (sMessageType) {
			switch (sMessageType) {
			case Constants.INFOMESSAGES.ERROR:
				return Constants.SAP_BUTTON_TYPE.ERROR;
			case Constants.INFOMESSAGES.WARNING:
				return Constants.SAP_BUTTON_TYPE.WARNING;
			case Constants.INFOMESSAGES.SUCCESS:
				return Constants.SAP_BUTTON_TYPE.SUCCESS;
			default:
				return Constants.SAP_BUTTON_TYPE.INFORMATION;
			}
		},

		handleMessagePopoverButtonStyle: function (oButton, sType) {
			oButton.setIcon(MessageHelpers.buttonIconFormatter.call(this, sType));
			oButton.setType(MessageHelpers.buttonTypeFormatter.call(this, sType));
		},

		addMessageToPopover: function (sMessage, sType, oButton) {
			let oMessage = new Message({
				message: sMessage,
				type: sType
			});
			sap.ui.getCore().getMessageManager().addMessages(oMessage);
			if (oButton) {
				MessageHelpers.handleMessagePopoverButtonStyle.call(this, oButton, sType);
			}
		}
	};

	return MessageHelpers;
});
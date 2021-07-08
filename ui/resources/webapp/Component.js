sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"template_application/ui/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("template_application.ui.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// enable routing
			this.getRouter().initialize();
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			this.timeoutID = 0;
			this.setup();
		},

		setup: function () {
			var that = this;
			window.addEventListener("mousemove", function () {
				that.resetTimer();
			});
			this.startTimer();
		},
		startTimer: function () {
			var that = this;
			this.timeoutID = window.setInterval(function () {
				that.goInactive();
			}, 10000);
		},
		resetTimer: function () {
			this.timeoutID = 0;
		},
		goInactive: function () {
			this.timeoutID += 10000;
			if (this.timeoutID >= 840000) {
				sap.m.URLHelper.redirect("/logout");
			}
		}

	});
});
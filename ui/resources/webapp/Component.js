sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"webapp/ui/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("webapp.ui.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the init function of the parent
			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleUrl: "/webapp/i18n/i18n.properties",
				fallbackLocale: "en"
			});
			this.setModel(i18nModel, "i18n");
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			this.initModel();

			// enable routing
			this.getRouter().initialize();
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			this.timeoutID = 0;
			this.setup();
		},

		initModel: function () {},

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
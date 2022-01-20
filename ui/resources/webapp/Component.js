sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/fl/FakeLrepConnectorLocalStorage",
	"webapp/ui/model/models",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/Constants"
], function (UIComponent, FakeLrepConnectorLocalStorage, models, BackendConnector, Constants) {
	"use strict";

	return UIComponent.extend("webapp.ui.Component", {

		countdown: Constants.timeout.SESSION_TIMEOUT,

		resetCountdown: Constants.timeout.SESSION_TIMEOUT,

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {

			FakeLrepConnectorLocalStorage.enableFakeConnector();

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

			this._setInactivityTimeout(this.countdown);
			this._startInactivityTimer();

			BackendConnector.doGet({
					constant: "AUTH_URL"
				},
				function (res, status, xhr) {
					var sHeaderCsrfToken = "X-Csrf-Token";
					var sCsrfToken = xhr.getResponseHeader(sHeaderCsrfToken);
					// for POST, PUT, and DELETE requests, add the CSRF token to the header
					$(document).ajaxSend(function (event, jqxhr, settings) {
						if (settings.type === "POST" || settings.type === "PUT" || settings.type === "DELETE" || settings.type === "PATCH") {
							jqxhr.setRequestHeader(sHeaderCsrfToken, sCsrfToken);
						}
					});
				},
				null,
				null,
				null, {
					"X-Csrf-Token": "fetch"
				}
			);
		},

		initModel: function () {},

		/**
		 * Set number of minutes left till automatic logout
		 */
		_setInactivityTimeout: function (timeouMillisec) {
			this.countdown = timeouMillisec;
			this.resetCountdown = this.countdown;
		},

		/**
		 * Set number of minutes left till automatic logout
		 */
		_resetInactivityTimeout: function () {
			this.countdown = this.resetCountdown;
		},

		/**
		 * Begin counting tracking inactivity
		 */
		_startInactivityTimer: function () {
			this.intervalHandle = setInterval(function () {
				this._inactivityCountdown();
			}.bind(this), Constants.timeout.TEN_SECONDS);
		},

		stopInactivityTimer: function () {
			if (this.intervalHandle !== null) {
				clearInterval(this.intervalHandle);
				this.intervalHandle = null;
			}
		},

		_inactivityCountdown: function () {
			this.countdown -= Constants.timeout.TEN_SECONDS;
			if (this.countdown <= 0) {
				this._ping();
			}
		},

		_ping: function () {
			BackendConnector.doGet({
					constant: "AUTH_URL"
				},
				function () {
					this.stopInactivityTimer();
					this._resetInactivityTimeout();
					this._startInactivityTimer();
				}.bind(this),
				function () {
					window.location.href = "/logout";
				}
			);
		},

		destroy: function () {
			FakeLrepConnectorLocalStorage.disableFakeConnector();
			UIComponent.prototype.destroy.apply(this, arguments);
		}
	});
});
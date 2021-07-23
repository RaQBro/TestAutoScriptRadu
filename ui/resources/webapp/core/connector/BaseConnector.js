sap.ui.define([
	"./UrlProvider"
], function (UrlProvider) {
	"use strict";

	var BaseConnector = {

		_sDefaultContentType: "application/json",
		_sDefaultDataType: "json",

		doAjaxCall: function (sHttpMethod, vURL, oData, fnSuccess, fnError, oHeaders, bExpectsResponse, bSync, dataType, contentType) {
			var mConfiguration = {};

			mConfiguration.type = sHttpMethod;

			if (contentType === undefined) {
				contentType = this._sDefaultContentType;
			}

			if (dataType === undefined) {
				dataType = this._sDefaultDataType;
			}

			if (bExpectsResponse) {
				mConfiguration.contentType = contentType;
				mConfiguration.dataType = dataType;
			}

			mConfiguration.success = fnSuccess;
			mConfiguration.error = fnError;

			if (bSync) {
				mConfiguration.async = false;
			}

			if (oHeaders) {
				mConfiguration.headers = oHeaders;
			}

			if (sHttpMethod !== "GET") {
				mConfiguration.data = JSON.stringify(oData);
			}

			if (typeof vURL === "object") {
				var mURLConfiguration = vURL,
					sQuery = mURLConfiguration.query ? mURLConfiguration.query : "";

				mConfiguration.url = UrlProvider.getUrl(mURLConfiguration.constant, mURLConfiguration.parameters) + sQuery;
			} else {
				mConfiguration.url = UrlProvider.getUrl(vURL);
			}

			return jQuery.ajax(mConfiguration)
				.success(function (oResponse) {
					//TODO

				})
				.fail(function (oResponse) {
					//TODO

				}.bind(this));
		}

	};
	return BaseConnector;
});
sap.ui.define([
	"./URLConstants"
], function (mConstants) {
	"use strict";

	function UrlProvider(_mConstants) {
		this._mConstants = _mConstants;
	}

	UrlProvider.prototype.getUrl = function (sConstant, mParameters) {
		let sURL = this._mConstants[sConstant];

		if (!sURL) {
			throw new Error("URL defined by constant '" + sConstant + "' not found in UrlProvider.js");
		}

		if (mParameters) {
			Object.keys(mParameters).forEach(function (sKey) {
				sURL = sURL.replace("{" + sKey + "}", encodeURIComponent(mParameters[sKey]));
			});
		}
		return sURL;
	};

	return new UrlProvider(mConstants);
});
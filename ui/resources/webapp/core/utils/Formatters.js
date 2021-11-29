sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
	"use strict";

	const oFormatOptions = {
		minIntegerDigits: 1,
		maxIntegerDigits: 10,
		minFractionDigits: 0,
		maxFractionDigits: 2
	};

	return {

		formatStringFloatValue: function (value) {

			let oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions);

			return oFloatFormat.format(oFloatFormat.parse(value));
		},

		formatFloatValue: function (value) {

			let oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions);

			return oFloatFormat.format(value);
		}
	};
});
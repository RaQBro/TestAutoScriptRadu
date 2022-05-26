sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
	"use strict";
	let oFormatOptions = {};
	switch (sap.ui.getCore().getConfiguration().getLanguage()) {
	case "en-US":
		oFormatOptions = {
			minIntegerDigits: 1,
			maxIntegerDigits: 10,
			minFractionDigits: 0,
			maxFractionDigits: 2,
			groupingEnabled: true,
			groupingSeparator: ",",
			decimalSeparator: "."
		};
		break;
	case "de":
		oFormatOptions = {
			minIntegerDigits: 1,
			maxIntegerDigits: 10,
			minFractionDigits: 0,
			maxFractionDigits: 2,
			groupingEnabled: true,
			groupingSeparator: ".",
			decimalSeparator: ","

		};
		break;
	}
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
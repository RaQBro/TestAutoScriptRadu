sap.ui.define([
		"sap/ui/core/format/NumberFormat"
	], function (NumberFormat) {
		"use strict";
		let oFloatFormat = NumberFormat.getFloatInstance({
				minIntegerDigits: 1,
				maxIntegerDigits: 10,
				minFractionDigits: 0,
				maxFractionDigits: 2,
				groupingEnabled: true
			},
			sap.ui.getCore().getConfiguration().getLocale());

		return {
			floatFormat: function (value) {

				return oFloatFormat.format(value);

			}
		};
	}

);
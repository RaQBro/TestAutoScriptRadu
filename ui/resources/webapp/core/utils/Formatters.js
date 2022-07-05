sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
	"use strict";

	const oFormatOptions = {
		minIntegerDigits: 1,
		maxIntegerDigits: 10,
		minFractionDigits: 0,
		maxFractionDigits: 2,
		groupingEnabled: true
	};
	let oLocale = sap.ui.getCore().getConfiguration().getLocale();

	return {

		formatStringFloatValue: function (value) {

			let oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions, oLocale);

			return oFloatFormat.format(oFloatFormat.parse(value));
		},

		formatFloatValue: function (value) {

			let oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions, oLocale);

			return oFloatFormat.format(value);
		},

		getDateByPattern: function (sPattern, dDatePicker) {

			function addZero(i) {
				if (i < 10) {
					i = "0" + i;
				}
				return i;
			}

			let dDate = new Date();

			let iYear;
			let sMonth;
			let sDate;
			let dDatePickerDate;

			if (dDatePicker === undefined || dDatePicker === "") {
				iYear = dDate.getFullYear();
				sMonth = addZero(dDate.getMonth() + 1);
				sDate = addZero(dDate.getDate());
			} else {
				dDatePickerDate = new Date(dDatePicker);
				iYear = dDatePickerDate.getFullYear();
				sMonth = addZero(dDatePickerDate.getMonth() + 1);
				sDate = addZero(dDatePickerDate.getDate());
			}
			let sHours = addZero(dDate.getHours());
			let sMinutes = addZero(dDate.getMinutes());
			let sSeconds = addZero(dDate.getSeconds());

			let sCurrentDate = "";
			switch (sPattern) {
			case "YYYYMMDD hh:mm:ss":
				sCurrentDate = iYear + "" + sMonth + "" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
				break;
			case "YYYYMMDD":
				sCurrentDate = iYear + "" + sMonth + "" + sDate;
				break;
			case "DD.MM.YYYY hh:mm:ss":
				sCurrentDate = sDate + "." + sMonth + "." + iYear + " " + sHours + ":" + sMinutes + ":" + sSeconds;
				break;
			case "DD.MM.YYYY":
				sCurrentDate = sDate + "." + sMonth + "." + iYear;
				break;
			case "YYYY/MM/DD hh:mm:ss":
				sCurrentDate = iYear + "/" + sMonth + "/" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
				break;
			case "YYYY/MM/DD":
				sCurrentDate = iYear + "/" + sMonth + "/" + sDate;
				break;
			case "YYYY-MM-DD hh:mm:ss":
				sCurrentDate = iYear + "-" + sMonth + "-" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
				break;
			case "YYYY-MM-DD":
				sCurrentDate = iYear + "-" + sMonth + "-" + sDate;
				break;
			case "YYYY-MM":
				sCurrentDate = iYear + "-" + sMonth;
				break;
			case "YYYY-MM[-1]":
				if (sMonth === "01") {
					sCurrentDate = iYear - 1 + "-12";
				} else {
					if (dDatePicker === undefined) {
						sCurrentDate = iYear + "-" + addZero(dDate.getMonth());
					} else {
						sCurrentDate = iYear + "-" + addZero(dDatePickerDate.getMonth());
					}
				}
				break;
			default:
				sCurrentDate = iYear + "" + sMonth + "" + sDate + " " + sHours + ":" + sMinutes + ":" + sSeconds;
				break;
			}

			return sCurrentDate;
		}
	};

});
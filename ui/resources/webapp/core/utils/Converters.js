sap.ui.define([
	"sap/ui/export/EdmType"
], function (EdmType) {
	"use strict";

	return {

		convertStringToEdmType: function (sEdm) {

			switch (sEdm) {
			case "Edm.BigNumber":
				return EdmType.BigNumber;
			case "Edm.Boolean":
				return EdmType.Boolean;
			case "Edm.Currency":
				return EdmType.Currency;
			case "Edm.Date":
				return EdmType.Date;
			case "Edm.DateTime":
				return EdmType.DateTime;
			case "Edm.Enumeration":
				return EdmType.Enumeration;
			case "Edm.Number":
				return EdmType.Number;
			case "Edm.String":
				return EdmType.String;
			case "Edm.Time":
				return EdmType.Time;
			default:
				return EdmType.String;
			}
		},

		convertXmlToJson: function (xml) {

			// Create the return object
			let obj = {};

			if (xml.nodeType === 1) { // element

				// do attributes
				if (xml.attributes.length > 0) {

					obj["@attributes"] = {};

					for (let j = 0; j < xml.attributes.length; j++) {
						let attribute = xml.attributes.item(j);
						obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType === 3) { // text

				obj = xml.nodeValue;
			}

			// do children
			if (xml.hasChildNodes()) {

				for (let i = 0; i < xml.childNodes.length; i++) {

					let item = xml.childNodes.item(i);
					let nodeName = item.nodeName;

					if (typeof (obj[nodeName]) === "undefined") {

						obj[nodeName] = this.convertXmlToJson(item);
					} else {

						if (typeof (obj[nodeName].push) === "undefined") {

							let old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}

						obj[nodeName].push(this.convertXmlToJson(item));
					}
				}
			}

			return obj;
		},

		convertToLocalDateTime: function (sDateTime) {

			return new Date(parseInt(sDateTime.replaceAll("/Date(", "").replaceAll(")/", ""))).toLocaleString();
		}
	};
});

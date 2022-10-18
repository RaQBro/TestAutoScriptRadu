sap.ui.define([
	"./BaseController"
], function (Controller) {
	"use strict";

	return Controller.extend("webapp.ui.controller.Jobs", {

		oAuth: {},
		sViewName: "jobs",

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("J");

			if (this.oAuth.display) {

				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onObjectMatched, this);
			} else {

				this.getView().setVisible(false);
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onUnauthorizedMatched, this);
			}
		},

		onObjectMatched: function () {

			this.openBusyDialog();
			this.setupView();
			this.closeBusyDialog();
		},

		onUnauthorizedMatched: function () {

			sap.ui.getCore().oAuthError = true;

			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getOwnerComponent().getModel("serviceModel"));

			this.setSideContentSelectedKey(this.sViewName);
		},

		onInitialiseSmartTable: function () {

			let oView = this.getView();
			let oSmartTable = oView.byId("stJobs");

			let oExistingVariant = oSmartTable.fetchVariant();

			if (oExistingVariant !== undefined) {

				oSmartTable.applyVariant(oExistingVariant);
			} else {

				oSmartTable.applyVariant({
					sort: {
						sortItems: [{
							columnKey: "JOB_TIMESTAMP",
							operation: "Descending"
						}]
					}
				});
			}

			oSmartTable.rebindTable();
		},

		onRefreshEntries: function () {

			this.oView.byId("stJobs").getTable().getBinding("items").refresh();
		},

		onViewJobLogs: function (oEvent) {

			let iJobId = oEvent.getSource().getBindingContext().getObject().JOB_ID;
			let bIsArchived = oEvent.getSource().getBindingContext().getObject().IS_ARCHIVED.toString();

			this.navTo("messages", {
				JOB_ID: iJobId,
				IS_ARCHIVED: bIsArchived
			});
		},

		formatRowHighlight: function (oValue) {

			let value = "None"; // used for "Pending" or "In Process" jobs

			if (oValue && oValue.toUpperCase() === "ERROR") {
				value = "Error";
			} else if (oValue && oValue.toUpperCase() === "SUCCESS") {
				value = "Success";
			} else if (oValue && oValue.toUpperCase() === "WARNING") {
				value = "Warning";
			} else if (oValue && oValue.toUpperCase() === "RUNNING") {
				value = "Information";
			}

			return value;
		},

		archivedIcon: function (oValue) {

			let value = "";

			if (oValue === 1) {
				value = "sap-icon://email";
			}
			return value;
		}
	});
}, /* bExport= */ true);
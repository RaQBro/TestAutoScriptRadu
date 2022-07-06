sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.Jobs", {

		oAuth: {},
		sViewName: "jobs",
		ToolBarMessages: ToolBarMessages,

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

			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getPageModel(this.sViewName), "pageModel");
			this.getView().setModel(this.getOwnerComponent().getModel("serviceModel"));

			this.setSideContentSelectedKey(this.sViewName);
		},

		onAfterRendering: function () {

			this.applyFilters();
		},

		applyFilters: function () {

			let oView = this.getView();
			let oSmartTable = oView.byId("stJobs");

			let oExistingVariant = oSmartTable.fetchVariant();

			if (oExistingVariant !== undefined) {

				oSmartTable.applyVariant(oExistingVariant);
			} else {

				oSmartTable.applyVariant({
					sort: {
						sortItems: [{
							columnKey: "START_TIMESTAMP",
							operation: "Descending"
						}]
					}
				});
			}

			if (oSmartTable.isInitialised()) {

				oSmartTable.rebindTable();
			}
		},

		onRefreshEntries: function () {

			this.oView.byId("stJobs").getTable().getBinding("items").refresh();
		},

		onViewJobLogs: function (oEvent) {

			let iJobId = oEvent.getSource().getBindingContext().getObject().JOB_ID;

			this.navTo("messages", {
				jobID: iJobId
			});
		},

		formatRowHighlight: function (oValue) {

			let value = "None";

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
		}
	});
}, /* bExport= */ true);
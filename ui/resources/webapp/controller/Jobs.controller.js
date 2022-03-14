sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, ToolBarMessages) {
	"use strict";
	const sViewName = "jobs";
	return Controller.extend("webapp.ui.controller.Jobs", {

		oAuth: {},
		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("J");

			if (this.oAuth.display) {
				oRouter.getRoute(sViewName).attachPatternMatched(this.onObjectMatched, this);
			} else {
				this.getView().setVisible(false);
				oRouter.getRoute(sViewName).attachPatternMatched(this.onUnauthorizedMatched, this);
			}
		},

		onObjectMatched: function () {

			this.openBusyDialog();
			this.setupView();
		},

		onUnauthorizedMatched: function () {

			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getPageModel(sViewName), "pageModel");

			this.setSideContentSelectedKey(sViewName);

			this.onAfterRendering();

			this.closeBusyDialog();
		},

		renameColumns: function (oEvent) {

			if (!oEvent.getSource().getAggregation("items")[1]) {
				return;
			}

			let columnNames = oEvent.getSource().getAggregation("items")[1].getColumns();

			columnNames.forEach(function (column) {
				let header = column.getHeader();
				if (header.getText() === "START_TIMESTAMP") {
					header.setText(this.getResourceBundleText("jobStartTimestamp"));
				} else if (header.getText() === "END_TIMESTAMP") {
					header.setText(this.getResourceBundleText("jobEndTimestamp"));
				} else if (header.getText() === "JOB_ID") {
					header.setText(this.getResourceBundleText("colJobID"));
				} else if (header.getText() === "JOB_NAME") {
					header.setText(this.getResourceBundleText("colJobName"));
				} else if (header.getText() === "JOB_STATUS") {
					header.setText(this.getResourceBundleText("jobStatus"));
				} else if (header.getText() === "USER_ID") {
					header.setText(this.getResourceBundleText("colUser"));
				} else if (header.getText() === "IS_ONLINE_MODE") {
					header.setText(this.getResourceBundleText("colIsOnline"));
				} else if (header.getText() === "REQUEST_BODY") {
					header.setText(this.getResourceBundleText("colRequestBody"));
				} else if (header.getText() === "RESPONSE_BODY") {
					header.setText(this.getResourceBundleText("colResponseBody"));
				} else if (header.getText() === "SAP_JOB_ID") {
					header.setText(this.getResourceBundleText("colSapJobId"));
				} else if (header.getText() === "SAP_JOB_RUN_ID") {
					header.setText(this.getResourceBundleText("colSapJobRunId"));
				} else if (header.getText() === "SAP_JOB_SCHEDULE_ID") {
					header.setText(this.getResourceBundleText("colSapJobScheduleId"));
				}
			}.bind(this));
		},

		/** @function called after onInit*/
		onAfterRendering: function () {

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

		onBeforeRebindTable: function (oEvent) {

			this.renameColumns(oEvent);
		},

		formatRowHighlight: function (oValue) {

			let value = "None";

			if (oValue && oValue.toUpperCase() === "ERROR") {
				value = "Error";
			} else if (oValue && oValue.toUpperCase() === "DONE" || oValue && oValue.toUpperCase() === "SUCCESS") {
				value = "Success";
			} else if (oValue && oValue.toUpperCase() === "RUNNING") {
				value = "Warning";
			}

			return value;
		},

		onRefreshEntries: function () {

			this.oView.byId("stJobs").getTable().getBinding("items").refresh();
		},

		onViewJobLogs: function (oEvent) {

			let iJobId = oEvent.getSource().getBindingContext().getObject().JOB_ID;

			this.navTo("messages", {
				jobID: iJobId
			});
		}
	});
}, /* bExport= */ true);
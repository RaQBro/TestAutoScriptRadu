sap.ui.define([
	"./BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/v2/ODataModel",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, Filter, FilterOperator, ODataModel, ToolBarMessages) {
	"use strict";
	return Controller.extend("webapp.ui.controller.Jobs", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("jobs").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {

			this.openBusyDialog();

			this._setupView();
		},

		_setupView: function () {

			let oView = this.getView();
			oView.setModel(this.getOwnerComponent().getModel("serviceModel"));

			this.handleControlVisibleState("saveBtn", false);
			this.setSideContentSelectedKey("jobs");

			this.onAfterRendering();

			this.closeBusyDialog();
		},

		_renameColumns: function (oEvent) {

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

			this._renameColumns(oEvent);
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
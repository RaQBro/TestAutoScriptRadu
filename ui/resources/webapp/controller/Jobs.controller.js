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

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("jobs").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {

			this.openBusyDialog();

			this._setupView();
		},

		_setupView: function () {

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlVisibleState("saveBtn", false);

			var oView = this.getView();
			var oModel = new ODataModel("/service/odataService.xsodata/", {
				json: true,
				useBatch: false
			});

			var oSmartFilterBar = oView.byId("sfbJobs");
			oSmartFilterBar.setModel(oModel);
			oSmartFilterBar.setEntitySet("GetJobLogs");

			var oSmartTable = oView.byId("stJobs");
			oSmartTable.setModel(oModel);
			oSmartTable.setEntitySet("GetJobLogs");

			var oTable = oSmartTable.getTable();
			oTable.setEnableBusyIndicator(true);
			oTable.setAlternateRowColors(true);
			oTable.setGrowing(true);

			this.setSideContentSelectedKey("jobs");

			this.closeBusyDialog();
		},

		_renameColumns: function (oEvent) {

			const columnNames = oEvent.getSource().getAggregation("items")[1].getColumns();
			columnNames.forEach(function (column) {
				var header = column.getHeader();
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
		onAfterRendering: function () {},

		applyFiltersFromParameters: function () {

			var oView = this.getView();
			var oSmartTable = oView.byId("stJobs");

			var sJobName = jQuery.sap.getUriParameters().get("JOB_ID");

			if (sJobName !== null) {

				this.oTableSearchState = [];
				if (sJobName !== null) {
					this.oTableSearchState.push(new Filter("JOB_ID", FilterOperator.EQ, sJobName));
				}
				oView.byId("btnSeeAllEntries").setVisible(true);

			} else {
				oView.byId("stJobs").applyVariant({
					sort: {
						sortItems: [{
							columnKey: "START_TIMESTAMP",
							operation: "Descending"
						}]
					}
				});
			}
			oSmartTable.rebindTable();
		},

		onSmartFilterBarInitialized: function () {

			// this smart filter bar is used only to be able to apply parameters - smart filter bar is not visible
			this.applyFiltersFromParameters();

			// rebind table with filters
			var oSmartTable = this.getView().byId("stJobs");
			oSmartTable.rebindTable();
		},

		onBeforeRebindTable: function (oEvent) {

			var bindingParams = oEvent.getParameter("bindingParams");

			if (this.oTableSearchState !== undefined && this.oTableSearchState.length > 0) {
				bindingParams.filters = this.oTableSearchState;
			}

			this._renameColumns(oEvent);
		},

		formatRowHighlight: function (oValue) {

			var value = "None";

			if (oValue && oValue.toUpperCase() === "ERROR") {
				value = "Error";
			} else if (oValue && oValue.toUpperCase() === "DONE") {
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
			var jID = oEvent.getSource().getBindingContext().getObject().JOB_ID;
			this.navTo("messages", {
				jobID: jID
			});
		}
	});
}, /* bExport= */ true);
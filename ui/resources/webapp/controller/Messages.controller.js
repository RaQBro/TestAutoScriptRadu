sap.ui.define([
	"./BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/v2/ODataModel",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, Filter, FilterOperator, ODataModel, ToolBarMessages) {
	"use strict";
	return Controller.extend("webapp.ui.controller.Messages", {

		ToolBarMessages: ToolBarMessages,

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("messages").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {

			this.openBusyDialog();

			var jobID = oEvent.getParameter("arguments").jobID;

			this._setupView()
				.then(this.applyFiltersFromParameters(jobID))
				.then(this.closeBusyDialog());
		},

		_setupView: function () {

			this.oButtonPopover = this.byId("buttonMessagePopover");
			this.handleControlVisibleState("saveBtn", false);

			return new Promise(function (resolve) {
				var oView = this.getView();
				var oModel = new ODataModel("/service/odataService.xsodata/", {
					json: true,
					useBatch: false
				});

				var oSmartFilterBar = oView.byId("sfbMessages");
				oSmartFilterBar.setModel(oModel);
				oSmartFilterBar.setEntitySet("GetMessages");

				var oSmartTable = oView.byId("stMessages");
				oSmartTable.setModel(oModel);
				oSmartTable.setEntitySet("GetMessages");

				var oTable = oSmartTable.getTable();
				oTable.setEnableBusyIndicator(true);
				oTable.setAlternateRowColors(true);
				oTable.setGrowing(true);

				var sideContent = oView.getParent().getParent().getSideContent();
				var selectedKey = sideContent.getSelectedKey();
				if (selectedKey !== "messages") {
					sideContent.setSelectedKey("messages");
				}

				resolve();
			}.bind(this));

		},

		_renameColumns: function (oEvent) {
			if (!oEvent.getSource().getAggregation("items")[1]) { //columns not initialized yet
				return;
			}
			const columnNames = oEvent.getSource().getAggregation("items")[1].getColumns();
			columnNames.forEach(function (column) {
				var header = column.getHeader();
				if (header.getText() === "TIMESTAMP") {
					header.setText(this.getResourceBundleText("colTimestamp"));
				} else if (header.getText() === "JOB_ID") {
					header.setText(this.getResourceBundleText("colJobID"));
				} else if (header.getText() === "SEVERITY") {
					header.setText(this.getResourceBundleText("colSeverity"));
				} else if (header.getText() === "TEXT") {
					header.setText(this.getResourceBundleText("colText"));
				} else if (header.getText() === "DETAILS") {
					header.setText(this.getResourceBundleText("colDetails"));
				}
			}.bind(this));
		},

		/** @function called after onInit*/
		onAfterRendering: function () {},

		applyFiltersFromParameters: function (jobID) {

			var oView = this.getView();
			var oSmartTable = oView.byId("stMessages");

			var sJobName = jobID || null;

			if (sJobName !== null) {
				this.oTableSearchState = [];
				this.oTableSearchState.push(new Filter("JOB_ID", FilterOperator.EQ, sJobName));
				oView.byId("btnSeeAllEntries").setVisible(true);
				oSmartTable.rebindTable();
			} else {
				this.oTableSearchState = [];
				this.getView().byId("btnSeeAllEntries").setVisible(false);
				oSmartTable.applyVariant({
					sort: {
						sortItems: [{
							columnKey: "JOB_ID",
							operation: "Descending"
						}]
					}
				});
			}
		},

		onSmartFilterBarInitialized: function () {
			// this smart filter bar is used only to be able to apply parameters - smart filter bar is not visible
			// this.applyFiltersFromParameters();

			// rebind table with filters
			var oSmartTable = this.getView().byId("stMessages");
			oSmartTable.rebindTable();
		},

		onSeeAllEntries: function () {
			this.oTableSearchState = [];
			this.getView().byId("sfbMessages").clear();
			this.getView().byId("stMessages").applyVariant({
				sort: {
					sortItems: [{
						columnKey: "JOB_ID",
						operation: "Descending"
					}]
				}
			});
			this.getView().byId("stMessages").rebindTable();

			this.getView().byId("btnSeeAllEntries").setVisible(false);
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
			} else if (oValue && oValue.toUpperCase() === "INFO") {
				value = "Success";
			}
			return value;
		}
	});

}, /* bExport= */ true);
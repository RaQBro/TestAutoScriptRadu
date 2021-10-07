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

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("messages").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {

			let jobID = oEvent.getParameter("arguments").jobID;

			this.openBusyDialog();

			this._setupView(jobID);
		},

		_setupView: function (jobID) {

			var oView = this.getView();
			oView.setModel(this.getOwnerComponent().getModel("serviceModel"));

			this.oButtonPopover = this.byId("buttonMessagePopover");
			this.handleControlVisibleState("saveBtn", false);
			this.applyFiltersFromParameters(jobID);
			this.setSideContentSelectedKey("messages");

			this.closeBusyDialog();
		},

		_renameColumns: function (oEvent) {

			if (!oEvent.getSource().getAggregation("items")[1]) {
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
				} else if (header.getText() === "OPERATION") {
					header.setText(this.getResourceBundleText("colOperation"));
				}
			}.bind(this));
		},

		/** @function called after onInit*/
		onAfterRendering: function () {},

		applyFiltersFromParameters: function (jobID) {

			let oView = this.getView();
			let oSmartTable = oView.byId("stMessages");

			let sJobName = jobID || null;

			if (sJobName !== null) {

				this.oTableSearchState = [];
				this.oTableSearchState.push(new Filter("JOB_ID", FilterOperator.EQ, sJobName));

				this.handleControlVisibleState("btnSeeAllEntries", true);

				oSmartTable.rebindTable();
			} else {

				this.oTableSearchState = [];

				this.handleControlVisibleState("btnSeeAllEntries", false);

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

		onSeeAllEntries: function () {

			this.oTableSearchState = [];

			let oSfbMessages = this.getView().byId("sfbMessages");
			oSfbMessages.clear();
			oSfbMessages.applyVariant({
				sort: {
					sortItems: [{
						columnKey: "JOB_ID",
						operation: "Descending"
					}]
				}
			});

			oSfbMessages.rebindTable();

			this.handleControlVisibleState("btnSeeAllEntries", false);
		},

		onRefreshEntries: function () {

			let oSfbMessages = this.getView().byId("sfbMessages");

			oSfbMessages.getTable().getBinding("items").refresh();
		},

		onBeforeRebindTable: function (oEvent) {

			let bindingParams = oEvent.getParameter("bindingParams");

			if (this.oTableSearchState !== undefined && this.oTableSearchState.length > 0) {

				bindingParams.filters = this.oTableSearchState;
			}

			this._renameColumns(oEvent);
		},

		formatRowHighlight: function (oValue) {

			let value = "None";

			if (oValue && oValue.toUpperCase() === "ERROR") {
				value = "Error";
			} else if (oValue && oValue.toUpperCase() === "INFO" || oValue && oValue.toUpperCase() === "SUCCESS") {
				value = "Success";
			} else if (oValue && oValue.toUpperCase() === "WARNING") {
				value = "Warning";
			}

			return value;
		}
	});
}, /* bExport= */ true);
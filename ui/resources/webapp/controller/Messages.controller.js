sap.ui.define([
	"./BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, Filter, FilterOperator, ToolBarMessages) {
	"use strict";
	return Controller.extend("webapp.ui.controller.Messages", {

		oAuth: {},
		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("M");

			if (this.oAuth.display) {
				oRouter.getRoute("messages").attachPatternMatched(this.onObjectMatched, this);
			} else {
				this.getView().setVisible(false);
				oRouter.getRoute("messages").attachPatternMatched(this.onUnauthorizedMatched, this);
			}
		},

		onObjectMatched: function (oEvent) {

			this.openBusyDialog();

			let iJobId = oEvent.getParameter("arguments").jobID;

			this.setupView(iJobId);
		},

		onUnauthorizedMatched: function () {

			this.navTo("error");
		},

		setupView: function (iJobId) {
			const myView = "messages";
			const pageModel = "pageModel";

			this.getView().setModel(this.getPageModel(myView), pageModel);

			this.setSideContentSelectedKey("messages");

			this.applyFiltersFromParameters(iJobId);

			this.closeBusyDialog();
		},

		renameColumns: function (oEvent) {

			if (!oEvent.getSource().getAggregation("items")[1]) {
				return;
			}

			let columnNames = oEvent.getSource().getAggregation("items")[1].getColumns();

			columnNames.forEach(function (column) {
				let header = column.getHeader();
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
		onAfterRendering: function () {

			this.applyFiltersFromParameters();

		},

		applyFiltersFromParameters: function (iJobId) {

			let oView = this.getView();
			let oSmartTable = oView.byId("stMessages");

			if (iJobId !== undefined) {

				this.oTableSearchByJobId = new Filter("JOB_ID", FilterOperator.EQ, iJobId);

				this.handleControlVisibleState("btnSeeAllEntries", true);

				oSmartTable.applyVariant({
					"filter": {
						"filterItems": [{
							"columnKey": "JOB_ID",
							"operation": "EQ",
							"exclude": false,
							"value1": iJobId,
							"value2": null
						}]
					},
					sort: {
						sortItems: [{
							columnKey: "TIMESTAMP",
							operation: "Ascending"
						}]
					}
				});

			} else {

				let oExistingVariant = oSmartTable.fetchVariant();

				if (oExistingVariant !== undefined) {

					oSmartTable.applyVariant(oExistingVariant);

				} else {

					oSmartTable.applyVariant({
						sort: {
							sortItems: [{
								columnKey: "TIMESTAMP",
								operation: "Descending"
							}]
						}
					});

				}
			}

			if (oSmartTable.isInitialised()) {
				oSmartTable.rebindTable();
			}
		},

		onSeeAllEntries: function () {

			this.bSeeAllEntries = true;
			this.oTableSearchByJobId = undefined;

			let oView = this.getView();
			let oSmartTable = oView.byId("stMessages");

			oSmartTable.applyVariant({
				sort: {
					sortItems: [{
						columnKey: "TIMESTAMP",
						operation: "Descending"
					}]
				}
			});

			oSmartTable.rebindTable();

			this.handleControlVisibleState("btnSeeAllEntries", false);
		},

		onRefreshEntries: function () {

			let oView = this.getView();
			let oSmartTable = oView.byId("stMessages");

			oSmartTable.rebindTable();
		},

		onBeforeRebindTable: function (oEvent) {

			let bindingParams = oEvent.getParameter("bindingParams");

			if (this.bSeeAllEntries !== undefined && this.bSeeAllEntries === true) {

				bindingParams.filters = [];

				this.bSeeAllEntries = false;

			}

			this.renameColumns(oEvent);
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
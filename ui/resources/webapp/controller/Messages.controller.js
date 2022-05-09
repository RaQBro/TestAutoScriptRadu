sap.ui.define([
	"./BaseController",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.Messages", {

		oAuth: {},
		iJobId: undefined,
		sViewName: "messages",
		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("M");

			if (this.oAuth.display) {
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onObjectMatched, this);
			} else {
				this.getView().setVisible(false);
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onUnauthorizedMatched, this);
			}
		},

		onObjectMatched: function (oEvent) {

			this.iJobId = oEvent.getParameter("arguments").jobID;
			this.openBusyDialog();
			this.setupView();
			this.initialiseViewLogic();
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

		initialiseViewLogic: function () {

			this.applyFiltersFromParameters();
		},

		onAfterRendering: function () {

			this.applyFiltersFromParameters();
		},

		applyFiltersFromParameters: function () {

			let oView = this.getView();
			let oSmartTable = oView.byId("stMessages");

			if (this.iJobId !== undefined) {
				this.handleControlVisibleState("btnSeeAllEntries", true);

				oSmartTable.applyVariant({
					"filter": {
						"filterItems": [{
							"columnKey": "JOB_ID",
							"operation": "EQ",
							"exclude": false,
							"value1": this.iJobId,
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

		onBeforeRebindTable: function (oEvent) {

			let bindingParams = oEvent.getParameter("bindingParams");

			if (this.bSeeAllEntries !== undefined && this.bSeeAllEntries === true) {
				bindingParams.filters = [];

				this.bSeeAllEntries = false;
			}

			this.renameColumns(oEvent);
		},

		onSeeAllEntries: function () {

			let oView = this.getView();
			let oSmartTable = oView.byId("stMessages");

			this.bSeeAllEntries = true;

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
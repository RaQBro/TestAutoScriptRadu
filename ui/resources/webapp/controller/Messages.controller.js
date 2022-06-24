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
							operation: "Descending"
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
/* global _:true */
sap.ui.define([
	"./BaseController",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, BackendConnector, MessageHelpers, ToolBarMessages) {
	"use strict";

	return Controller.extend("webapp.ui.controller.DefaultValues", {

		oAuth: {},
		sViewName: "defaultValues",
		ToolBarMessages: ToolBarMessages,

		onInit: function () {

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oAuth = this.checkAuthorization("DV");

			if (this.oAuth.display) {
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onObjectMatched, this);
			} else {
				this.getView().setVisible(false);
				oRouter.getRoute(this.sViewName).attachPatternMatched(this.onUnauthorizedMatched, this);
			}
		},

		onAfterRendering: function () {},

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
			this.pageModel = this.getModel("pageModel");
			this.setSideContentSelectedKey(this.sViewName);

			this.setNoProjects();
			this.setNoCalculations();
			this.setNoVersions();
			this.setRTEValue();
			this.setCDEValue();
		},

		initialiseViewLogic: function () {

			// Get default values
			this.getDefaultValues(this.getViewName("fixedItem"));
		},

		setNoProjects: function () {

			let sNoProjectsId = "NUMBER_OF_PROJECTS";

			let oView = this.getView();
			let oNoProjectsControl = oView.byId("inProjPerjob");

			let oDefaultNoProjects = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoProjectsId;
			});

			if (oDefaultNoProjects !== null && oDefaultNoProjects !== undefined) {

				oNoProjectsControl.setValue(oDefaultNoProjects.FIELD_VALUE);
			} else {

				oNoProjectsControl.setValue("");
			}
		},

		setNoCalculations: function () {

			let sNoCalculationsId = "NUMBER_OF_CALCULATIONS";

			let oView = this.getView();
			let oNoCalculationsControl = oView.byId("inCalcPerjob");

			let oDefaultNoCalculations = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoCalculationsId;
			});

			if (oDefaultNoCalculations !== null && oDefaultNoCalculations !== undefined) {

				oNoCalculationsControl.setValue(oDefaultNoCalculations.FIELD_VALUE);
			} else {

				oNoCalculationsControl.setValue("");
			}
		},

		setNoVersions: function () {

			let sNoVersionsId = "NUMBER_OF_VERSIONS";

			let oView = this.getView();
			let oNoVersionsControl = oView.byId("inVersPerjob");

			let oDefaultNoVersions = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoVersionsId;
			});

			if (oDefaultNoVersions !== null && oDefaultNoVersions !== undefined) {

				oNoVersionsControl.setValue(oDefaultNoVersions.FIELD_VALUE);
			} else {

				oNoVersionsControl.setValue("");
			}
		},

		setRTEValue: function () {

			let oView = this.getView();
			let oRTEControl = oView.byId("txtRTE");

			let oRTE = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === "RTE";
			});

			if (oRTE !== null && oRTE !== undefined) {

				oRTEControl.setValue(oRTE.FIELD_DESCRIPTION);
			} else {

				oRTEControl.setValue("");
			}
		},

		setCDEValue: function () {

			let oView = this.getView();
			let oCDEControl = oView.byId("txtCDE");

			let oCDE = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === "CDE";
			});

			if (oCDE !== null && oCDE !== undefined) {

				oCDEControl.setValue(oCDE.FIELD_DESCRIPTION);
			} else {

				oCDEControl.setValue("");
			}
		},

		/** @function Used to saved the updated default values*/
		onSavePress: function () {
			let oView = this.getView(),
				aInputs = [
					oView.byId("inProjPerjob"),
					oView.byId("inCalcPerjob"),
					oView.byId("inVersPerjob")
				];

			let oDefaultValues = [];
			aInputs.forEach(function (oInput) {
				if (oInput.getValue() !== "") {
					let kvPair = {
						FIELD_NAME: oInput.getName(),
						FIELD_VALUE: oInput.getValue()
					};
					kvPair[oInput.getName()] = oInput.getValue();

					oDefaultValues.push(kvPair);
				}
			});

			// add the RTE KV pair separately since the control is different from a normal input
			if (oView.byId("txtRTE").getValue()) {
				oDefaultValues.push({
					FIELD_NAME: "RTE",
					FIELD_VALUE: "",
					FIELD_DESCRIPTION: oView.byId("txtRTE").getValue()
				});
			}
			if (oView.byId("txtCDE").getValue()) {
				oDefaultValues.push({
					FIELD_NAME: "CDE",
					FIELD_VALUE: "",
					FIELD_DESCRIPTION: oView.byId("txtCDE").getValue()
				});
			}

			let oController = this;

			let onSuccess = function () {

				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("succesSaveDefaultValues"), null, null, "Success",
					oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);

				// get new default values
				oController.getDefaultValues();

				// make input fields readonly
				oController.handleControlEditableState("txtRTE", false);
				oController.handleControlEditableState("txtCDE", false);
				oController.handleControlEditableState("inProjPerjob", false);
				oController.handleControlEditableState("inCalcPerjob", false);
				oController.handleControlEditableState("inVersPerjob", false);
			};
			let onError = function () {

				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorSaveDefaultValues"), null, null, "Error",
					oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};
			BackendConnector.doPost("SET_DEFAULT_VALUES", oDefaultValues, onSuccess, onError, false);
		},

		onEditPress: function () {

			if (this.oAuth.maintain === true) {

				this.pageModel.setProperty("/editEnabled", false);
				this.pageModel.setProperty("/editVisible", false);
				this.pageModel.setProperty("/cancelEnabled", true);
				this.pageModel.setProperty("/cancelVisible", true);

				this.handleControlEditableState("txtRTE", true);
				this.handleControlEditableState("txtCDE", true);
				this.handleControlEditableState("inProjPerjob", true);
				this.handleControlEditableState("inCalcPerjob", true);
				this.handleControlEditableState("inVersPerjob", true);

			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		onCancelPress: function () {

			if (this.oAuth.maintain === true) {

				this.pageModel.setProperty("/editEnabled", true);
				this.pageModel.setProperty("/editVisible", true);
				this.pageModel.setProperty("/cancelEnabled", false);
				this.pageModel.setProperty("/cancelVisible", false);
				this.pageModel.setProperty("/saveEnabled", false);

				this.handleControlEditableState("txtRTE", false);
				this.handleControlEditableState("txtCDE", false);
				this.handleControlEditableState("inProjPerjob", false);
				this.handleControlEditableState("inCalcPerjob", false);
				this.handleControlEditableState("inVersPerjob", false);

				this.setupView();
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		onChangeNoProjects: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangeNoCalculations: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangeNoCalculationVersions: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangeRichTextEditor: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		},

		onChangeCodeEditor: function () {

			this.pageModel.setProperty("/saveEnabled", true);
		}
	});
}, /* bExport= */ true);
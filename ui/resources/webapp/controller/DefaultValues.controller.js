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

		onObjectMatched: function () {

			if (!this.checkTechnicalUserPlcToken()) {

				this.createErrorDialogWithResourceBundleText("errorCheckToken");

				return;
			}

			this.openBusyDialog();
			this.setupView();
			this.initialiseViewLogic();
			this.closeBusyDialog();
		},

		onUnauthorizedMatched: function () {

			sap.ui.getCore().oAuthError = true;

			this.navTo("error");
		},

		setupView: function () {

			this.getView().setModel(this.getToolBarMessagesModel(this.sViewName), "toolBarMessagesModel");
			this.toolBarMessagesModel = this.getModel("toolBarMessagesModel");
			this.getView().setModel(this.getVisibilitySettingsModel(this.sViewName), "visibilitySettingsModel");
			this.visibilitySettingsModel = this.getModel("visibilitySettingsModel");
			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.setSideContentSelectedKey(this.sViewName);
		},

		initialiseViewLogic: function () {

			// Get default values
			this.getDefaultValues(this.getViewName("fixedItem"));

			this.setNoProjects();
			this.setNoCalculations();
			this.setNoVersions();
			this.setRTEValue();
			this.setCDEValue();
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

				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("successSaveDefaultValues"), null, null,
					"Success",
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

				this.toolBarMessagesModel.setProperty("/saveEnabled", false);
				this.toolBarMessagesModel.setProperty("/editEnabled", false);
				this.toolBarMessagesModel.setProperty("/editVisible", false);
				this.toolBarMessagesModel.setProperty("/cancelEnabled", true);
				this.toolBarMessagesModel.setProperty("/cancelVisible", true);

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

				this.toolBarMessagesModel.setProperty("/editEnabled", true);
				this.toolBarMessagesModel.setProperty("/editVisible", true);
				this.toolBarMessagesModel.setProperty("/cancelEnabled", false);
				this.toolBarMessagesModel.setProperty("/cancelVisible", false);
				this.toolBarMessagesModel.setProperty("/saveEnabled", false);

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

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onChangeNoCalculations: function () {

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onChangeNoCalculationVersions: function () {

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onChangeRichTextEditor: function () {

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onChangeCodeEditor: function () {

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
		},

		onExit: function () {

			let oDialogKey,
				oDialogValue;

			this.mViewSettingsDialogs(this.oErrorDialog);

			for (oDialogKey in this.mViewSettingsDialogs) {
				oDialogValue = this.mViewSettingsDialogs[oDialogKey];
				if (oDialogValue) {
					oDialogValue.destroy();
				}
			}

		}
	});
}, /* bExport= */ true);
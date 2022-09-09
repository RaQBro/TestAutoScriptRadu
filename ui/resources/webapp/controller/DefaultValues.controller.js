/* global _:true */
sap.ui.define([
	"./BaseController",
	"sap/ui/core/Core",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (Controller, Core, BackendConnector, MessageHelpers, ToolBarMessages) {
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

			let oView = this.getView();
			let oMessageManager = Core.getMessageManager();

			// attach handlers for validation errors
			oMessageManager.registerObject(oView.byId("inParalleljobs"), true);
			oMessageManager.registerObject(oView.byId("inProjPerjob"), true);
			oMessageManager.registerObject(oView.byId("inCalcPerjob"), true);
			oMessageManager.registerObject(oView.byId("inVersPerjob"), true);

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

			this.setNoParallelJobs();
			this.setNoProjects();
			this.setNoCalculations();
			this.setNoVersions();
			this.setRTEValue();
			this.setCDEValue();
		},

		setNoParallelJobs: function () {

			let sNoParallelJobsId = "NUMBER_OF_PARALLEL_JOBS";

			let oView = this.getView();
			let oNoProjectsControl = oView.byId("inParalleljobs");

			let oDefaultNoParallelJobs = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoParallelJobsId;
			});

			if (oDefaultNoParallelJobs !== null && oDefaultNoParallelJobs !== undefined) {

				oNoProjectsControl.setValue(oDefaultNoParallelJobs.FIELD_VALUE);
			} else {

				oNoProjectsControl.setValue("");
			}
		},

		setNoProjects: function () {

			let sNoProjectsId = "NUMBER_OF_PROJECTS_IN_ONE_JOB";

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

			let sNoCalculationsId = "NUMBER_OF_CALCULATIONS_IN_ONE_JOB";

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

			let sNoVersionsId = "NUMBER_OF_VERSIONS_IN_ONE_JOB";

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

		validateInput: function (oInput) {

			let regex = /[0-9]/;
			let sValueState = "None";
			let bValidationError = false;

			if (oInput.getValue() === null || oInput.getValue() === undefined || oInput.getValue() === "") {

				sValueState = "Error";
				bValidationError = true;
			} else {

				if (oInput.getValue().length > 2 || oInput.getValue().match(regex) === null) {

					sValueState = "Error";
					bValidationError = true;
				}
			}

			oInput.setValueState(sValueState);

			return bValidationError;
		},

		/** @function Used to saved the updated default values*/
		onSavePress: function () {

			let bValidationError = false;
			let oView = this.getView();
			let aInputs = [
				oView.byId("inParalleljobs"),
				oView.byId("inProjPerjob"),
				oView.byId("inCalcPerjob"),
				oView.byId("inVersPerjob")
			];

			let oController = this;

			// Check that mandatory (visible) fields are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				// validate only for visible input fields
				if (oInput.getVisible() === true) {
					bValidationError = oController.validateInput(oInput) || bValidationError;
				}
			}, oController);

			if (bValidationError) {

				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("validationInput"), null, null,
					"Error", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			} else {

				let oDefaultValues = [];
				aInputs.forEach(function (oInput) {
					if (oInput.getValue() !== "") {
						let kvPair = {
							FIELD_NAME: oInput.getName(),
							// set default value 1 if input field is not visible
							FIELD_VALUE: oInput.getVisible() === true ? oInput.getValue() : 1
						};
						kvPair[oInput.getName()] = oInput.getValue();

						oDefaultValues.push(kvPair);
					}
				});

				// add the RTE KV pair separately since the control is different from a normal input
				let oInputRTE = oView.byId("txtRTE");
				if (oInputRTE.getVisible() === true) {
					oDefaultValues.push({
						FIELD_NAME: "RTE",
						FIELD_VALUE: "",
						FIELD_DESCRIPTION: oView.byId("txtRTE").getValue()
					});
				}

				let oInputCDE = oView.byId("txtCDE");
				if (oInputCDE.getVisible() === true) {
					oDefaultValues.push({
						FIELD_NAME: "CDE",
						FIELD_VALUE: "",
						FIELD_DESCRIPTION: oView.byId("txtCDE").getValue()
					});
				}

				let onSuccess = function () {

					MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("successSaveDefaultValues"), null, null,
						"Success", oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);

					// get new default values
					oController.initialiseViewLogic();

					oController.toolBarMessagesModel.setProperty("/saveEnabled", false);
					oController.toolBarMessagesModel.setProperty("/editEnabled", true);
					oController.toolBarMessagesModel.setProperty("/editVisible", true);
					oController.toolBarMessagesModel.setProperty("/cancelEnabled", false);
					oController.toolBarMessagesModel.setProperty("/cancelVisible", false);

					// make input fields readonly
					oController.handleControlEditableState("txtRTE", false);
					oController.handleControlEditableState("txtCDE", false);
					oController.handleControlEditableState("inParalleljobs", false);
					oController.handleControlEditableState("inProjPerjob", false);
					oController.handleControlEditableState("inCalcPerjob", false);
					oController.handleControlEditableState("inVersPerjob", false);

				};
				let onError = function () {

					MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorSaveDefaultValues"), null, null, "Error",
						oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
				};
				BackendConnector.doPost("SET_DEFAULT_VALUES", oDefaultValues, onSuccess, onError, false);
			}
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
				this.handleControlEditableState("inParalleljobs", true);
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
				this.handleControlEditableState("inParalleljobs", false);
				this.handleControlEditableState("inProjPerjob", false);
				this.handleControlEditableState("inCalcPerjob", false);
				this.handleControlEditableState("inVersPerjob", false);

				this.initialiseViewLogic();
			} else {

				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}
		},

		onChangeNoParallelJobs: function () {

			this.toolBarMessagesModel.setProperty("/saveEnabled", true);
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
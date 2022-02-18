/* global _:true */
sap.ui.define([
	"./BaseController",
	"sap/ui/core/library",
	"webapp/ui/core/connector/BackendConnector",
	"webapp/ui/core/utils/MessageHelpers",
	"webapp/ui/toolBarMessages/ToolBarMessages"
], function (BaseController, library, BackendConnector, MessageHelpers, ToolBarMessages) {
	"use strict";

	return BaseController.extend("webapp.ui.controller.DefaultValues", {
		/**
		 * @file ConfigurationController here is logic for the Configuration view
		 */

		/** @function called when the controller is initialized
		 * gets the i18n model, creates message popover, disabling save button from footer
		 */

		ToolBarMessages: ToolBarMessages,
		oAuth: {},

		onInit: function () {

			this.oAuth = this.checkAuthorization("DV");
			if (this.oAuth.display === true) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("defaultValues").attachPatternMatched(this._onObjectMatched, this);
			} else {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}

		},

		_onObjectMatched: function () {

			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {

			this.oButtonPopover = this.byId("buttonMessagePopover");

			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", true);
			this.handleControlVisibleState("editBtn", true);

			this.setNoProjects();
			this.setNoCalculations();
			this.setNoVersions();
			this.setRTEValue();
			this.setCDEValue();

			this.setSideContentSelectedKey("defaultValues");

			this.closeBusyDialog();
		},

		/** @function called after onInit*/
		onAfterRendering: function () {},

		setNoProjects: function () {

			var sNoProjectsId = "NUMBER_OF_PROJECTS";

			var oView = this.getView();
			var oNoProjectsControl = oView.byId("inProjPerjob");

			var oDefaultNoProjects = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoProjectsId;
			});

			if (oDefaultNoProjects !== null && oDefaultNoProjects !== undefined) {

				oNoProjectsControl.setValue(oDefaultNoProjects.FIELD_VALUE);
			}
		},

		setNoCalculations: function () {

			var sNoCalculationsId = "NUMBER_OF_CALCULATIONS";

			var oView = this.getView();
			var oNoCalculationsControl = oView.byId("inCalcPerjob");

			var oDefaultNoCalculations = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoCalculationsId;
			});

			if (oDefaultNoCalculations !== null && oDefaultNoCalculations !== undefined) {

				oNoCalculationsControl.setValue(oDefaultNoCalculations.FIELD_VALUE);
			}
		},

		setNoVersions: function () {

			var sNoVersionsId = "NUMBER_OF_VERSIONS";

			var oView = this.getView();
			var oNoVersionsControl = oView.byId("inVersPerjob");

			var oDefaultNoVersions = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoVersionsId;
			});

			if (oDefaultNoVersions !== null && oDefaultNoVersions !== undefined) {

				oNoVersionsControl.setValue(oDefaultNoVersions.FIELD_VALUE);
			}
		},

		setRTEValue: function () {

			var oView = this.getView();
			var oRTEControl = oView.byId("txtRTE");

			var oRTE = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === "RTE";
			});

			if (oRTE !== null && oRTE !== undefined) {

				oRTEControl.setValue(oRTE.FIELD_DESCRIPTION);
			}
		},

		setCDEValue: function () {

			var oView = this.getView();
			var oCDEControl = oView.byId("txtCDE");

			var oCDE = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === "CDE";
			});

			if (oCDE !== null && oCDE !== undefined) {

				oCDEControl.setValue(oCDE.FIELD_DESCRIPTION);
			}
		},

		/** @function Used to saved the updated default values*/
		onSavePress: function () {
			var oView = this.getView(),
				aInputs = [
					oView.byId("inProjPerjob"),
					oView.byId("inCalcPerjob"),
					oView.byId("inVersPerjob")
				];

			var oDefaultValues = [];
			aInputs.forEach(function (oInput) {
				if (oInput.getValue() !== "") {
					var kvPair = {
						FIELD_NAME: oInput.getName(),
						FIELD_VALUE: oInput.getValue()
					};
					kvPair[oInput.getName()] = oInput.getValue();

					oDefaultValues.push(kvPair);
				}
			});

			// add the RTE KV pair separately since the control is different from a normal input
			oDefaultValues.push({
				FIELD_NAME: "RTE",
				FIELD_VALUE: null,
				FIELD_DESCRIPTION: oView.byId("txtRTE").getValue()
			});

			oDefaultValues.push({
				FIELD_NAME: "CDE",
				FIELD_VALUE: null,
				FIELD_DESCRIPTION: oView.byId("txtCDE").getValue()
			});

			var oController = this;

			var onSuccess = function () {

				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("succesSaveDefaultValues"), null, null, "Success",
					oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);

				// get new default values
				oController.getDefaultValues();
				oController.handleControlEnabledState("saveBtn", false);
				oController.handleControlEnabledState("editBtn", true);

				// make input fields readonly
				oController.handleControlEditableState("txtRTE", false);
				oController.handleControlEditableState("txtCDE", false);
				oController.handleControlEditableState("inProjPerjob", false);
				oController.handleControlEditableState("inCalcPerjob", false);
				oController.handleControlEditableState("inVersPerjob", false);

			};
			var onError = function () {

				MessageHelpers.addMessageToPopover.call(this, oController.getResourceBundleText("errorSaveDefaultValues"), null, null, "Error",
					oController.getViewName("fixedItem"), false, null, oController.oButtonPopover);
			};
			BackendConnector.doPost("SET_DEFAULT_VALUES", oDefaultValues, onSuccess, onError, false);
		},

		onEditPress: function () {

			if (this.oAuth.maintain === true) {
				this.handleControlEditableState("txtRTE", true);
				this.handleControlEditableState("txtCDE", true);
				this.handleControlEditableState("inProjPerjob", true);
				this.handleControlEditableState("inCalcPerjob", true);
				this.handleControlEditableState("inVersPerjob", true);
				this.handleControlEnabledState("editBtn", false);
			} else {
				MessageHelpers.addMessageToPopover.call(this, this.getResourceBundleText("errorNoAuth"), null, null, "Error",
					this.getViewName("fixedItem"), false, null, this.oButtonPopover);
			}

		},

		onChangeNoProjects: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeNoCalculations: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeNoCalculationVersions: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeRichTextEditor: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeCodeEditor: function () {

			this.handleControlEnabledState("saveBtn", true);
		}
	});
}, /* bExport= */ true);
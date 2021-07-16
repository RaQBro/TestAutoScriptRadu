/* global _:true */
sap.ui.define([
	"./BaseController",
	"webapp/ui/core/connector/BackendConnector"
], function (BaseController, BackendConnector) {
	"use strict";

	return BaseController.extend("webapp.ui.controller.DefaultValues", {
		/**
		 * @file ConfigurationController here is logic for the Configuration view
		 */

		/** @function called when the controller is initialized
		 * gets the i18n model, creates message popover, disabling save button from footer
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("defaultValues").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {
			this.openBusyDialog();
			this._setupView();
		},

		_setupView: function () {
			this.createMessagePopover();
			this.handleControlEnabledState("saveBtn", false);
			this.handleControlVisibleState("saveBtn", true);

			this.setNoProjects();
			this.setNoCalculations();
			this.setNoVersions();

			this.handleMessagePopover(this.aMessages);
			this.closeBusyDialog();
		},

		/** @function called after onInit*/
		onAfterRendering: function () {

		},

		setNoProjects: function () {

			var sNoProjectsId = "NUMBER_OF_PROJECTS";

			var oView = this.getView();
			var oNoProjectsControl = oView.byId("inProjPerjob");

			var oDefaultNoProjects = _.find(sap.ui.getCore().aDefaultValues, function (oDefaultValue) {
				return oDefaultValue.FIELD_NAME === sNoProjectsId;
			});

			if (oDefaultNoProjects !== null && oDefaultNoProjects !== undefined) {

				oNoProjectsControl.setValue(oDefaultNoProjects.FIELD_VALUE);
			} else {

				//oNoProjectsControl.setValue(1);

				this.handleControlEnabledState("saveBtn", true);
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
			} else {

				//oNoCalculationsControl.setValue(1);

				this.handleControlEnabledState("saveBtn", true);
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
			} else {

				//oNoVersionsControl.setValue(1);

				this.handleControlEnabledState("saveBtn", true);
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

			var oController = this;

			var onSuccess = function () {
				var sMessage = {
					type: "Success",
					title: oController.getResourceBundleText("succesSaveDefaultValues"),
					description: ""
				};
				oController.aMessages.unshift(sMessage);
				oController.handleMessagePopover(oController.aMessages);
				// get new default values
				oController.getDefaultValues();
				oController.handleControlEnabledState("saveBtn", false);
			};
			var onError = function () {
				var sMessage = {
					type: "Error",
					title: oController.getResourceBundleText("errorSaveDefaultValues"),
					description: ""
				};
				oController.aMessages.unshift(sMessage);
				oController.handleMessagePopover(oController.aMessages);
			};
			BackendConnector.doPost("SET_DEFAULT_VALUES", oDefaultValues, onSuccess, onError, false);
		},

		onChangeNoProjects: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeNoCalculations: function () {

			this.handleControlEnabledState("saveBtn", true);
		},

		onChangeNoCalculationVersions: function () {

			this.handleControlEnabledState("saveBtn", true);
		}
	});
}, /* bExport= */ true);
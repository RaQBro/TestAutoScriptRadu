sap.ui.define([], function () {
	"use strict";

	var serviceOdata = "/services.xsodata";
	var authUrl = "/extensibility/plc/token";
	var projectsGetUrl = "/extensibility/plc/get-all-projects";
	var userDetails = "/extensibility/plc/user-details";
	var jobDetails = "/scheduler/job/get-all-jobs";
	var initPlcSession = "/standard/plc/init-session";
	var plcLogout = "/standard/plc/logout-session";
	var getConfig = "/service/odataService.xsodata/configuration?$format=json";
	var getDefaultValues = "/service/odataService.xsodata/default-values?$format=json";
	var getEnvironmentVariables = "/service/odataService.xsodata/environment-variables?$format=json";
	var addNewSchedule = "/scheduler/job/add-new-schedule";
	var getToken = "/extensibility/plc/token";
	var setSecStore = "/secure/store/insert?KEY={KEY}";
	var setDefaultValues = "/extensibility/plc/maintain-default-values";
	var deleteSecStore = "/secure/store/delete?KEY={KEY}";
	var getAuthorization = "/extensibility/plc/check-authorization?ID={ID}";
	var logoutService = "/extensibility/plc/logout-service?IS_ONLINE_MODE=false";

	var mURLConstants = {
		AUTH_URL: authUrl,
		METADATA: serviceOdata + "/$metadata",
		PROJECTS: projectsGetUrl,
		GET_USER_DETAILS: userDetails,
		GET_ALL_JOBS: jobDetails,
		INIT_PLC_SESSION: initPlcSession,
		GET_CONFIGURATION: getConfig,
		GET_DEFAULT_VALUES: getDefaultValues,
		GET_ENVIRONMENT_VARIABLES: getEnvironmentVariables,
		ADD_NEW_SCHEDULE: addNewSchedule,
		LOGOUT_PLC: plcLogout,
		GET_TOKEN: getToken,
		DELETE_SEC_STORE: deleteSecStore,
		SET_DEFAULT_VALUES: setDefaultValues,
		SET_SEC_STORE: setSecStore,
		GET_AUTH: getAuthorization,
		LOGOUT_SERVICE: logoutService
	};

	return Object.freeze(mURLConstants);
});
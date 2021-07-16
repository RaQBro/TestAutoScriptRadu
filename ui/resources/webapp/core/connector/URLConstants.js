sap.ui.define([], function () {
	"use strict";

	var serviceOdata = "/services.xsodata";
	var authUrl = "/extensibility/plc/token";
	var projectsGetUrl = "/extensibility/plc/getAllProjects";
	var userDetails = "/extensibility/plc/userDetails";
	var jobDetails = "/scheduler/job/getAllJobs";
	var initPlcSession = "/standard/plc/initSession";
	var plcLogout = "/standard/plc/logoutSession";
	var getConfig = "/service/odataService.xsodata/GetConfiguration?$format=json";
	var getDefaultValues = "/service/odataService.xsodata/GetDefaultValues?$format=json";
	var getTechnicalUser = "/service/odataService.xsodata/GetTechnicalUser?$format=json";
	var addNewSchedule = "/scheduler/job/addNewSchedule";
	var getToken = "/extensibility/plc/token";
	var setSecStore = "/secure/store/insert?KEY={KEY}";
	var setDefaultValues = "/extensibility/plc/maintainDefaultValues";
	var deleteSecStore = "/secure/store/delete?KEY={KEY}";

	var mURLConstants = {
		AUTH_URL: authUrl,
		METADATA: serviceOdata + "/$metadata",
		PROJECTS: projectsGetUrl,
		GET_USER_DETAILS: userDetails,
		GET_ALL_JOBS: jobDetails,
		INIT_PLC_SESSION: initPlcSession,
		GET_CONFIGURATION: getConfig,
		GET_DEFAULT_VALUES: getDefaultValues,
		GET_TECHNICAL_USER: getTechnicalUser,
		ADD_NEW_SCHEDULE: addNewSchedule,
		LOGOUT_PLC: plcLogout,
		GET_TOKEN: getToken,
		DELETE_SEC_STORE: deleteSecStore,
		SET_DEFAULT_VALUES: setDefaultValues,
		SET_SEC_STORE: setSecStore
	};

	return Object.freeze(mURLConstants);
});
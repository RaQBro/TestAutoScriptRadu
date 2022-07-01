sap.ui.define([], function () {
	"use strict";

	let serviceOdata = "/services.xsodata";
	let appToken = "/extensibility/plc/application-token";
	let projectsGetUrl = "/extensibility/plc/get-all-projects";
	let userDetails = "/extensibility/plc/user-details";
	let jobDetails = "/scheduler/job/get-all-jobs";
	let initPlcSession = "/standard/plc/init-session";
	let plcLogout = "/standard/plc/logout-session";
	let getConfig = "/service/odataService.xsodata/configuration?$format=json";
	let getDefaultValues = "/service/odataService.xsodata/default-values?$format=json";
	let getApplicationSettings = "/service/odataService.xsodata/application-settings?$format=json";
	let addNewSchedule = "/scheduler/job/add-new-schedule";
	let checkTechnicalPlcToken = "/extensibility/plc/check-technical-plc-token";
	let getTechnicalPlcToken = "/extensibility/plc/technical-plc-token";
	let setSecStore = "/secure/store/insert?KEY={KEY}";
	let setDefaultValues = "/extensibility/plc/maintain-default-values";
	let deleteSecStore = "/secure/store/delete?KEY={KEY}";
	let getAuthorization = "/extensibility/plc/check-authorization?ID={ID}";
	let logoutService = "/extensibility/plc/logout-service?IS_ONLINE_MODE=false";
	let jobOfflineStart = "/extensibility/plc/example-service?IS_ONLINE_MODE=false";
	let jobOnlineStart = "/extensibility/plc/example-service?IS_ONLINE_MODE=true";

	let mURLConstants = {
	

		APP_TOKEN: appToken,
		METADATA: serviceOdata + "/$metadata",
		PROJECTS: projectsGetUrl,
		GET_USER_DETAILS: userDetails,
		GET_ALL_JOBS: jobDetails,
		INIT_PLC_SESSION: initPlcSession,
		GET_CONFIGURATION: getConfig,
		GET_DEFAULT_VALUES: getDefaultValues,
		GET_APPLICATION_SETTINGS: getApplicationSettings,
		ADD_NEW_SCHEDULE: addNewSchedule,
		LOGOUT_PLC: plcLogout,
		CHECK_PLC_TOKEN: checkTechnicalPlcToken,
		GET_PLC_TOKEN: getTechnicalPlcToken,
		DELETE_SEC_STORE: deleteSecStore,
		SET_DEFAULT_VALUES: setDefaultValues,
		SET_SEC_STORE: setSecStore,
		GET_AUTH: getAuthorization,
		LOGOUT_SERVICE: logoutService,
		JOB_START_OFFLINE: jobOfflineStart,
		JOB_START_ONLINE: jobOnlineStart
	};

	return Object.freeze(mURLConstants);
});
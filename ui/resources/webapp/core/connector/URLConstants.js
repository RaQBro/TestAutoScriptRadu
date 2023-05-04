sap.ui.define([], function () {
	"use strict";

	let serviceOdata = "/services.xsodata";
	let appToken = "/extensibility/plc/application-token";
	let projectsGetUrl = "/extensibility/plc/get-all-projects";
	let userDetails = "/extensibility/plc/user-details";
	let jobDetails = "/scheduler/job/get-all-jobs";
	let runningJobs =
		"/service/odataService.xsodata/job-logs?$format=json&$filter=JOB_STATUS eq 'Running' and IS_ONLINE_MODE eq 0 and JOB_ORDER_NO gt 0 &$select=JOB_ID";
	let initPlcSession = "/standard/plc/init-session";
	let checkInitPlcSession = "/extensibility/plc/check-init-plc-session";
	let plcLogout = "/standard/plc/logout-session";
	let archiveJobLogsMessages = "/extensibility/plc/archive-logs-messages?IS_ONLINE_MODE=false&ARCHIVE_DATE={DATE}";
	let getConfig = "/service/odataService.xsodata/configuration?$format=json";
	let getDefaultValues = "/service/odataService.xsodata/default-values?$format=json";
	let getApplicationSettings = "/service/odataService.xsodata/application-settings?$format=json";
	let addNewSchedule = "/scheduler/job/add-new-schedule";
	let checkTechnicalUserPlcToken = "/extensibility/plc/check-technical-user-plc-token";
	let generateTechnicalUserPlcToken = "/extensibility/plc/generate-technical-user-plc-token";
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
		GET_RUNNING_JOBS: runningJobs,
		INIT_PLC_SESSION: initPlcSession,
		CHECK_INIT_PLC_SESSION: checkInitPlcSession,
		GET_CONFIGURATION: getConfig,
		GET_DEFAULT_VALUES: getDefaultValues,
		GET_APPLICATION_SETTINGS: getApplicationSettings,
		ADD_NEW_SCHEDULE: addNewSchedule,
		LOGOUT_PLC: plcLogout,
		ARCHIVE_JOB_LOGS_MESSAGES: archiveJobLogsMessages,
		CHECK_PLC_TOKEN: checkTechnicalUserPlcToken,
		GENERATE_PLC_TOKEN: generateTechnicalUserPlcToken,
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

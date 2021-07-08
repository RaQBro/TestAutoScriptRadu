/*eslint-env node, es6 */
"use strict";

const plcBasicXsjsUrl = process.env.SAP_PLC_XSJS;
const plcBasicWebUrl = process.env.SAP_PLC_WEB;
const plcBasicPublicAppiUrl = process.env.SAP_PLC_PUBLIC_API;

class StandardPlcRoutes {

	getPlcBasicXsjsUrl() {
		return plcBasicXsjsUrl;
	}

	getPlcBasicWebUrl() {
		return plcBasicWebUrl;
	}

	getPlcBasicPublicApiUrl() {
		return plcBasicPublicAppiUrl;
	}

	getPlcAuthUrl() {
		return this.getPlcDispatcherUrl() + "/auth";
	}

	getPlcPublicApiUrl() {
		return this.getPlcBasicPublicApiUrl() + "/api/v1";
	}

	getPlcInitSessionUrl() {
		return this.getPlcDispatcherUrl() + "/init-session?language=";
	}

	getPlcDispatcherUrl() {
		return this.getPlcBasicXsjsUrl() + "/xs/rest/dispatcher.xsjs";
	}

	getPlcProjectsUrl() {
		return this.getPlcDispatcherUrl() + "/projects";
	}

	getPlcCalculationsUrl() {
		return this.getPlcDispatcherUrl() + "/calculations";
	}

}

exports.StandardPlcRoutes = module.exports.StandardPlcRoutes = StandardPlcRoutes;
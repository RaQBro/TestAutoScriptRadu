# template-application

XSA Template Application

To create a new XSA Project (naming convention: **test-project-application**)

1. First step is to fork the template from git to the new organisation repository.

2. After the fork rename the repository so that you'll not confuse them.

3. Rename file "**db\src\role\tapp_power_user.hdbrole**" from db module => xxx_power_user.hdbrole

4. **!!! Make sure you search for the exact name (Case Sensitive Search) and do not Match Whole Word !!! (right side panel in Web IDE, near the Git panel)**
	
5. **!!! Open xs-security.json file and rename the xsappname value to your application name**
	5.1 Download the xs-security.json file
	5.2	**!!! From xsa-cockpit => Organization => Space => Service Marketplace (Left Menu) =>**
	> **Authorization and Trust Management Service => Instances => New Instance**
	> Plan: **Space**
	> Next. Specify Parameters: **Add the previously downloaded file**
	> Next. Instance Name: **xxx-uaa-service**
	
6. Replace in all project files :
	6.1. Search for term "**tapp_**"  => replace all with xxx_ (e.g. tpa_ from test-project-application)
	6.2. Search for term "**tapp-**"  => replace all with xxx- (e.g. tpa- from test-project-application)	
	6.3. Replace all "**TEMPLATE_APPLICATION**" with new name (e.g. TEST_PROJECT_APPLICATION)
	6.4. Replace all "**template_application"** with new name (e.g. test_project_application)
	6.5. Replace all "**template-application**" with new name (e.g. test-project-application)
	6.6. Replace all "**Template Application**" witn new name (e.g. Test Project Application)
	6.7. Manually replace all "template_application" with new name (e.g. test_project_application) in srv/lib/service/odataService.xsodata file
	6.8. Open mta.yaml and change the type of the  **xxx-uaa-service** to org.cloudfoundry.existing-service
	**!!! Make sure to keep this change only for Local/WebIDE development - For creating the .mtar file you have to use it as below:**
	> 				  - name: xxx-uaa-service
	> 				    type: com.sap.xs.uaa-space
	> 				    parameters:
	> 				      path: ./xs-security.json
	>   			    properties:  
	> 				      service-name: '${service-name}'

8. Test app: build db module; build & run srv module; build & run ui module.

**Add Global Environment Variables (SPACE Specific) to store the plc endpoints (xsjs, publicApi and web)
!!! Can be done only with xs cli**

>Documentation:
<https://help.sap.com/viewer/6b94445c94ae495c83a19646e7c3fd56/2.0.03/en-US/6842b2e341b643d0bd912ab2df96165e.html>

>**Example from X99 - PROD space:**

>**1. logon**
> xs login -a https://x99.plc.c.eu-de-2.cloud.sap:30030 -u USER -p PASSWORD -s PROD --skip-ssl-validation
>**2. set variables**
>xs set-running-environment-variable-group '{"SAP_PLC_XSJS":"https://x99.plc.c.eu-de-2.cloud.sap:51033", >"SAP_PLC_PUBLIC_API":"https://x99.plc.c.eu-de-2.cloud.sap:51045", "SAP_PLC_WEB":"https://x99.plc.c.eu-de-2.cloud.sap:51054"}'

Testing can be done via **app_ui_endpoint + /extensibility/plc/applicationRoutes**
Ideally, if the response is empty, an error has to be thrown and the app should not be initialised

The default configuration values are stored into t_default_values table and could be changed by editing the t_default_values.csv file and then build the db module.
!!! Please note that every build of db module will update the content of the table with the values from csv file !!!
Description of default values:
>**INIT_SESSION_AT_OPEN_APP** - Set to true if init session with PLC is required at open application
>**LOGOUT_AT_CLOSE_APP** - Set to true if logout from PLC is required at close application
>**CREATE_JOBS_AUTOMATICALLY** - Set to true if job(s) are required to be created when server.js is executed for the first time

A technical user is required to execute jobs and it is stored into t_environment_variables table. The FIELD_NAME is TECHNICAL_USER and the initial value is null.
A value for TECHNICAL_USER row will be set when a technical user is maintained into secure store. **Do not set a value !!!**
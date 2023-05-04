
# XSA Testautoscriptradu

To create a new XSA Project (naming convention: **test-project-application**):

1. Create a new **repository** into the target git organization:

	> 	- Repository name: **test-project-application**
	> 	- Type: **Internal**
	> 	- **DO NOT** "Add a README file"

2. Push **Testautoscriptradu** code into the new repository:

	>  - Clone locally the empty repository
	>	```
	>	git clone https://[GitHub URL]/[Organization Name]/test-project-application.git
	>	```
	>	
	>  - Add **Testautoscriptradu** repository as remote
	>	
	>	```
	>	git remote add orig https://github.tools.sap/plc-template/TestAutoScriptRadu.git
	>	
	>	git fetch orig main
	>	
	>	git pull orig main
	>	```
	>	
	>  - Upload local repository content into the new repository:
	>	
	>	```
	>	git push -u origin main
	>	```

3. Clone the repository into **WebIDE**.

4. Rename files:

   - 4.1. "**db\src\role\tas_power_user.hdbrole**" from db module => **xxx_power_user.hdbrole**.
   - 4.2. "**db\src\role\tas_power_user_g.hdbrole**" from db module => **xxx_power_user_g.hdbrole**.

5. Replace in all project files: **!!! Make sure you search for the exact name (Case Sensitive Search) and do not Match the Whole Word !!! (right side panel in Web IDE, near the Git panel)**

   - 5.1. Search for term "**tas_**"  => replace all with xxx_ (e.g. "**tpa_**" from test-project-application)
   - 5.2. Search for term "**tas-**"  => replace all with xxx- (e.g. "**tpa-**" from test-project-application)	
   - 5.3. Replace all "**TESTAUTOSCRIPTRADU**" with new name (e.g. "**TEST_PROJECT_APPLICATION**")
   - 5.4. Replace all "**TestAutoScriptRadu"** with new name (e.g. "**test_project_application**")
   - 5.5. Replace all "**TestAutoScriptRadu**" with new name (e.g. "**test-project-application**")
   - 5.6. Replace all "**Testautoscriptradu**" with new name (e.g. "**Test Project Application**")
   - 5.7. Manually replace all "**TestAutoScriptRadu**" with the new name (e.g. "**test_project_application**") in **srv/lib/service/odataService.xsodata** file

6. Open **mta.yaml** file:

   - 6.1. For a new application (**never deployed**), in order to create the **DB Schema** with prefix name **"SAP_PLC_"** apply the following changes and **make sure you replace schema name SAP_PLC_TESTAUTOSCRIPTRADU with new name (e.g. "SAP_PLC_TEST_PROJECT_APPLICATION")**:

	> 				  - name: xxx_hdi_db
	> 				    properties:
	> 				      service-name: '${service-name}'
	> 				    type: com.sap.xs.hdi-container
	> 				    parameters:
	> 				      config:
	> 				        schema: SAP_PLC_TESTAUTOSCRIPTRADU
	> 				        makeUniqueName: true
   
   - 6.2. For **Local/WebIDE development** change the type of the  **xxx-uaa-service** to **org.cloudfoundry.existing-service**:

	> 				  - name: xxx-uaa-service
	> 				    type: org.cloudfoundry.existing-service

7. Create **XSUAA** service instance:

   - 7.1. Download the **xs-security.json** file (right-click on the file and press **Export**)
   - 7.2. From **xsa-cockpit => Organization => Space => Service Marketplace (Left Menu) => Authorization and Trust Management Service => Instances => New Instance**:
	> 	- Plan: **Space**
	> 		- Next
	> 	- Specify Parameters: Add the previously downloaded **xs-security.json** file
	> 		- Next
	> 	- Instance Name: **xxx-uaa-service**

8. **Test** application:

   - 8.1. build db module
   - 8.2. build srv module
   - 8.3. run srv module
   - 8.4. build ui module
   - 8.5. run ui module

9. For application **Deployment** before creating the **.mtar file**:

   - 9.1. Open **mta.yaml** file and change **xxx-uaa-service** resource as below:

	> 				  - name: xxx-uaa-service
	> 				    type: com.sap.xs.uaa-space
	> 				    parameters:
	> 				      path: ./xs-security.json
	> 				    properties:  
	> 				      service-name: '${service-name}'

   - 9.2. Open **ui\package.json** file and change value of **"@sap/approuter"** as below:

	> 				  "@sap/approuter": "11.2.1"

   - 9.3. Create **.mtar file**
   - 9.4. **Deploy** the application


**Add Global Environment Variables (SPACE Specific) to store the plc endpoints (xsjs, publicApi and web) !!! Can be done only with xs cli**
Documentation: <https://help.sap.com/viewer/6b94445c94ae495c83a19646e7c3fd56/2.0.03/en-US/6842b2e341b643d0bd912ab2df96165e.html>

**Example from X99 - PROD space**:
- **logon**:
  - xs login -a https://x99.plc.c.eu-de-2.cloud.sap:30030 -u USER -p PASSWORD -s PROD --skip-ssl-validation
* **set variables**:
  - xs set-running-environment-variable-group '{"SAP_PLC_XSJS":"https://x99.plc.c.eu-de-2.cloud.sap:51033", "SAP_PLC_PUBLIC_API":"https://x99.plc.c.eu-de-2.cloud.sap:51045", "SAP_PLC_WEB":"https://x99.plc.c.eu-de-2.cloud.sap:51054"}'

Testing can be done via **app_ui_endpoint + /extensibility/plc/application-routes**
Ideally, if the response is empty, an error has to be thrown, and the app should not be initialised.

The default configuration values are stored in the **t_configuration** table and could be changed by editing the **t_configuration.csv** file and then **build the db module**. !!! Please note that every build of the db module will update the content of the table with the values from **t_configuration.csv** file !!!

Description of default configuration values:
- **INIT_SESSION_AT_OPEN_APP** - Set to **true** if init session with PLC is required at open application
- **LOGOUT_AT_CLOSE_APP** - Set to **true** if logout from PLC is required at close application
- **CREATE_JOBS_AUTOMATICALLY** - Set to **true** if the job(s) are required to be created when server.js is executed for the first time
- **CHECK_TECHNICAL_USER_PLC_TOKEN** - Set to **false** if a technical user is not required for application

A technical user is required to execute jobs and is stored in the **t_application_settings** table. The FIELD_NAME is **TECHNICAL_USER**, and the initial value is **null**. A value for the TECHNICAL_USER row will be set when a technical user is maintained in the secure store. **Do not set a value !!!**


**Update the repository code with the latest changes from Testautoscriptradu**:

>	```
>	git fetch origin
>	
>	git pull origin main
>	
>	git fetch orig
>	
>	git pull orig main --no-ff
>	```
>	
>  - Resolve conflicts if exists:
>	
>	```
>	git add .
>	
>	git commit -m "Merge with Testautoscriptradu"
>	```
>	
>  - Upload local repository content into the repository:
>	
>	```
>	git push origin main
>	```

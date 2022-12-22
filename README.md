
# XSA Template Application

To create a new XSA Project (naming convention: **test-project-application**):

1. Create a new **repository** into the target git organisation:

	> 	- Repository name: **test-project-application**
	> 	- Type: **Internal**
	> 	- **Add a README file**

2. Rename the newly created **main** branch:

	> 	- Click on **main** branch
	> 	- Click on **View all branches** link
	> 	- Click on **Rename** button
	> 	- Change branch name into **master**

3. Push **Template Application** code into the new repository:

	>	```
	>	git clone https://[GitHub URL]/[Organization Name]/test-project-application.git
	>	
	>	git remote add orig https://github.tools.sap/plc-template/template-application.git
	>	
	>	git fetch orig master
	>	
	>	git pull orig master --allow-unrelated-histories
	>	```
	>	
	>  - Resolve conflicts from **README.md** file:
	>	
	>	```
	>	git add README.md
	>	
	>	git commit -m "Initial commit from Template Application"
	>	```
	>	
	>  - Upload local repository content into the new repository:
	>	
	>	```
	>	git push -u origin master
	>	```

4. Clone the repository into **WebIDE**.

5. Rename file "**db\src\role\tapp_power_user.hdbrole**" from db module => **xxx_power_user.hdbrole**.

6. Replace in all project files: **!!! Make sure you search for the exact name (Case Sensitive Search) and do not Match the Whole Word !!! (right side panel in Web IDE, near the Git panel)**
   - 6.1. Search for term "**tapp_**"  => replace all with xxx_ (e.g. "**tpa_**" from test-project-application)
   - 6.2. Search for term “**app-**”  => replace all with xxx- (e.g. "**tpa-**" from test-project-application)	
   - 6.3. Replace all "**TEMPLATE_APPLICATION**" with new name (e.g. "**TEST_PROJECT_APPLICATION**")
   - 6.4. Replace all "**template_application"** with new name (e.g. "**test_project_application**")
   - 6.5. Replace all "**template-application**" with new name (e.g. "**test-project-application**")
   - 6.6. Replace all "**Template Application**" with new name (e.g. "**Test Project Application**")
   - 6.7. Manually replace all "**template_application**" with the new name (e.g. "**test_project_application**") in **srv/lib/service/odataService.xsodata** file

7. For a new application (**never deployed**), in order to create the **DB Schema** with prefix name **"SAP_PLC_"** apply the following changes:
     - **!!! Make sure you replace schema name SAP_PLC_TEMPLATE_APPLICATION with new name (e.g. "SAP_PLC_TEST_PROJECT_APPLICATION")**

	> 				  - name: xxx_hdi_db
	> 				    properties:
	> 				      service-name: '${service-name}'
	> 				    type: com.sap.xs.hdi-container
	> 				    parameters:
	> 				      config:
	> 				        schema: SAP_PLC_TEMPLATE_APPLICATION
	> 				        makeUniqueName: true


8. Open **mta.yaml** file:
     - For **Local/WebIDE development** change the type of the  **xxx-uaa-service** to **org.cloudfoundry.existing-service**:

	> 				  - name: xxx-uaa-service
	> 				    type: org.cloudfoundry.existing-service

     - For **Deployment** before creating the **.mtar file** change **xxx-uaa-service** resource as below:

	> 				  - name: xxx-uaa-service
	> 				    type: com.sap.xs.uaa-space
	> 				    parameters:
	> 				      path: ./xs-security.json
	> 				    properties:  
	> 				      service-name: '${service-name}'

9. Create **XSUAA** service instance:
   - 8.1. Download the **xs-security.json** file (right-click on the file and press **Export**)
   - 8.2. From **xsa-cockpit => Organization => Space => Service Marketplace (Left Menu) => Authorization and Trust Management Service => Instances => New Instance**:
	> 	- Plan: **Space**
	> 		- Next
	> 	- Specify Parameters: Add the previously downloaded **xs-security.json** file
	> 		- Next
	> 	- Instance Name: **xxx-uaa-service**


10. **Test** application:
	- 10.1. build db module
	- 10.2. build srv module
	- 10.3. run srv module
	- 10.4. build ui module
	- 10.5. run ui module

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


**Update the repository code with the latest changes from Template Application**:

>	```
>	git fetch origin
>	
>	git pull origin master
>	
>	git fetch orig
>	
>	git pull orig master --no-ff
>	```
>	
>  - Resolve conflicts if exists:
>	
>	```
>	git add .
>	
>	git commit -m "Merge with Template Application"
>	```
>	
>  - Upload local repository content into the repository:
>	
>	```
>	git push origin master
>	```

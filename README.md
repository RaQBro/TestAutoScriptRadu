# template-application
XSA Template Application

To create a new XSA Project (naming convention: test-project-application)

First step is to download the template from git, or export it from the workspace. 
Then you can create a new project with the naming convention and import the archive.

Rename file "db\src\role\tapp_power_user.hdbrole" from db module => xxx_power_user.hdbrole

Search for term "tapp_"  => replace all with xxx_ (e.g. tpa_ from test-project-application) 

Replace all template_application with new name (e.g. test_project_application)

Replace all template-application with new name (e.g. test-project-application)

Replace all Template Application witn new name (e.g. Test Project Application)

Test app: build db module; build & run srv module; build & run ui module.



Add Global Environment Variables (SPACE Specific) to store the plc endpoints (xsjs, publicApi and web)
!!!Can be done only with xs cli

Documentation: 
https://help.sap.com/viewer/6b94445c94ae495c83a19646e7c3fd56/2.0.03/en-US/6842b2e341b643d0bd912ab2df96165e.html

Example from X99 - DEV space:

1. logon
xs login -a https://x99.mo.sap.corp:30030/ -u USER -p PASSWORD -s DEV --skip-ssl-validation
2. set variables
xs set-running-environment-variable-group '{"SAP_PLC_XSJS":"https://x99.mo.sap.corp:51065", "SAP_PLC_PUBLIC_API":"https://x99.mo.sap.corp:51066", "SAP_PLC_WEB":"https://x99.mo.sap.corp:64400"}'

Testing can be done via app ui_endpoint + /standard/applicationRoutes
Ideally, if the response is empty, an error has to be thrown and the app should not be initialized


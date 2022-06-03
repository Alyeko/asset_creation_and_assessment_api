-------------------------------------------------------------------------------------------
# cege0043-data-api-documentation

This is a technical report for the asset creation and condition assessment Application Programming Interface. This api(server side) together with the [client side](https://cege0043-2022-43.cs.ucl.ac.uk/bootStrap.html), enables the asset creation and condition assessment to work as required. 

This is a NodeJs Restful Data API, that helps the user to store and retrieve data. The storage is done in a postgresql database. Data from the client can be sent to the server through a post request. Data can also be retrieved from the server through a get request.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 1. System Requirements
- It is first required to be conected to the UCL VPN for the api to work. Follow the instructions [here](https://www.ucl.ac.uk/isd/services/get-connected/ucl-virtual-private-network-vpn) to do so. 
- The api makes connections to a Cent OS(Linux) server. You must use an SSH software to connect to that server. 
	- For users of the windows operating system, [Bitvise](https://www.bitvise.com/download-area) is recommended. 
	- For users of the mac operating sytem, [Cyberduck](https://cyberduck.io/download/) is recommended
	- For linux users, [this tutorial](https://www.servermania.com/kb/articles/ssh-linux/) is helpful
- The postman application is also recommended. This will help you test your endpoint which sends(post) data to the database
--------------------------------------------------------------------------------------------------------------------------------------------------------------------- 
## 2. Folder and file description
-  The following folder and files are needed for the smooth running of the api. 
-  a. **Folder**
	- **routes folder**: This folder has two js files called crud.js and geoJSON.js
		- **crud.js**: There are **4** endpoints created in crud.js which are in the table below.
		
|Endpoint name                    |Type of request |Description|Output |
|---------------------------------|----------------|------------|------|
|`getUserId`                      |Get             |Returns the user id |json
|`insertAssetPoint`               |Post            |Sends the asset information(asset_name, installation_date, latitude, longitude) to the database|-
|`insertConditionInformation`     |Post            |Sends the asset condition information(asset_name, condition_description) to the database|-
|`getNumberofAssets`              |Get             |Returns the number of assets that the user has created|json



- **geoJSON.js**: There are **10** endpoints created in geoJSON.js, which are shown in the table below. 

				
|Endpoint name                     |Type of request |Description | Output|
| ---------------------------------|----------------|------------|-------|
| `geoJSONUserId`                  |Get             |Returns the asset information(coordinates, properties, installation_date, latest_condition_report_date, condition_description) of all assets that have been saved by the user  |geojson
| `userConditionReports`           |Get |Returns the number of condition reports created by the user  |json
| `userRanking`                    |Get |Returns the user's rank based on the number of condition reports they have created  |json
| `assetsInGreatCondition`         |Get |Returns a list of all the assets with at least one report saying that they are in the best condition  |geojson
| `dailyParticipationRates`        |Get |Returns the daily reporting rates (reports_working, reports_not_working) for the past week|json
| `assetsAddedWithinLastWeek`      |Get |Returns all assets that have been added by any user within the last week(together with their corresponding properties such as asset_name, coordinates, and installation_date)|geojson
| `fiveClosestAssets`              |Get |Using the user's current location, this endpoint returns the 5 assets closest to the user added by any other user.|geojson
| `lastFiveConditionReports`       |Get |Returns the last 5 reports that the user created, and the corresponding information(coordinates, properties, condition_description)|
| `conditionReportMissing`         |Get |Returns user's assets for which no condition report exists for the past three days or more|geojson
| `topFiveScorers`                 |Get |Returns the top 5 scorers based on the number of condition reports they have created |array of json

b. **Files**
- dataAPI.js 
	- In this file, the required packages are coded, and the function for cross-domain queries is introduced. A code snippet is also written for the message which is to be returned when the address of the api is entered in to an address bar. And finally, there are code snippets to connect to the crud and geoJSON routes.
- package-lock.json
	- "The goal of package-lock.json file is to keep track of the exact version of every package that is installed so that a product is 100% reproducible in the same way even if packages are updated by their maintainers" ([source](https://nodejs.dev/learn/the-package-lock-json-file))
- .gitignore 
	-  "This file tells git which files to ignore when commiting your project to the github repository" ([source](https://www.bmc.com/blogs/gitignore/#:~:text=gitignore%20file%20tells%20Git%20which,root%20directory%20of%20your%20repo.))
---------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 3. Deployment
- Make sure you are connected to a stable wifi and the UCL VPN. 
- Connect to your SSH software, depending on your operating system. Provide the host address and port and log in with your credentials
- Clone the source code of this github api repository to the terminal in the SSH software
- In the terminal, move into the api folder by typing `cd cege0043-api-21-22-Alyeko`
- Then, start the server by typing `node dataAPI.js`
	- In your preferred web browser, check if the server is working by typing `https://cege0043-2022-43.cs.ucl.ac.uk/api`
	- To know that the server is working, the message shown on the webpage is `hello world from the Data API on port: 4480`
	- In the terminal, for a non-problematic api, a json with the following keys(`host`, `user`, `database`, `password`, `port`) are shown, with their corresponding values.
- **node vs pm2**

	- For **node**, it is adviced to use it when testing your api and its endpoints. 
		- To use node, simply use the command: `node dataAPI.js` and it can be stopped anytime by using the command `ctrl+c`
	- For **pm2**, it is adviced to use it only when, it is certain that you have gone through all the endpoints and are sure that they are all working correctly.
	   	 - With pm2, the server runs **forever**, and there is no need to start it everytime one wants to use it. 
		 - To use pm2, simply use the command `pm2 start dataAPI.js`. 
		 - To see a list of all files running with pm2, use the command `pm2 list`. A table is returned with the ids and the corresponding names of all files started with pm2
		 - The server can be stopped with pm2 by using the command `pm2 stop dataAPI.js` 
		 - To delete a file from the pm2 table, use `pm2 delete + 'the id that you want to delete'` For example:  `pm2 delete 0`, deletes the file with id 0
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 4. Testing
- To see if indeed the api is working, open a browser and type the following in the addressbar 	https://cege0043-2022-43.cs.ucl.ac.uk/api
- If you are met with `hello world from the Data API on port: 4480`, it means your api is working well. 
- While using the api, for any problems, there will be error messages in the terminal, which you can look at to find the problems. 

- **Testing the endpoints**
	- The endpoints in the tables above are tested differently based on the type of request they are. They can either be get requests or post requests.
		- For endpoints that get data from the database, they can be tested in ones favourite web browser by typing the endpoint and comparing the result to what is expected based on the output section in the table. For example, the endpoint `userRanking` returns a json containing a particluar users ranking, by passing the user_id of the rank to be obtained
		- For endpoints that send data to the database, they can be tested by using **postman**. 
			- A status 200 message means the request was successful
			- A status 400 message means the request was bad

-------------------------------------------------------------------------------------------------------------------------------------------------------------------
## 5. Code Reference 
- All SQL for the endpoints of the server side were provided by Dr. Claire Ellul and can be seen [here](https://moodle.ucl.ac.uk/pluginfile.php/4530595/mod_resource/content/2/SQL-for-assignment-2022.txt)
- There was only one endpoint(/getNumberofAssets) written by me

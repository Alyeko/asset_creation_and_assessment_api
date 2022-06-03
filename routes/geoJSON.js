var express = require('express');
var pg = require('pg');
var geoJSON = require('express').Router();
var fs = require('fs');

// get the username - this will ensure that we can use the same code on multiple machines
var os = require('os');
const userInfo = os.userInfo();
const username = userInfo.username;

console.log(username);
// locate the database login details
var configtext = ""+fs.readFileSync("/home/"+username+"/certs/postGISConnection.js");

// now convert the configuration file into the correct format -i.e. a name/value pair array
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
	var split = configarray[i].split(':');
	config[split[0].trim()] = split[1].trim();
}
var pool = new pg.Pool(config);
console.log(config);

geoJSON.route('/testGeoJSON').get(function (req,res) {
	res.json({message:req.originalUrl});
});

geoJSON.get('/postgistest', function (req,res) {
	pool.connect(function(err,client,done) {
		if(err){
			console.log("not able to get connection "+ err);
			res.status(400).send(err);
}

	client.query(' select * from information_schema.columns' ,function(err,result) {
		done();
if(err){
	console.log(err);
	res.status(400).send(err);
}
	res.status(200).send(result.rows);
});
});
});

//--------------------------------------------------endpoint for geoJSONUserId------------------------------------------------------------------------
//this endpoint obtains the user_id of the user
geoJSON.get('/geoJSONUserId/:user_id', function(req, res){
			console.log(req.params); //delete this later
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 	   
         var user_id = req.params.user_id//.split(':').slice(1)[0];
         var colnames = "asset_id, asset_name, installation_date, latest_condition_report_date, condition_description";
     
         // now use the inbuilt geoJSON functionality
          // and create the required geoJSON format using a query adapted from here:
          // http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018
          // note that query needs to be a single string with no line breaks so built it up bit by bit
         var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
          querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
          querystring += "row_to_json((SELECT l FROM (SELECT "+colnames + " ) As l      )) As properties";
          querystring += "   FROM cege0043.asset_with_latest_condition As lg ";
          querystring += " where user_id = $1 limit 100  ) As f ";
          console.log(querystring);
		  console.log(user_id);
          client.query(querystring, [user_id], function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows[0]);
           });
         });
    });


//----------------------------------SQL for advanced functionality 1----------------------------------------------------------------------------------
//----------------------------------endpoint userConditionReports-------------------------------------------------------------------------------------
//--This endpoint returns the number of condition reports they have been saved by a user--------------------------------------------------------------
geoJSON.get('/userConditionReports/:user_id', function(req, res){
			console.log(req.params); //delete this later 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 	   
			var user_id = req.params.user_id
			var querystring = "select array_to_json (array_agg(c)) from (SELECT COUNT(*) AS num_reports from cege0043.asset_condition_information where user_id = $1) c";
			console.log(querystring);
			client.query(querystring, [user_id], function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows[0]["array_to_json"][0]);
           });
         });
    });


//----------------------------------------endpoint userConditionReports----------------------------------------------------------------------------------
//--------This endpoint returns a user's ranking, based on condition reports, in comparison to all other users-------------------------------------------
geoJSON.get('/userRanking/:user_id', function(req, res){
			console.log(req.params); //delete this later 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 	   
            var user_id = req.params.user_id;
			var querystring = "select array_to_json (array_agg(hh)) from (select c.rank from (SELECT b.user_id, rank()over (order by num_reports desc) as rank";
			querystring+= " from (select COUNT(*) AS num_reports, user_id from cege0043.asset_condition_information group by user_id) b) c";
			querystring+= " where c.user_id = $1) hh";
			console.log(querystring);
			client.query(querystring, [user_id], function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows[0]["array_to_json"][0]);
           });
         });
    });


//----------------------------------SQL for advanced functionality 2----------------------------------------------------------------------------------
//----------------------------------endpoint assetsInGreatCondition-----------------------------------------------------------------------------------
//--This endpoint returns a list of all the assets with at least one report saying that they are in the best condition--------------------------------
//-- Return result as a JSON list

geoJSON.get('/assetsInGreatCondition', function(req, res){
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 	   
           	var querystring = "select array_to_json (array_agg(d)) from"
			querystring += " (select c.* from cege0043.asset_information c inner join (select count(*) as best_condition, asset_id from cege0043.asset_condition_information where"
			querystring += " condition_id in (select id from cege0043.asset_condition_options where condition_description like '%very good%')"
			querystring += " group by asset_id order by best_condition desc) b on b.asset_id = c.id) d;"

			console.log(querystring);
			client.query(querystring, function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
         });
    });


//----------------------------------endpoint dailyParticipationRates----------------------------------------------------------------------------------
//This endpoint returns a list of the daily reporting rates for the past week (how many reports have been submitted, and how many of 
//these had condition as one of the two 'not working' options) (as a menu option) return data as JSON so that it can be used in D3
//return data as JSON so that it can be used in D3. This endpoint can be used for all users and not specific to a particular user id 

geoJSON.get('/dailyParticipationRates', function(req, res){
			console.log(req.params); 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 	

			// -- REMINDER:  use  req.params.xxx;   to get the values
			var querystring = "select  array_to_json (array_agg(c)) from (select day, sum(reports_submitted) as reports_submitted, sum(not_working) as reports_not_working"
			querystring+= " from cege0043.report_summary group by day) c "
			console.log(querystring);
			client.query(querystring, function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
         });
    });


//----------------------------------endpoint assetsAddedWithinLastWeek-------------------------------------------------------------------------------
//This endpoint returns a geojson showing all the asset locations added in the last week (by any user)
geoJSON.get('/assetsAddedWithinLastWeek', function(req, res){
			console.log(req.params); 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 	
			var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
			querystring+= "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
			querystring+= "row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date) As l )) As properties"
			querystring+= " FROM cege0043.asset_information  As lg where timestamp > NOW()::DATE-EXTRACT(DOW FROM NOW())::INTEGER-7  limit 100  ) As f;"
			console.log(querystring);
			client.query(querystring, function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
         });
    });

//----------------------------------endpoint fiveClosestAssets---------------------------------------------------------------------------------------
//This endpoint returns a geojson showing 5 assets closest to the user’s current location, added by any user. 
geoJSON.get('/fiveClosestAssets/:latitude/:longitude', function(req, res){
			console.log(req.params); 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           } 
           var latitude = req.params.latitude;
           var longitude = req.params.longitude;
           var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM"; 
		   querystring+= " (SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry,";
		   querystring+= " row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date) As l )) As properties";
		   querystring+= " FROM   (select c.* from cege0043.asset_information c";
		   querystring+= " inner join (select id, st_distance(a.location, st_geomfromtext('POINT("+longitude+" "+latitude+")',4326)) as distance";
		   querystring+= " from cege0043.asset_information a order by distance asc limit 5) b on c.id = b.id ) as lg) As f";

		   console.log(querystring);
			client.query(querystring, function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
         });
    });

//----------------------------------endpoint lastFiveConditionReports-----------------------------------------------------------------------------------
//This endpoint returns a geojson with the last 5 reports that the user created. This will be colour coded on the map depending 
//on the conditition rating)
geoJSON.get('/lastFiveConditionReports/:user_id', function(req, res){
			console.log(req.params); 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           }

           var user_id = req.params.user_id;
           var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
		   querystring+= "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
		   querystring+= "row_to_json((SELECT l FROM (SELECT id,user_id, asset_name, condition_description "
		   querystring+= ") As l )) As properties FROM (select * from cege0043.condition_reports_with_text_descriptions "; 
		   querystring+= "where user_id = $1 order by timestamp desc limit 5) as lg) As f;";

		   console.log(querystring);
			client.query(querystring,[user_id], function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
         });
    });

//----------------------------------endpoint conditionReportMissing-----------------------------------------------------------------------------------
//This endpoint returns a geojson of the user's assets for which no condition report exists-----------------------------------------------------------
geoJSON.get('/conditionReportMissing/:user_id', function(req, res){
			console.log(req.params); 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           }
           var user_id = req.params.user_id;
           var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
		   querystring +=   "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
		   querystring +=   "row_to_json((SELECT l FROM (SELECT asset_id, asset_name, installation_date, latest_condition_report_date, condition_description) As l "; 
		   querystring +=   ")) As properties FROM (select * from cege0043.asset_with_latest_condition where asset_id not in ("
		   querystring +=   "select asset_id from cege0043.asset_condition_information where user_id = $1 and "
		   querystring +=   "timestamp > NOW()::DATE-EXTRACT(DOW FROM NOW())::INTEGER-3)  ) as lg) As f;";

		   console.log(querystring);
			client.query(querystring,[user_id], function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
         });
    });

//----------------------------------endpoint topFiveScorers---------------------------------------------------------------------------------------------
//This endpoint returns a json of top 5 scorers based on the number of condition reports created--------------------------------------------------------
geoJSON.get('/topFiveScorers/', function(req, res){
			console.log(req.params); 
			pool.connect(function(err,client,done) {
				if(err){
					console.log("not able to get connection "+ err);
                res.status(400).send(err);
           }
           var querystring = "select array_to_json (array_agg(c)) from ";
		   querystring+= "(select rank() over (order by num_reports desc) as rank , user_id from (select COUNT(*) AS num_reports, user_id ";
		   querystring+= "from cege0043.asset_condition_information group by user_id) b limit 5) c;";

		   console.log(querystring);
			client.query(querystring, function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows[0].array_to_json);
           });
         });
    });

module.exports = geoJSON;
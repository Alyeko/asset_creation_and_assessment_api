var express = require('express');
var pg = require('pg');
var crud = require('express').Router();
var fs = require('fs');
var os = require('os');

const userInfo = os.userInfo();
const username = userInfo.username;

console.log(username);
// locate the database login details
var configtext = ""+fs.readFileSync("/home/"+username+"/certs/postGISConnection.js");

// now convert the configruation file into the correct format -i.e. a name/value pair array
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
	var split = configarray[i].split(':');
	config[split[0].trim()] = split[1].trim();
}

var pool = new pg.Pool(config);
console.log(config);

const bodyParser = require('body-parser');
crud.use(bodyParser.urlencoded({ extended: true }));

// test endpoint for GET requests (can be called from a browser URL or AJAX)
crud.get('/testCRUD',function (req,res) {
	res.json({message:req.originalUrl+" " +"GET REQUEST"});
});
// test endpoint for POST requests - can only be called from AJAX
crud.post('/testCRUD',function (req,res) {
	res.json({message:req.body});
});

//the block of code just below obtains the user_id from the database, returns it to the webpage when the 
//getUserId endpoint is used and saves the user_id value in the user_id variable;
var user_id;
crud.get('/getUserId', function (req,res) {
	pool.connect(function(err, client, done){
		if (err){res.status(400).send(err);}
			var querystring = "select user_id from ucfscde.users where user_name = current_user;";
		console.log(querystring);
		client.query(querystring, function(err,result) {
			done();
			if(err){res.status(400).send(err);}
			res.status(200).send(result.rows[0]);
			var user_id = result.rows[0].user_id; 
			console.log(user_id); //this outputs the user_id value into the terminal
		})
	})
});
//----------------------------------Insert functionality-------------------------------------
//the block of code just below creates the endpoint. With this insertAssetPoint endpoint, the data 
//inserted into the assetForm popup on bootStrap.html is sent to the database
crud.post('/insertAssetPoint', function (req,res) {
	console.log(req.body.asset_name);
	pool.connect(function(err, client, done){
		if (err){
			console.log('Not able to get connection');
			res.status(400).send(err);}
		var asset_name = req.body.asset_name;
		var installation_date = req.body.installation_date;
		var latitude = req.body.latitude;
		var longitude = req.body.longitude;
		var location = req.body.location;

		var geometrystring = "st_geomfromtext('POINT("+req.body.longitude+ " "+req.body.latitude +")',4326)";
        var querystring = "INSERT into cege0043.asset_information (asset_name,installation_date, location) values ";
        querystring += "($1,$2,";
        querystring += geometrystring + ")";
		console.log(querystring);
		client.query(querystring,[asset_name, installation_date], function(err,result) {
			done();
			if(err)
				{res.status(400).send(err);
					console.log('The error is '+ err)}
			res.status(200).send(result);
			//res.status(200).send("Form Data "+ req.body.asset_name+ " has been inserted");
			//console.log(result);
		})
	})
});


//this block of code just below creates the endpoint insertConditionInformation which sends condition information of the 
//chosen asset to the database
crud.post('/insertConditionInformation', function (req,res) {
	pool.connect(function(err, client, done){
		if (err){
			console.log('Not able to get connection');
			res.status(400).send(err);}
		var asset_name = req.body.asset_name;
		var condition_description = req.body.condition_description;
		
		var querystring = "INSERT into cege0043.asset_condition_information (asset_id, condition_id) values (";
		querystring += "(select id from cege0043.asset_information where asset_name = $1),(select id from cege0043.asset_condition_options where condition_description = $2))";
		console.log(querystring);
		client.query(querystring, [asset_name, condition_description], function(err, result){
			done();
			if (err)
				{res.status(400).send(err);}
			res.status(200).send(result);
		})
	})
});

//this block of code just below creates the endpoint getNumberofAssets which gets the number of 
//assets that the user has created 
crud.get('/getNumberofAssets/:user_id', function (req,res) {
	pool.connect(function(err, client, done){
		if (err){res.status(400).send(err);}
			var user_id = req.params.user_id
			var querystring = "select count(*) as num_assets from cege0043.asset_information where user_id =$1;";
		console.log(querystring);
		client.query(querystring, [user_id], function(err,result) {
			done();
			if(err){res.status(400).send(err);}
			res.status(200).send(result.rows[0]);
			})
	})
});








module.exports = crud;
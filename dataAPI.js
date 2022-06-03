// express is the server that forms part of the nodejs program
var express = require('express');
var path = require("path");
var app = express();
var fs = require('fs');

// add an http server to serve files 	
var http = require('http');	var https = require('https');

// add an https server to serve files 
var httpServer = http.createServer(app);

var port = 4480;
httpServer.listen(port);

// adding CORS
//adding functionality to allow cross-domain queries
app.use(function(req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	next();
});


// app.use(function(req, res, next) {
// res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the
// //request from
// res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
// next();
// });



app.get('/',function (req,res) {
	res.send("hello world from the Data API on port: "+port);
});


// adding functionality to log the requests
app.use(function (req, res, next) {
	var filename = path.basename(req.url);
	var extension = path.extname(filename);
	console.log("The file " + filename + " was requested.");
	next();
});

const geoJSON = require('./routes/geoJSON');
app.use('/', geoJSON); //for connecting to geoJSON route

const crud = require('./routes/crud');
app.use('/', crud);  //for connecting to crud route



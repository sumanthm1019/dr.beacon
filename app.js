const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient
var bodyParser = require('body-parser');
var db;

var jsonParser = bodyParser.json();
app.use(jsonParser);

MongoClient.connect('mongodb://sumanth1019:sumanth@ds149030.mlab.com:49030/drbeacon', (err, database) => {
  
	db = database;
	app.listen(3000, function () {
	  console.log('Example app listening on port 3000!')
	})


})

	app.get('/', (req, res) => {
	


	});

	app.post('/user_profile_update', (req, res) => {
		db.collection('User_Profile').save(req.body);
	});

	app.post('/check_username', (req, res) => {
		db.collection('User_Profile').count({"_id": req.body._id}, function(err, count) {
		    if(count == 0)
		    {
		    	
		    }
		    else
		    {
		    	
		    }
		});
	});


	// Basic 404 Page
	app.use((req, res, next) => {
		var err = {
			stack: {},
			status: 404,
			message: "Error 404: Page Not Found '" + req.path + "'"
		};

		// Pass the error to the error handler below
		next(err);
	});

	// Error handler
	app.use((err, req, res, next) => {
		console.log("Error found: ", err);
		res.status(err.status || 500);

		//res.render('error', {title: 'Error', error: err.message});
	});
	// ------------------------------------------------------------------------

	// Handle killing the server
	process.on('SIGINT', () => {
		internals.stop();
		process.kill(process.pid);
	});
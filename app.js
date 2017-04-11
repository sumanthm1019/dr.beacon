const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var db;
app.use(jsonParser);

MongoClient.connect('mongodb://sumanth1019:sumanth@ds149030.mlab.com:49030/drbeacon', (err, database) => {
  
	db = database;
	app.listen(3000, function () {
	  console.log('Example app listening on port 3000!');
	})


})

app.get('/', (req, res) => {

	res.status(200).json({
	    message: 'Welcome!'
	});

});

app.post('/api/user_profile_update', (req, res) => {
	db.collection('User_Profile').save(req.body);
	db.collection('User_Profile').update({"_id" : req.body._id}, {$set: {"beacon.water" : 0 }}, {upsert : true});
	db.collection('User_Profile').find({"pollen" : true}).toArray(function(err, docs) {
	    if(docs[0] == null)
	    {
	    	db.collection('User_Profile').update({"_id" : req.body._id}, {$set: {"beacon.pollen" : false }}, {upsert : true});
	    	//update the database.

	    }
	    else
	    {
	    	db.collection('User_Profile').update({"_id" : req.body._id}, {$set: {"beacon.pollen" : true }}, {upsert : true});
	    }
	});

	db.collection('User_Profile').find({"diabetes" : true}).toArray(function(err, docs) {
	    if(docs[0] != null)
	    {
	    	db.collection('User_Profile').update({"_id" : req.body._id}, {$set: {"beacon.food.diabetes" : true }}, {upsert : true});
	    }
	});

	//Calculate BMI	
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       var ht = docs[0].height;
       var wt = docs[0].weight;
	   
	   wt  = wt * 0.45; //convert to kgs
	   ht  = ht * 0.01; //convert to metres
	   ht  = ht * ht;   //squaring from step 2
	   bmi = wt/ht;     //divide step 1 by step 3
	   console.log ("BMI");	   
	   console.log(bmi);
	   
       db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.bmi" : bmi }});
	});
	
	//Update gym, cycling and staircase information
	db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.gym" : true }});	
	db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.cycling" : true }});
	db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.gym_done" : false }});
	db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.cycling_done" : false }});
	db.collection('User_Profile').update({"_id" : req.body._id}, {$set: {"beacon.stairs" : 0 }}, {upsert : true});


	res.status(200).json({
		success: true
	});
});

/*
json response after beacon find call
{
	ignore : true/false (should application ignore this response),
	activitytype : water/food/allergy
	message: to be displayed,
	feedback : feedback message for user feedback,
	image url : image background
}
*/

/*
json response after feedback from user
{
	success : true/false (any error?)
}
*/

app.post('/api/find/1', (req, res) => {

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       var water = docs[0].beacon.water;
       if(water < 8)
       {
       		//send water fountain nearby
       		db.collection('Beacon_Data').find({"b1.name" : "Water Fountain"}).toArray(function(err, docs) {
       			res.status(200).json({ ignore: false, activitytype: "water", message : docs[0].b1.message, feedback : docs[0].b1.feedback});
       		});

       }
       else
       {
       		res.status(200).json({
       			ignore : true
       		});
       }
	});


});

app.post('/api/update/1', (req, res) => {

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       var water = docs[0].beacon.water;
       water = water + req.body.water;
       db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.water" : water }});
	});
	res.status(200).json({
	    success: true
	});

});

app.post('/api/feedback/1', (req, res) => {

	var feedback = req.body.feedback;

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
	    var water = docs[0].beacon.water;
		if(feedback)
		{
			water++;
			//update
			db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.water" : water }});

		}
	});
	res.status(200).json({
	    success: true
	});

});

app.post('/api/find/2', (req, res) => {

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       var pollen = docs[0].beacon.pollen;
       if(pollen)
       {
       		//send water fountain nearby
       		db.collection('Beacon_Data').find({"b2.name" : "Pollen Alert"}).toArray(function(err, docs) {
       			res.status(200).json({ignore : false, activitytype: "allergy", message : docs[0].b2.message, feedback : docs[0].b2.feedback});
       		});

       }
       else
       {
       		res.status(200).json({
       			ignore : true
       		});
       }
	});
});

app.post('/api/feedback/2', (req, res) => {

	var feedback = req.body.feedback;

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
		if(feedback == false)
		{
			db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.pollen" : false }});

		}
	});
	res.status(200).json({
	    success: true
	});

});



app.post('/api/find/3', (req, res) => {
	var searchkey;
	var disease;
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       searchkey = docs[0].beacon.food;

	});


	db.collection('Beacon_Data').find({"_id": "Beacon Database"}).toArray(function(err, docs) {
		var response = {};
		var obj = docs[0].b3.menu;
		for (var key in obj) {

			for (var k in obj[key])
			{
				x = {};
				x[k] = obj[key][k];

				if(JSON.stringify(x) == JSON.stringify(searchkey))
				{
					var name = obj[key].name;
					var restaurant = obj[key].restaurant;
					response[name] = restaurant;
				}

			}

		}
		var msg = "According to our experts, the following foods around you, suit you the best at this time of the day";
		res.status(200).json({ignore : false, activitytype: "food", message: msg, imageurl: "", response});

	});

	
});


app.post('/api/find/4', (req, res) => {
	var searchkey;
	var disease;
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       searchkey = docs[0].beacon.food;

	});


	db.collection('Beacon_Data').find({"_id": "Beacon Database"}).toArray(function(err, docs) {
		var response = {};
		var obj = docs[0].b4.menu;
		for (var key in obj) {

			for (var k in obj[key])
			{
				x = {};
				x[k] = obj[key][k];

				if(JSON.stringify(x) == JSON.stringify(searchkey))
				{
					var name = obj[key].name;
					var restaurant = obj[key].restaurant;
					response[name] = restaurant;
				}

			}

		}
		var msg = "According to our experts, the following foods around you, suit you the best at this time of the day";
		res.status(200).json({ignore : false, activitytype: "food", message: msg, imageurl: "", response});

	});

	
});

app.post('/api/find/5', (req, res) => {
	var searchkey;
	var disease;
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       searchkey = docs[0].beacon.food;

	});


	db.collection('Beacon_Data').find({"_id": "Beacon Database"}).toArray(function(err, docs) {
		var response = {};
		var obj = docs[0].b5.menu;
		for (var key in obj) {

			for (var k in obj[key])
			{
				x = {};
				x[k] = obj[key][k];

				if(JSON.stringify(x) == JSON.stringify(searchkey))
				{
					var name = obj[key].name;
					var restaurant = obj[key].restaurant;
					response[name] = restaurant;
				}

			}

		}
		var msg = "According to our experts, the following foods around you, suit you the best at this time of the day";
		res.status(200).json({ignore : false, activitytype: "food", message: msg, imageurl: "", response});

	});

	
});

//-------------------------------------------6.Stairs---------------------------------------------
app.post('/api/find/6', (req, res) => {
	
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {       
	   var gym_done = docs[0].beacon.gym_done;  
	   var activity_level = docs[0].activitylevel;
	   console.log("Activity="+activity_level);
       if(!gym_done && activity_level>2)
       {
       		//send gym membership nearby
       		db.collection('Beacon_Data').find({"b6.name" : "Gym"}).toArray(function(err, docs) {
       			res.status(200).json({ignore : false, activitytype: "physical", message : docs[0].b6.message, feedback : docs[0].b6.feedback});
       		});
       }
       else
       {
       		res.status(200).json({
       			ignore : true
       		});
       }
	});
});



app.post('/api/feedback/6', (req, res) => {
	var feedback = req.body.feedback;
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
	    
		if(feedback)
		{			
			//update
			db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.gym_done" : true }});
		}
	});
	res.status(200).json({
	    success: true
	});
});
//-------------------------------------------6.Gym---------------------------------------------
//-------------------------------------------7.Stairs---------------------------------------------
//Beacon 7 : Staircase
app.post('/api/find/7', (req, res) => {

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       var stairs = docs[0].beacon.stairs;
	   var bmi = docs[0].beacon.bmi;
	   var activity_level = docs[0].activitylevel;

	//Healthy
	console.log ("Activity level="+activity_level+" bmi="+bmi+" stairs="+stairs);
	if (activity_level>2) {
	   if (bmi > 19 && bmi < 25 && stairs < 1) {		  
       		//send stairs info nearby
			console.log("Healthy condition");
       		db.collection('Beacon_Data').find({"b7.name" : "Stairs"}).toArray(function(err, docs) {
       			res.status(200).json({ ignore: false, activitytype: "stairs", message : docs[0].b7.message, feedback : docs[0].b7.feedback});
				});			 
		//Overweight or Obese
	   } else if (bmi > 25 && stairs < 20) {		   
       		//send stairs info nearby
			console.log("Obese condition");
       		db.collection('Beacon_Data').find({"b7.name" : "Stairs"}).toArray(function(err, docs) {
       			res.status(200).json({ ignore: false, activitytype: "stairs", message : docs[0].b7.message, feedback : docs[0].b7.feedback});
				});		   
	   }       
       else
       {
		   console.log("Ignore condition");
       		res.status(200).json({
       			ignore : true
       		});
       }
	}
	});
});

app.post('/api/update/7', (req, res) => {

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
       var stairs = docs[0].beacon.stairs;
       stairs = stairs + req.body.stairs;
       db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.stairs" : stairs }});
	});
	res.status(200).json({
	    success: true
	});
});

app.post('/api/feedback/7', (req, res) => {

	var feedback = req.body.feedback;

	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
	    var stairs = docs[0].beacon.stairs;
		if(feedback)
		{
			stairs++;
			//update
			db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.stairs" : stairs }});

		}
	});
	res.status(200).json({
	    success: true
	});

});
//-------------------------------------------7. Stairs done---------------------------------------------
//-------------------------------------------8. Cycling---------------------------------------------
app.post('/api/find/8', (req, res) => {
	
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {       
	   var cycling_done = docs[0].beacon.cycling_done;  
	   var activity_level = docs[0].activitylevel;
	   console.log("Activity="+activity_level);
       if(!cycling_done && activity_level>2)
       {
       		//send cycle stand info
       		db.collection('Beacon_Data').find({"b8.name" : "Cycling"}).toArray(function(err, docs) {
       			res.status(200).json({ignore : false, activitytype: "physical", message : docs[0].b8.message, feedback : docs[0].b8.feedback});
       		});
       }
       else
       {
       		res.status(200).json({
       			ignore : true
       		});
       }
	});
});



app.post('/api/feedback/8', (req, res) => {
	var feedback = req.body.feedback;
	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
	    
		if(feedback)
		{			
			//update
			db.collection('User_Profile').updateOne({"_id" : req.body._id}, {$set: {"beacon.cycling_done" : true }});
		}
	});
	res.status(200).json({
	    success: true
	});
});

//-------------------------------------------8.Cycling done---------------------------------------------

app.post('/api/check_username', (req, res) => {
	db.collection('User_Profile').count({"_id": req.body._id}, function(err, count) {
	    if(count == 0)
	    {
	    	res.status(200).json({
    			account_exists: false
			});
	    }
	    else
	    {
	    	res.status(200).json({
	    	    account_exists: true
	    	});
	    }
	});
});

app.post('/api/check_login', (req, res) => {
	db.collection('User_Profile').count({"_id": req.body._id}, function(err, count) {
	    if(count == 0)
	    {
	    	res.status(200).json({
    			account_exists: false,
    			password_match: false
			});
	    }
	    else
	    {
	    	db.collection('User_Profile').find({"_id" : req.body._id}).toArray(function(err, docs) {
	    		if(docs[0].pwd == req.body.pwd)
	    		{
	    			res.status(200).json({
	    			    account_exists: true,
	    			    password_match: true
	    			});

	    		}
	    		else
	    		{
	    			res.status(200).json({
	    			    account_exists: true,
	    			    password_match: false
	    			});

	    		}
	    	});
	    	
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
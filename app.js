const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
var db;


MongoClient.connect('mongodb://sumanth1019:sumanth@ds149030.mlab.com:49030/drbeacon', (err, database) => {
  
	db = database;
	app.listen(3000, function () {
	  console.log('Example app listening on port 3000!')
	})


})


app.get('/', (req, res) => {
  db.collection('quotes').find().toArray(function(err, results) {
  console.log(results)
  // send HTML file populated with quotes here
})

});
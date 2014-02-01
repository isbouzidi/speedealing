"use strict";

var mongoose = require('mongoose'),
		elasticsearch = require('elasticsearch'),
		fs = require('fs');
//	config = require('../../config/config');

var elasticSearchClient = new elasticsearch.Client({
	hosts: [{
			protocol: "http",
			host: '127.0.0.1',
			port: '9200'
		}],
	sniffOnStart: true,
	sniffInterval: 300000,
	//log: 'trace',
	apiVersion: "0.90"
});
//config.elasticsearch);

/*setTimeout(function() {
 elasticSearchClient.close();
 }, 1000);*/

/**
 * Test elasticsearch connectivity
 */

elasticSearchClient.ping({
	requestTimeout: 1000,
	// undocumented params are appended to the query string
	hello: "elasticsearch!"
}, function(error) {
	if (error) {
		console.error('elasticsearch cluster is down!');
	} else {
		console.log('ElasticSearch is ok');
	}
});

/**
 * Create the mongoDB river to elasticsearch
 */

/*var collections = ['Societe', 'europexpress_courses', 'europexpress_vehicule'];
 
 var dbName = mongoose.connection.db.databaseName;
 
 collections.forEach(function(collection) {
 
 var riverData = {
 "type": "mongodb",
 "mongodb": {
 "db": dbName,
 "collection": collection,
 "options": {
 "secondary_read_preference": true,
 "drop_collection": true
 }
 },
 "index": {
 "name": dbName,
 "type": collection
 }
 };
 
 elasticSearchClient.createOrModifyRiver(dbName + collection, riverData)
 .on('data', function(data) {
 data = JSON.parse(data);
 console.log(data);
 })
 .on('error', function(error) {
 console.log(error);
 
 }).exec();
 });*/

module.exports = function(app, passport, auth) {

	app.post('/api/search', auth.requiresLogin, function(req, res) {

		console.log(req.body);

		var qryObj = {
			"query": {
				"term": {
					"_all": "uga"
				}
			}
		};

		var qryObj = {
			"match": {
				"_all": "uga"
			}
		};

		//elasticSearchClient.percolator(indexName, objName, qryObj)

		console.log(req.body.qry);
		console.log(req.body.collection);

		/*if (req.body.collection)
		 elasticSearchClient.search(dbName, req.body.collection, qryObj, function(err, data) {
		 var result = JSON.parse(data)
		 console.log(result);
		 res.send(200, result.hits.hits);
		 });
		 else*/
		/*	elasticSearchClient.search(dbName, "Societe", qryObj, function(err, data) {
		 var result = JSON.parse(data)
		 console.log(result);
		 res.send(200, result);
		 });*/
	});

	//other routes..
};

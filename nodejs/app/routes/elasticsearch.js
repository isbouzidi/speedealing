"use strict";

var mongoose = require('mongoose'),
		ElasticSearchClient = require('elasticsearchclient'),
		config = require('../../config/config');

var elasticSearchClient = new ElasticSearchClient(config.elasticsearch);

/**
 * 
 * Create the mongoDB river to elasticsearch
 */

var riverData = {
	"type": "mongodb",
	"mongodb": {
		"db": "chaumeil",
		"collection": "Societe",
		"options": {
			"secondary_read_preference": true,
			"drop_collection": true
		}
	},
	"index": {
		"name": "chaumeil",
		"type": "Societe"
	}
};

elasticSearchClient.createOrModifyRiver('chaumeilSociete', riverData)
		.on('data', function(data) {
	data = JSON.parse(data);
	console.log(data);
})
		.on('error', function(error) {

}).exec();

var riverData2 = {
	"type": "mongodb",
	"mongodb": {
		"db": "chaumeil",
		"collection": "Commande",
		"options": {
			"secondary_read_preference": true,
			"drop_collection": true
		}
	},
	"index": {
		"name": "chaumeil",
		"type": "Commande"
	}
};

elasticSearchClient.createOrModifyRiver('chaumeilCommande', riverData2)
		.on('data', function(data) {
	data = JSON.parse(data);
	console.log(data);
})
		.on('error', function(error) {

}).exec();

module.exports = function(app, passport, auth) {

	app.get('/api/search/:collection', auth.requiresLogin, function(req, res) {

		var qryObj = {
			"query": {
				"term": {name: "D*"}
			}
		};

		//console.log(req.params.collection);
		//elasticSearchClient.nodesInfo([], function(err, data) {
		elasticSearchClient.search(mongoose.connection.db.databaseName, req.params.collection, qryObj, function(err, data) {
			console.log(JSON.parse(data))
		});
		//object.read(req, res);
		return;
	});

	//other routes..
};

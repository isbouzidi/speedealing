"use strict";

var mongoose = require('mongoose'),
		config = require('../../config/config');

var Dict = require('../controllers/dict')

module.exports = function(app, passport, auth) {

	app.get('/api/dict', auth.requiresLogin, function(req, res) {
		Dict.dict(req.query, function(err, dict){
			if(err) {
				console.log(err);
				res.send(500);
			}
			res.json(dict);
				
		});
	});
	
	app.get('/api/extrafield', auth.requiresLogin, function(req, res) {
		Dict.extrafield(req.query, function(err, extrafield){
			if(err) {
				console.log(err);
				res.send(500);
			}
			res.json(extrafield);
		});
	});

	//other routes..
};

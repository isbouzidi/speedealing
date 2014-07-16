"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		timestamps = require('mongoose-timestamp');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var UserModel = mongoose.model('user');


module.exports = function(app, passport, auth) {

	var google = new Google();

	app.get('/api/google/test', auth.requiresLogin, google.test);

};

function Google() {
}

Google.prototype = {
	test: function(req, res) {
	//	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.send("Hello world");
		
	}
};

"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		timestamps = require('mongoose-timestamp');

var googleapis = require('googleapis');
var OAuth2Client = googleapis.auth.OAuth2;

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var UserModel = mongoose.model('user');

var config = require(__dirname + '/../../config/config');

var GOOGLE_CLIENT_ID = config.google.clientID,
	GOOGLE_CLIENT_SECRET = config.google.clientSecret,
	// TODO : generate redirect url ?
	GOOGLE_REDIRECT_URL = config.google.callbackURL;


module.exports = function(app, passport, auth) {

	var google = new Google();

	app.get( '/api/google/ping', auth.requiresLogin, google.ping);

	app.post('/api/google/import', auth.requiresLogin, google.import);

	// The user wants to authorize the application to access to his account
	app.get( '/api/google/authorize', auth.requiresLogin, google.authorize);

	app.get( '/api/google/oauth2callback', auth.requiresLogin, google.oauth2callback)


	//oauth2tokencallback
};


// ********************************************

var oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REDIRECT_URL);

function Google() {
}

Google.prototype = {
	ping: function(req, res) {
	//	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.send("Hello world !");
	},

	authorize : function(req, res) {
		// generate consent page url
	    var url = oauth2Client.generateAuthUrl({
	        access_type: 'offline', // will return a refresh token
	        approval_prompt: 'force',
	        scope: 'https://www.googleapis.com/auth/plus.me'
	    });

		res.send("<a href='" + url + "'>Give access to google account !</a>");
	},

	import: function(req, res) {
		// res.send("import contacts ");

		//console.log(query);

		UserModel.findOne({'name': 'admin'}, function(err, doc) {
			if (err) {
				res.send("Error");
				return;
			}
			console.log(doc);
			res.send( doc );
			
		});
	},

	oauth2callback: function(req, res) {
		console.log(req.query);
		var code = req.query.code;

		// request access token
        oauth2Client.getToken(code, function(err, tokens) {
            // set tokens to the client
            oauth2Client.setCredentials(tokens);
            console.log("Err = ");
            console.log(err);
            console.log("Tokens = ");
            console.log(tokens);
            
        });

		res.send("oauth2callback <br/> code = " + code);
	}

};

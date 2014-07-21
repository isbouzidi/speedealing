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

var GoogleContacts = require('my-google-contacts').GoogleContacts;

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
		var scopes = [
		  'https://www.googleapis.com/auth/userinfo.profile',
		  'https://www.googleapis.com/auth/contacts'
		];

		// generate consent page url
	    var url = oauth2Client.generateAuthUrl({
	        access_type: 'offline', // will return a refresh token
	        approval_prompt: 'force',
	        scope: scopes.join(' ')
	    });

		res.send("<a href='" + url + "'>Hello " + req.user.name + ", give access to google account !</a>");
	},

	

	oauth2callback: function(req, res) {
		console.log(req.query);
		var code = req.query.code;

		// request access token
        oauth2Client.getToken(code, function(err, tokens) {
            if (err) {
            	console.log("Google - ", err);
            	return;
            }
            // set tokens to the client
            oauth2Client.setCredentials(tokens);
            
            console.log("Tokens = ");
            console.log(tokens);

            googleapis.discover('oauth2', 'v2')
            .execute(function(err, client) {

            	if (err)
            		console.log("Google - ", err);


            	client.oauth2.userinfo.v2.me.get()
            	.withAuthClient(oauth2Client)
            	.execute(function (err, userinfo) {

            		if (err)
            			console.log("Google - ", err);

            		console.log("userinfo ", userinfo);

            		var user = req.user;
			        user = _.extend(user, 
			        {
		            	"google": {
		            		"user_id": userinfo.id,
		            		"tokens": tokens
		            	}
		            });
			        
			        user.save(function(err, doc) {
			            if (err) {
			                return console.log(err);
			            }
			            console.log("update");
			        });

            	});
            }); 
		});

		res.send("oauth2callback <br/> code = " + code);
	},



	import: function(req, res) {

		var stream = UserModel.find().stream();

		stream.on('data', function (user) {
		  // do something with the mongoose document
		  console.log("Scan user : " + user._id);

		  if (_isGoogleEmail(user.email)) {

		  	console.log("User.google", user.google);
		  	
		  	if (_hasGrantedAccess(user)) {
		  		console.log("Treat user : " + user._id + " - " + user.email);
		  		_treatGoogleUser(user);
		  	} else {
		  		console.log("    no access");
		  	}
		  } else {
		  	console.log("    no gmail");
		  }

		}).on('error', function (err) {
		  // handle the error
		  console.log("Stream err", err);
		}).on('close', function () {
		  // the stream is closed
		});

		res.send("google.import : done");
	}

};




function _isGoogleEmail(email) {
	return (email.toLowerCase().indexOf("@gmail.com") != -1)
}


function _hasGrantedAccess(user) {
	return (user.google.tokens.access_token &&
		user.google.tokens.refresh_token &&
		user.google.user_id);
}

function _refreshGoogleTokens(user) {

	oauth2Client.setCredentials(user.google.tokens);

	// execute a request to obtain 
	// new access token if the current
	// access token has expired
	googleapis
	.discover('oauth2', 'v2')
	.execute(function(err, client) {

		if (err)
			console.log("Google - ", err);

		client.oauth2.userinfo.v2.me.get()
		.withAuthClient(oauth2Client)
		.execute(function (err, userinfo) {

			if (err)
				console.log("Google - ", err);

			//console.log("userinfo.name ", userinfo.name);

			console.log("Credentials", oauth2Client.credentials);

			var new_access_token = oauth2Client.credentials.access_token;

			if (new_access_token && 
				new_access_token != user.google.tokens.access_token) {
				// update user's access token in database
				
		        user = _.extend(user, 
		        {
	            	"google": {
	            		"tokens": {
	            			"access_token": new_access_token
	            		}
	            	}
	            });
		        
		        user.save(function(err, doc) {
		            if (err) {
		                return console.log(err);
		            }
		            console.log("Google - access token updated");
		        });

			}

		});
	}); 


}




/* @return contacts
*/
function _getGoogleContacts(user) {

	var result_contacts = [];

	var c = new GoogleContacts({
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: user.google.tokens.access_token,
		refreshToken: user.google.tokens.refresh_token,
	});

	c.getContacts({
		//email: 'etudiant.beaumont@gmail.com'
		email: user.email

	}, function(err, contacts) {
		if (err) {
			console.log("Google - ", err);
		} else {
			console.log(contacts);
			console.log(contacts.length);
		}
	});
	
	// c.getContactGroups('thin', 200);


}

function _treatGoogleUser(user) {
	_refreshGoogleTokens(user);

	var contacts = _getGoogleContacts(user);
}


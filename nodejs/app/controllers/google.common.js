"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		timestamps = require('mongoose-timestamp'),
		xml2js = require('xml2js'),
		array = require("array-extended"),
		dateFormat = require("dateformat"),
		googleapis = require('googleapis'),
		async = require("async");

    // Mongoose models
	var SocieteModel = mongoose.model('societe');
	var ContactModel = mongoose.model('contact');
	var UserModel = mongoose.model('user');

	// Global google configuration
	var config = require(__dirname + '/../../config/config');

	var GOOGLE_CLIENT_ID = config.google.clientID,
		GOOGLE_CLIENT_SECRET = config.google.clientSecret,
		GOOGLE_REDIRECT_URL = config.google.callbackURL;

	var OAuth2Client = googleapis.auth.OAuth2;
	var oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URL);

/* Public declaration methods. See definition for documentation. */
exports.generateAuthUrl = generateAuthUrl;

exports.isGoogleUser = isGoogleUser;

//exports.isGoogleUserAndHasGrantedAccess =
//		isGoogleUserAndHasGrantedAccess;

exports.setAccessCode = setAccessCode;

exports.googleAction = googleAction;

exports.getDefaultGoogleContactsParams =
		getDefaultGoogleContactsParams;

exports.forEachGoogleUser = forEachGoogleUser;


/* Methods definitions. */


function _arr_contains(array_in, element) {
	return array_in.indexOf(element) >= 0;
}

/* Generate url to google service to
* request user consent to give access for our app.
* @param submodules Array with module's name to enable.
* @return url where to redirect the user
*/
function generateAuthUrl(submodules) {
	var scopes = [
	  'https://www.googleapis.com/auth/userinfo.profile',
	];

	if (_arr_contains(submodules,'contacts'))
		scopes.push('https://www.googleapis.com/auth/contacts');
	
	if (_arr_contains(submodules, 'tasks')) {
		scopes.push('https://www.googleapis.com/auth/tasks');
		scopes.push('https://www.googleapis.com/auth/tasks.readonly');
	}
	
	if (_arr_contains(submodules, 'calendar')) {
		scopes.push('https://www.googleapis.com/auth/calendar');
		scopes.push('https://www.googleapis.com/auth/calendar.readonly');
	}
		
	// generate consent page url
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // will return a refresh token
        approval_prompt: 'force',
        scope: scopes.join(' ')
    });
	return url;
}



function isGoogleUser(user) {
	return (user.google.user_id 
			&& user.google.sync
			&& user.google.tokens.access_token
			&& user.google.tokens.refresh_token);
}


//function isGoogleUserAndHasGrantedAccess(user) {
//	return (user.google.user_id && user.google.tokens.access_token);
//}






function setAccessCode(code, user, callback) {

	// request access token
    oauth2Client.getToken(code, 
    	function(err, tokens) {
				if (err) {
					console.log("getTokenError. Code : " + code);
        		return callback(err);
        	
				}
	        // set tokens to the client
	        oauth2Client.setCredentials(tokens);
	        console.log("Tokens =", tokens);
	        
	        // Get the google user id
	        googleapis.discover('oauth2', 'v2')
	        .execute(
	        	function(err, client) {
		        	if (err)
		        		return callback(err);

		        	client.oauth2.userinfo.v2.me.get()
		        	.withAuthClient(oauth2Client)
		        	.execute(
		        		function (err, userinfo) {
			        		if (err)
			        			return callback(err);

			        		console.log("userinfo ", userinfo);

					        user = _.extend(user, 
					        {
				            	"google": _.extend(user.google,
								{
									"user_id": userinfo.id,
					            	"tokens": tokens
								})
				            });
					        
					        user.save(function(err, doc) {
					            callback(err);
					        });
	        			}
	        		);
	        	}
	        ); 
		}
	);
}





function googleAction (user, strategy, callback) {
	if (!isGoogleUser(user))
		return callback(new Error("The user isn't a google user or he doesn't granted access."));

	async.series([
			function (cb) {
				refreshGoogleTokens(user, cb);
			},
			strategy
		],
		callback
	);
}




function getDefaultGoogleContactsParams (user) {
	return {
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: user.google.tokens.access_token,
		refreshToken: user.google.tokens.refresh_token,
	};
}


function refreshGoogleTokens (user, callback) {
	oauth2Client.setCredentials(user.google.tokens);

	oauth2Client.refreshAccessToken(
		function(err, tokens) {
			if (err)
				return callback(err);

			var new_access_token = oauth2Client.credentials.access_token;
			if (new_access_token != user.google.tokens.access_token) {
				// update user's access token in database

				user.google = _.extend(user.google,
				{
					"tokens": {
	        			"access_token": new_access_token,
	        			"refresh_token": user.google.tokens.refresh_token
	        		}
				});

					user.save(function(err, doc) {
						callback(err);
					});
			} else { // no need to update
				callback(null);
			}
		}
	);	
}





function forEachGoogleUser(iterator, callback) {
	var googleUsers = [];

	var stream = UserModel.find().stream();
	stream.on('data', function (user) {
		console.log(">> Scan user : " + user._id);

		if (isGoogleUser(user)) {
			console.log("Treat user : " + user._id + " - " + user.email);
			googleUsers.push(user);
		} 

		//console.log("");
	}).on('error', function (err) {
		callback(err);
	}).on('close', function () {
		async.each(googleUsers,
				   iterator,
				   callback);
	});
}




"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		timestamps = require('mongoose-timestamp'),
		xml2js = require('xml2js');

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

	app.post('/api/google/test_import', auth.requiresLogin, google.test_import);
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
		/* 
		 * For each user
		 *     If he has a google email
		 *     and has granted access, then
		 *         Get all his google contact list
		 *         For each contact
		 *             Merge him into Contact database
		 */
		
		var status = 'success';
		var msg_error = '';
		var nb_user_treated = 0;

		var stream = UserModel.find().stream();
		stream.on('data', function (user) {
		  console.log(">> Scan user : " + user._id);

		  if (_isGoogleEmail(user.email)) {

		  	//console.log("User.google", user.google);
		  	
		  	if (_hasGrantedAccess(user)) {
		  		console.log("Treat user : " + user._id + " - " + user.email);
		  		
		  		_treatGoogleUser(user);
		  		
		  		nb_user_treated++;

		  	} else {
		  		console.log("    no access");
		  	}
		  } else {
		  	console.log("    no gmail");
		  }

		  console.log("");

		}).on('error', function (err) {
		  // handle the error
		  console.log("Stream err", err);
		  status = 'error';
		  msg_error = err.toString();

		}).on('close', function () {
		  // the stream is closed

		  var json_response = {
				status: status, // 'success' or 'error' 
				error: msg_error,
				// number of user treated (with granted google account)
				treated: nb_user_treated
			};

			console.log(json_response);
			res.send( (status=='success')? 200 : 500, 
				json_response);
		});


		
	},


	test_import: function(req, res) {
		ContactModel.find({email: 'devtestglobuloz@gmail.com'},
			function (err, contacts){
				console.log(contacts);		
			});
		

		res.send("ok");
	}

};


/*
 * ****************** IMPORT ************************************************************
 */



function _isGoogleEmail(email) {
	return (email.toLowerCase().indexOf("@gmail.com") != -1)
}


function _hasGrantedAccess(user) {
	return (user.google.tokens.access_token &&
		user.google.tokens.refresh_token &&
		user.google.user_id);
}

function _refreshGoogleTokens(user, callback) {

	oauth2Client.setCredentials(user.google.tokens);

	// execute a request to obtain 
	// new access token if the current
	// access token has expired
	googleapis
	.discover('oauth2', 'v2')
	.execute(function(err, client) {

		if (err)
			return callback(err);

		client.oauth2.userinfo.v2.me.get()
		.withAuthClient(oauth2Client)
		.execute(function (err, userinfo) {

			if (err)
				return callback(err);


			//console.log("userinfo.name ", userinfo.name);
			//console.log("Credentials", oauth2Client.credentials);

			var new_access_token = oauth2Client.credentials.access_token;
			console.log("Old access_token = ", user.google.tokens.access_token);
			console.log("New access_token = ", new_access_token);

			if (new_access_token != user.google.tokens.access_token) {
				// update user's access token in database
				
		        user = _.extend(user, 
		        {
	            	"google": {
	            		"user_id": user.google.user_id,
	            		"tokens": {
	            			"access_token": new_access_token,
	            			"refresh_token": user.google.tokens.refresh_token
	            		}
	            	}
	            });
		        
		        user.save(function(err, doc) {
		            if (err) {
		                callback(err);
		            } else {
		            	console.log("Google - access token updated");
		            	callback(null);
		            }
		        });

		        
			} else {
				callback(null);
			}
		});
	}); 
}




/* 
*/
function _getGoogleContacts(user, callback) {

	var c = new GoogleContacts({
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: user.google.tokens.access_token,
		refreshToken: user.google.tokens.refresh_token,
	});

	c.getContacts({
		email: user.email
	}, function(err, contacts) {
		if (err) {
			console.log("Google error - ", err);
		} else {
			console.log("_getGoogleContacts ; contacts = ");
			console.log(contacts);
			console.log(contacts.length);
			callback(contacts);
		}
	});
}

/* Merge native contact with imported contact
 * @param contact Native contact
 * @param icontact Imported contact
 */
function _updateContact(contact, icontact) {

	 contact = _.extend(contact, icontact);

	 console.log("Contact to up/ins. = ", contact);

	// contact.firstname	= contact.firstname || icontact.firstname;
	// contact.lastname	= contact.lastname || icontact.lastname;
	// contact.email		= contact.email || icontact.email;
	// contact.phone		= contact.phone || icontact.phone;
	// contact.organization 	= contact.organization || icontact.organization;
	// console.log("icontact.organization ", icontact.organization);

	contact.save(function(err, doc) {
		if (err)
			console.log(err);
		else
			console.log("Contact updated/inserted - ", doc);
	});

}

/* @param icontact Imported contact
 * @param else_callback Function to call if can't merge
*/
function _mergeOneByEmail(icontact, else_callback) {
	
	if (icontact.email) {
		ContactModel.find({email: icontact.email},
		function (err, contacts) {
			if (contacts.length > 0) { 
				for (var i = 0; i < contacts.length ; ++i) {
					_updateContact(contacts[i], icontact);
				}					
			} else { // no result
				else_callback(icontact);
			}
		});
	} else {
		else_callback(icontact);
	}
}

/* @param icontact Imported contact
 * @param else_callback Function to call if can't merge
*/
function _mergeOneByPhone(icontact, else_callback) {
	if (icontact.phone) {
		ContactModel.find({phone: icontact.phone},
		function (err, contacts) {
			if (contacts.length > 0) { 
				for (var i = 0; i < contacts.length ; ++i) {
					_updateContact(contacts[i], icontact);
				}					
			} else { // no result
				else_callback(icontact);
			}
		});
	} else {
		else_callback(icontact);
	}
}

/* @param icontact Imported contact
*/
function _insertNewContact(icontact) {
	var contact = new ContactModel({});
	_updateContact(contact, icontact);
}

/* @param icontact Imported contact
*/
function _mergeOneContact (icontact) {
	_mergeOneByEmail(icontact,
		function (icontact) {
			_mergeOneByPhone(icontact, _insertNewContact);
		}
	);
}

/* @param icontacts Imported contacts
*/
function _mergeImportedContacts(icontacts) {
	var ic_length = icontacts.length;
	
	for(var i = 0; i < ic_length; ++i) {
		_mergeOneContact(icontacts[i]);		
	}
}



/* Main function to treat a google user 
*/
function _treatGoogleUser(user) {
	_refreshGoogleTokens(user, 
		function (err) {
			if (err)
				console.log("Google error - ", err);
			else
				_getGoogleContacts(user, _mergeImportedContacts);	
		}
	);
}









/*
 * ****************** EXPORT ***********************************************************
 */



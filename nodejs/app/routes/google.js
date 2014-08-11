"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		timestamps = require('mongoose-timestamp'),
		xml2js = require('xml2js'),
		array = require("array-extended"),
		dateFormat = require("dateformat");

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

	app.post('/api/google/import', auth.requiresLogin, google.import);

	// The user wants to authorize the application to access to his account
	app.get( '/api/google/authorize', auth.requiresLogin, google.authorize);

	app.get( '/api/google/oauth2callback', auth.requiresLogin, google.oauth2callback)

	app.post('/api/google/export', auth.requiresLogin, google.export);

	app.post('/api/google/test', auth.requiresLogin, google.test);
};


// ********************************************

var oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REDIRECT_URL);

function Google() {
}

Google.prototype = {

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

            		var google = _.extend(user.google,
					{
						"user_id": userinfo.id,
		            	"tokens": tokens,
					});

			        user = _.extend(user, 
			        {
		            	"google": google
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

	export: function(req, res) {
		// pour tout user (ayant changé de société)
		// 		lister les contacts google avec leurs id
		//		si le user a accès à ce contact 
		//		(car le contact appartient à la société dont le commercial est le user),
		//			on le laisse
		//		sinon
		//			on supprime le contact

		// pout tout user
		//     lister ses contacts google
		//         (théorique) si le contact n'est pas trouvé ou n'est pas associé à une socité
		//            on le laisse
		//         sinon (il est associé à une société)
		//            on le supprime
		//     
		//     lister les sociétés
		//         si le user est commercial_id
		//             lister les contacts de la société
		//                  insérer les contacts dans google

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
		  		
		  		var params = {
		  			user: user
		  		};

		  		_exp_treatGoogleUser(params);
		  		
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

	test: function(req, res) {
		
		res.send("ok");
	}

};


/* *** */

function _isGoogleEmail(email) {
	return (email.toLowerCase().indexOf("@gmail.com") != -1)
}

function _hasGrantedAccess(user) {
	return (user.google.tokens.access_token &&
		user.google.tokens.refresh_token &&
		user.google.user_id);
}

/*
 * ****************** IMPORT ************************************************************
 */


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

				var google = _.extend(user.google,
				{
					"tokens": {
            			"access_token": new_access_token,
            			"refresh_token": user.google.tokens.refresh_token
            		}
				});
				
		        user.google = google;
		        
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
	console.log("\n\n*** GETTING CONTACTS PROCESS ***\n\n");

	var c = new GoogleContacts({
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: user.google.tokens.access_token,
		refreshToken: user.google.tokens.refresh_token,
		updatedMin: user.google.contacts.latestImport
	});

	c.getContacts({
		email: user.email
	}, function(err, contacts) {
		if (err) {
			console.log("Google error - ", err);
		} else {
			// console.log("_getGoogleContacts ; contacts = ");
			// console.log(contacts);
			// console.log(contacts.length);
			callback(user, contacts);
		}
	});
}

/* *** */



/* Input array need to be sorted.
* @param arr_in Array to treat. Not changed.
* @param result array
*/
function _array_unique(arr_in, fct_are_equal) {
    var len = arr_in.length;
    if (len < 2)
        return arr_in;
    var result = [];
    for (var i=0; i < len; ) {
        result.push(arr_in[i]);

        var j = i+1;
        while(j < len && fct_are_equal(arr_in[i], arr_in[j]))
            ++j;

        i = j;
    }
    return result;
}

/* Merge native contact with imported contact
 * @param contact Native contact
 * @param icontact Imported contact
 */
function _updateContact(contact, icontact) {

	var emails = [];

	if (icontact.emails) {
        emails = _array_unique(
            array(icontact.emails).union(contact.emails).sort("address").value()
            
            ,function (a, b) {
                return a.address == b.address && a.type == b.type;
            });
    } else {
    	emails = contact.emails;
    }

    contact = _.extend(contact, icontact);
    contact.emails = emails;

	console.log("Contact to up/ins. = ", contact);

	contact.save(function(err, doc) {
		if (err)
			console.log(err);
		// else
		 //	console.log("Contact updated/inserted - ", doc, "\n");
	});
}

function _updateContacts(contacts, icontact) {

	if (contacts && contacts.length > 0) { 
		for (var i = 0; i < contacts.length ; ++i) {
			_updateContact(contacts[i], icontact);
		}	
		return true;				
	} else { // no result
		return false;
	}
}


/* @param icontact Imported contact
*/
function _insertNewContact(icontact) {
	console.log("INSERT NEW CONTACT " + icontact.firstname);
	var contact = new ContactModel({
		Status: "ST_ENABLE"
	});
	_updateContact(contact, icontact);
}

function _mergeByPhone(icontact) {
	if (icontact.phone ||
		icontact.phone_perso ||
		icontact.phone_mobile) {
		
		var phone = icontact.phone || '';
		var phone_perso = icontact.phone_perso || '';
		var phone_mobile = icontact.phone_mobile || '';

		ContactModel.find({ 
				$or: [
					{phone: 		phone},
					{phone_perso: 	phone_perso},
					{phone_mobile: 	phone_mobile}
				]
			},
			function (err, contacts) {
				if (err)
					console.log("Google - merge - ", err);
				if (!err && !_updateContacts(contacts, icontact)) {
					_insertNewContact(icontact);
				}					
			});
	} else {
		_insertNewContact(icontact);
	}
}

function _mergeByMail(icontact) {
	var addresses = array(icontact.emails).pluck('address').value();
	//console.log("addresses = ", addresses);

	ContactModel.find({ 'emails.address': { $in : addresses }},
		function (err, contacts) {
			if (err)
				console.log("Google - merge - ", err);
			if (!err && !_updateContacts(contacts, icontact)) {
				_mergeByPhone(icontact);
			}					
		});
}


/* @param icontact Imported contact
*/
function _mergeOneContact (icontact) {

	if (icontact.emails && icontact.emails.length > 0) {
		_mergeByMail(icontact);		

	} else if (icontact.phone ||
		icontact.phone_perso ||
		icontact.phone_mobile) {
		
		_mergeByPhone(icontact);		
	}
}

/* @param icontacts Imported contacts
*/
function _mergeImportedContacts(user, icontacts) {
	console.log("\n\n*** MERGE PROCESS ***\n\n");
	var ic_length = icontacts.length;
	
	for(var i = 0; i < ic_length; ++i) {
		_mergeOneContact(icontacts[i]);		
	}
 
 	// update the date of the latest import
 	var now = new Date();
	var google_contacts = _.extend(user.google.contacts,
		{
			latestImport: dateFormat(now, "yyyy-mm-dd")
		});

	user.google.contacts = google_contacts;

	user.save(function(err, doc) {
        if (err)
            console.log("Google - ", err);
        else
        	console.log("Google - info - user.google.contacts.latestImport updated.");
    });
}



/* Main function to treat a google user in order to import contacts
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




/* callback format : fct(err, icontact, contacts)
*/
function _findNearestContactsByPhone(icontact, callback) {
	if (icontact.phone ||
		icontact.phone_perso ||
		icontact.phone_mobile) {
		
		var phone = icontact.phone || '';
		var phone_perso = icontact.phone_perso || '';
		var phone_mobile = icontact.phone_mobile || '';

		ContactModel.find({ 
				$or: [
					{phone: 		phone},
					{phone_perso: 	phone_perso},
					{phone_mobile: 	phone_mobile}
				]
			},
			function (err, contacts) {
				if (err)
					console.log("Google - merge - ", err);
				else
					callback(null, icontact, contacts);					
			});
	} else {
		callback(null, icontact, null);
	}
}

/* callback format : fct(err, icontact, contacts)
*/
function _findNearestContactsByMail(icontact, callback) {
	var addresses = array(icontact.emails).pluck('address').value();

	ContactModel.find({ 'emails.address': { $in : addresses }},
		function (err, contacts) {
			if (err)
				console.log("Google - merge - ", err);
			else
				_findNearestContactsByPhone(icontact, callback);
		});
}

/* callback format : fct(err, icontact, contacts)
*/
function _findNearestContacts(icontact, callback) {
	if (icontact.emails && icontact.emails.length > 0) {
		_findNearestContactsByMail(icontact, callback);		

	} else if (icontact.phone ||
		icontact.phone_perso ||
		icontact.phone_mobile) {
		
		_findNearestContactsByPhone(icontact, callback);		
	} else {
		callback("No email or phone.", icontact, null);
	}
}


// @return boolean which indicates if the contact
// belongs to a Societe object
function _belongsToSociete(contact) {
	return contact && contact.societe && contact.societe.id;
}

function _getSocietyCommercialIdByContact(contact, callback) {
	if (!_belongsToSociete(contact)) {
		callback(null);
	} else {
		SocieteModel.findOne({_id: contact.societe.id},
			function (err, doc) {
				if (err) {
					console.log("Google export - societe err - ", err);
					callback(null);
				} else if (doc) {
					if (doc.commercial_id && doc.commercial_id.id)
						callback(doc.commercial_id.id);
					else
						callback(null);
				}
			});
	}
}

function _exp_deleteGoogleContact(params, icontact) {
	console.log("\n\n*** DELETING CONTACT ***\n\n");

	var c = new GoogleContacts({
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: params.user.google.tokens.access_token,
		refreshToken: params.user.google.tokens.refresh_token,
	});

	c.deleteContact(icontact.id,
		{ email: params.user.email }, 

		function (err) {
			if (err) {
				console.log("Google - deleting contact " + icontact.id + " - ", err);
			} else {
				console.log("Google - deleting contact " + icontact.id + " - OK");
			}
		});
}


function _exp_checkOneGoogleContact(params, icontact) {
	_findNearestContacts(icontact, 
		function (err, icontact, contacts) {
			if (err)
				return console.log("Google export err - ", err);
			console.log(contacts);
			if (contacts) {
				var deleted = false;
				for (var i = 0; i < contacts.length && !deleted ; ++i) {
					var contact = contacts[i];

					if (_belongsToSociete(contact)) {
						_exp_deleteGoogleContact(params, icontact);
						deleted = true;
					}

					// _getSocietyCommercialIdByContact(contact,
					// 	function (commercial_id) {
					// 		console.log("commercial_id = ", commercial_id);
					// 		console.log("user_id = ", params.user.id);

					// 		if (commercial_id != params.user.id) {
					// 			// no more access to this google contact
					// 			_exp_deleteGoogleContact(params, icontact);
					// 		}
					// 	});					
				};
				
			}
		});
}



function _exp_checkGoogleContacts(params, icontacts) {
	// console.log("_exp_checkGoogleContacts ; icontacts = ");
	// console.log(icontacts);
	// console.log(icontacts.length);

	for (var i = 0; i < icontacts.length; ++i) {
		_exp_checkOneGoogleContact(params, icontacts[i]);
	}
}

/* 
*/
function _exp_getGoogleContacts(params, callback) {
	console.log("\n\n*** GETTING CONTACTS PROCESS ***\n\n");

	var c = new GoogleContacts({
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: params.user.google.tokens.access_token,
		refreshToken: params.user.google.tokens.refresh_token,
	});

	c.getContacts({
		email: params.user.email,
		storeContactId: true

	}, function(err, contacts) {
		if (err)
			console.log("Google export error - ", err);
		else
			callback(params, contacts);
	});
}


function _exp_insertGoogleContact(params, contact) {
	console.log("\n\n*** INSERTING CONTACT ***\n\n");

	var c = new GoogleContacts({
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: params.user.google.tokens.access_token,
		refreshToken: params.user.google.tokens.refresh_token,
	});

	c.insertContact(contact,
		{ email: params.user.email }, 

		function (err) {
			if (err) {
				console.log("Google - insert contact " + 
					contact.name + "(" + contact.id + ") - ", err);
			} else {
				console.log("Google - insert contact " + 
					contact.name + "(" + contact.id + ") - OK");
			}
		});
}


function _exp_listContactsBySociete(params, societe) {
	var stream = ContactModel.find({ "societe.id": societe.id }).stream();
	stream.on('data', function (contact) {
		console.log(">> contact : " + contact.name);
		
		_exp_insertGoogleContact(params, contact);

		console.log("");
	}).on('error', function (err) {
	  console.log("Stream Contact - err", err);
	}).on('close', function () {
	});
}


function _exp_listSocieteObjs(params) {

	var stream = SocieteModel.find({ "commercial_id.id": params.user.id }).stream();
	stream.on('data', function (societe) {
		console.log(">> Scan societe : " + societe._id);
		console.log("        name : " + societe.name);
		console.log("        commercial id: " + societe.commercial_id.id);

		_exp_listContactsBySociete(params, societe);

		console.log("");
	}).on('error', function (err) {
	  console.log("Stream Societe - err", err);
	}).on('close', function () {
	});
}



/* Main function to treat a google user in order to export contacts
*/
function _exp_treatGoogleUser(params) {
	_refreshGoogleTokens(params.user, 
		function (err) {
			if (err)
				console.log("Google export error - ", err);
			else {
//				_exp_getGoogleContacts(params, _exp_checkGoogleContacts);	
				_exp_listSocieteObjs(params);
			}
		}
	);
}



"use strict";

// Modules
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

	var OAuth2Client = googleapis.auth.OAuth2;

// Mongoose models
	var SocieteModel = mongoose.model('societe');
	var ContactModel = mongoose.model('contact');
	var UserModel = mongoose.model('user');

	var config = require(__dirname + '/../../config/config');

// Global google configuration
	var GOOGLE_CLIENT_ID = config.google.clientID,
		GOOGLE_CLIENT_SECRET = config.google.clientSecret,
		// TODO : generate redirect url ?
		GOOGLE_REDIRECT_URL = config.google.callbackURL;

	var googleCommon =   require('../controllers/google.common');
	var googleContacts = require('../controllers/google.contacts');
	var googleTasks = require('../controllers/google.tasks');
	var googleCalendar = require('../controllers/google.calendar');


	module.exports = function(app, passport, auth) {

		var googleRoutes = new GoogleRoutes();

		// Launch the process of importation : get all google contacts of
		// all users.
		app.post('/api/google/import', auth.requiresLogin, googleRoutes.import);

		// Launch the process to grant access to the application : generate
		// a link to make the current connected user accept our application
		// to modify his google contacts even if he is offline.
		app.get( '/api/google/authorize', auth.requiresLogin, googleRoutes.authorize);

		// Used in the importation process : get back the google access code
		// associeted to the current connected user.
		app.get( '/api/google/oauth2callback', auth.requiresLogin, googleRoutes.oauth2callback)

		// Launch the process of exportation : update address book of all users.
		// Delete and insert contacts.
		app.post('/api/google/export', auth.requiresLogin, googleRoutes.export);

		app.get('/api/google/test', auth.requiresLogin, googleRoutes.test);
	};


	// ********************************************

	var oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URL);

	function GoogleRoutes() {
	}

	GoogleRoutes.prototype = {

		authorize : function(req, res) {

			var url = googleCommon.generateAuthUrl(['contacts', 'tasks', 'calendar']);

			res.send("<a href='" + url + "'>Hello " + req.user.name + ", give access to google account !</a>");
		},

		oauth2callback: function(req, res) {
			console.log(req.query);
			var code = req.query.code;
			var user = req.user;

			console.log("oauth2callback: user = "+user.id + " ; code = "+code);

			googleCommon.setAccessCode(code, user,
				function (err) {
					if (err)
						res.send(500, "ERR: " + err);
					else
						res.send(200, "ok");
				}
			);			
		},

		import: function(req, res) {
			googleContacts.importAddressBooksOfAllUsers(
				function (err) {
					if (err)
						res.send(500, "ERR: " + err);
					else
						res.send(200, "ok");
				}
			);
		},

		export: function(req, res) {
			googleContacts.updateAddressBooksOfAllUsers(
				function (err) {
					if (err)
						res.send(500, "ERR: " + err);
					else
						res.send(200, "ok");
				}
			);
		},

		test: function(req, res) {
			// googleTasks.insertTasklist(req.user, "CRM",
			// 	function (err) {
			// 		if (err)
			// 			res.send(500, "ERR: " + err);
			// 		else
			// 			res.send(200, "ok");
			// 	}
			// );

			googleTasks.listTasks(req.user,
				function (err, tasks) {
					if (tasks) {
						console.log("Result:", tasks);
						console.log("Nb:", tasks.length);
					}

			 		if (err)
			 			res.send(500, "ERR: " + err);
			 		else
			 			res.send(200, "ok");
			 	}
			);
		}
	};



/*
 * ****************** EXPORT *********************************************
 */

	

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
					_exp_getGoogleContacts(
						params, 
						_exp_checkGoogleContacts,
						_exp_listSocieteObjs
					);	
					
					
				}
			}
		);
	}
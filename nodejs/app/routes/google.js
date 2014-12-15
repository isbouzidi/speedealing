"use strict";

// Modules
var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		timestamps = require('mongoose-timestamp'),
		xml2js = require('xml2js'),
		dateFormat = require("dateformat"),
		googleapis = require('googleapis'),
		async = require("async");

var OAuth2Client = googleapis.auth.OAuth2;

// Mongoose models
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var UserModel = mongoose.model('user');

// Global google configuration
var GOOGLE_CLIENT_ID = config.google.clientID,
		GOOGLE_CLIENT_SECRET = config.google.clientSecret,
		// TODO : generate redirect url ?
		GOOGLE_REDIRECT_URL = config.google.callbackURL;

var googleCommon = require('../controllers/google.common');
var googleContacts = require('../controllers/google.contacts');
var googleTasks = require('../controllers/google.tasks');
var googleCalendar = require('../controllers/google.calendar');


module.exports = function (app, passport, auth) {

	var googleRoutes = new GoogleRoutes();

	// Launch the process of importation : get all google contacts of
	// all users.
	app.get('/api/google/import', googleRoutes.import);
	app.get('/api/google/import/:userId', googleRoutes.import);

	// Launch the process to grant access to the application : generate
	// a link to make the current connected user accept our application
	// to modify his google contacts even if he is offline.
	app.get('/api/google/authorize', auth.requiresLogin, googleRoutes.authorize);

	// Used in the importation process : get back the google access code
	// associeted to the current connected user.
	app.get('/api/google/callback', auth.requiresLogin, googleRoutes.oauth2callback);

	// Launch the process of exportation : update address book of all users.
	// Delete and insert contacts.
	app.get('/api/google/export', auth.requiresLogin, googleRoutes.export);
	app.get('/api/google/export/:userId', auth.requiresLogin, googleRoutes.export);

	// List all google tasks of the speedealing tasklist of the current user.
	app.get('/api/google/tasks/list', auth.requiresLogin, googleRoutes.listTasks);

	app.get('/api/google/test', auth.requiresLogin, googleRoutes.test);
};


// ********************************************

var oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URL);

function GoogleRoutes() {
}

GoogleRoutes.prototype = {
	authorize: function (req, res) {

		var url = googleCommon.generateAuthUrl(['contacts', 'tasks', 'calendar']);

		res.send("<a href='" + url + "'>Hello " + req.user.name + ", give access to google account !</a>");
	},
	oauth2callback: function (req, res) {
		console.log(req.query);
		var code = req.query.code;
		var user = req.user;

		console.log("oauth2callback: user = " + user.id + " ; code = " + code);

		googleCommon.setAccessCode(code, user,
				function (err) {
					if (err)
						res.send(500, "ERR: " + err);
					else
						res.send(200, "ok");
				}
		);
	},
	import: function (req, res) {
		if (req.params.userId) {
			googleContacts.importAddressBooksOfOneUser(req.params.userId,
					function (err) {
						if (err)
							res.send(500, "ERR: " + err);
						else
							res.send(200, "ok");
					}
			);
		} else {
			googleContacts.importAddressBooksOfAllUsers(
					function (err) {
						if (err)
							res.send(500, "ERR: " + err);
						else
							res.send(200, "ok");
					}
			);
		}
	},
	export: function (req, res) {
		if (req.params.userId) {
			googleContacts.updateGoogleUserAdressBook(req.params.userId,
					function (err) {
						if (err)
							res.send(500, "ERR: " + err);
						else
							res.send(200, "ok");
					}
			);
		} else
			googleContacts.updateAddressBooksOfAllUsers(
					function (err) {
						if (err)
							res.send(500, "ERR: " + err);
						else
							res.send(200, "ok");
					}
			);
	},
	listTasks: function (req, res) {
		googleTasks.listTasks(req.user,
				function (err, tasks) {
					if (tasks) {
						console.log("Result:", tasks);
						console.log("Nb:", tasks.length);
					}

					if (err)
						res.send(500, {'error': err});
					else
						res.send(200, tasks);
				}
		);
	},
	test: function (req, res) {
		// googleTasks.insertTasklist(req.user, "CRM",
		// 	function (err) {
		// 		if (err)
		// 			res.send(500, "ERR: " + err);
		// 		else
		// 			res.send(200, "ok");
		// 	}
		// );

		// googleTasks.listTasks(req.user,
		// 	function (err, tasks) {
		// 		if (tasks) {
		// 			console.log("Result:", tasks);
		// 			console.log("Nb:", tasks.length);
		// 		}

		//  		if (err)
		//  			res.send(500, "ERR: " + err);
		//  		else
		//  			res.send(200, "ok");
		//  	}
		// );

		googleTasks.updateTask(req.user,
				'MDI5OTY5NDIxMTk3MTA3NTcxODY6MDoxNzgwODIzOTg3',
				{'status': 'completed'},
		function (err) {
			if (err)
				res.send(500, "ERR: " + err);
			else
				res.send(200, "ok");
		}
		);
	}
};

"use strict";

/**
 * Module dependencies.
 */
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


var gcommon = require('./google.common');


/* Public declaration methods. See definition for documentation. */
exports.insertContacts = insertContacts;

exports.insertContactsForOneUser =
		insertContactsForOneUser;

exports.insertOneContactForOneUser =
		insertOneContactForOneUser;

exports.importAddressBooksOfAllUsers =
		importAddressBooksOfAllUsers;

exports.updateGoogleUserAdressBook =
		updateGoogleUserAdressBook;

exports.updateAddressBooksOfAllUsers =
		updateAddressBooksOfAllUsers;

exports.contactChanged = contactChanged;

exports.updateSociete = updateSociete;

exports.societeChanged = societeChanged;


/* Methods definitions. */



function getDefaultGoogleContactsParams(user) {
	return {
		consumerKey: GOOGLE_CLIENT_ID,
		consumerSecret: GOOGLE_CLIENT_SECRET,
		token: user.google.tokens.access_token,
		refreshToken: user.google.tokens.refresh_token,
	};
}

function importAddressBooksOfAllUsers(callback) {
	/* 
	 * For each user
	 *     If he has a google email
	 *     and has granted access, then
	 *         Get all his google contact list
	 *         For each contact
	 *             Merge him into Contact database
	 */
	gcommon.forEachGoogleUser(imp_treatGoogleUser, callback);
}



/*
 * ****************** IMPORT *************************************
 */
function _makeContactsParams(user) {
	if (!user.google)
		user.google = {};
	if (!user.google.contacts)
		user.google.contacts = {};
}

function _setLatestImport(user, latestImport, callback) {
	_makeContactsParams(user);
	user.google.contacts.latestImport = latestImport;
	user.save(function (err, doc) {
		callback(err);
	});
}

function _setGroupHref(user, group_href, callback) {
	_makeContactsParams(user);
	user.google.contacts.group_href = group_href;
	user.save(function (err, doc) {
		callback(err);
	});
}

/* 
 */
function imp_getGoogleContacts(user, callback) {
	console.log("\n\n*** GETTING CONTACTS PROCESS ***\n\n");

	var c = new GoogleContacts(getDefaultGoogleContactsParams(user));
	c.getContacts(
			{
				'email': user.email,
				'updatedMin': user.google.contacts.latestImport
			},
	callback);
}


/* *** */

/* Make array elements unique. Input array need to be sorted.
 * @param arr_in Array to treat. Not changed.
 * @return result array
 */
function _array_unique(arr_in, fct_are_equal) {
	var len = arr_in.length;
	if (len < 2)
		return arr_in;
	var result = [];
	for (var i = 0; i < len; ) {
		result.push(arr_in[i]);

		var j = i + 1;
		while (j < len && fct_are_equal(arr_in[i], arr_in[j]))
			++j;

		i = j;
	}
	return result;
}

/* Merge native contact with imported contact
 * @param contact Native contact
 * @param gcontact Imported contact
 */
function imp_updateContact(contact, gcontact, callback) {
	var emails = [];

	if (gcontact.emails) {
		emails = _array_unique(
				_.union(gcontact.emails, contact.emails).sort("address"),
				function (a, b) {
					return a.address == b.address && a.type == b.type;
				});
	} else {
		emails = contact.emails;
	}

	contact = _.extend(contact, gcontact);
	contact.emails = emails;

	console.log("Contact to up/ins. = {" + contact.firstname + " " + contact.lastname + "}");

	contact.save(function (err, doc) {
		callback(err);
	});
}

// *
function imp_updateContacts(contacts, gcontact, callback) {
	if (contacts && contacts.length > 0) {
		async.each(contacts,
				function (contact, cb) {
					imp_updateContact(contact, gcontact, cb);
				},
				function (err) {
					callback(err, true);
				}
		);
	} else { // no result
		callback(null, false);
	}
}

/* @param gcontact Imported contact
 */
function imp_insertNewContact(gcontact, callback) {
	console.log("INSERT NEW CONTACT " + gcontact.firstname);
	var contact = new ContactModel({
		Status: "ST_ENABLE"
	});
	imp_updateContact(contact, gcontact,
			function (err, found) {
				callback(err);
			}
	);
}

function imp_mergeByPhone(gcontact, callback) {
	var phone = gcontact.phone || '';
	var phone_perso = gcontact.phone_perso || '';
	var phone_mobile = gcontact.phone_mobile || '';

	ContactModel.find({
		$or: [
			//{phone: phone},
			{phone_perso: phone_perso},
			{phone_mobile: phone_mobile}
		]
	},
	function (err, contacts) {
		if (err)
			return callback(err);
		if (!contacts)
			return callback(null, false);
		imp_updateContacts(contacts, gcontact, callback);
	});
}


/* Callback format : callback(err, merged)
 *  err : can be null
 *  merged : boolean, true if merge succeed
 */
function imp_mergeByMail(gcontact, callback) {
	var addresses = _.pluck(gcontact.emails, 'address');
	if (typeof addresses.value === 'function')
		addresses = addresses.value();
	//console.log("addresses = ", addresses);
	ContactModel.find({$or: [{'emails.address': {$in: addresses}}, {email: {$in: addresses}}]},
	function (err, contacts) {
		if (err)
			return callback(err);
		if (!contacts)
			return callback(null, false);
		imp_updateContacts(contacts, gcontact, callback);
	}
	);
}


/* @param gcontact Imported contact
 */
function imp_mergeOneContact(gcontact, callback) {
	async.waterfall([
		function (cb) {
			if (gcontact.emails && gcontact.emails.length > 0)
				return imp_mergeByMail(gcontact, cb);
			cb(null, false);
		},
		function (found, cb) {
			if (!found && (gcontact.phone
					|| gcontact.phone_perso
					|| gcontact.phone_mobile))
				return imp_mergeByPhone(gcontact, cb);
			cb(null, found);
		}],
			function (err, found) {
				if (err)
					callback(err);
				else if (!found)
					imp_insertNewContact(gcontact, callback);
				else
					callback();
			}

	);
}


/* @param gcontacts Imported contacts
 */
function imp_mergeImportedContacts(user, gcontacts, callback) {
	console.log("\n\n*** MERGE PROCESS ***\n\n");

	async.eachSeries(gcontacts,
			function (gcontact, cb) {
				imp_mergeOneContact(gcontact, cb);
			},
			function (err) {
				if (err)
					return callback(err);
				_setLatestImport(user, dateFormat(new Date(), "yyyy-mm-dd"), callback);
			}
	);
}



/* Main function to treat a google user in order to import contacts
 */
function imp_treatGoogleUser(user, callback) {
	gcommon.googleAction(user,
			function (cb_google) {
				var my_gcontacts = [];
				async.series([
					function (cb) {
						imp_getGoogleContacts(user,
								function (err, gcontacts) {
									my_gcontacts = gcontacts;
									cb(err);
								});
					},
					function (cb) {
						imp_mergeImportedContacts(user, my_gcontacts, cb)
					}
				],
						cb_google
						);
			},
			callback
			);
}




















/* Insert contacts in users' google address book.
 * @param contacts Array of contact to insert.
 * @param users Users whose address book will be updated.
 *              User who isn't a google user will be ignored.
 * @param callback Function to call when the insertion is done.
 *                 Prototype is callback(err). err could be null.
 */
function insertContacts(contacts, users, callback) {
	async.each(users,
			function (user, cb_user) {
				if (gcommon.isGoogleUserAndHasGrantedAccess(user))
					insertContactsForOneUser(contacts, user, cb_user);
				else
					cb_user();
			},
			function (err) {
				callback(err);
			}
	);
}



function insertContactsForOneUser(contacts, user, callback) {
	async.each(contacts,
			function (contact, cb_contact) {
				insertOneContactForOneUser(contact, user, cb_contact);
			},
			function (err) {
				callback(err);
			}
	);
}



function createRemoteContactGroup(user, callback) {
	var c = new GoogleContacts(gcommon.getDefaultGoogleContactsParams(user));
	c.createGroup({'title': 'CRM'},
	{'email': user.email},
	function (err, group_href) {
		if (err)
			return callback(err);
		_setGroupHref(user, group_href, callback);
	}
	);
}

function hasRemoteContactGroup(user) {
	return user && user.google &&
			user.google.contacts &&
			user.google.contacts.group_href;
}

function insertOneContactForOneUser(contact, user, callback) {
	gcommon.googleAction(user,
			function (cb) {
				async.series([
					function (cb_sub) {
						if (hasRemoteContactGroup(user))
							cb_sub();
						else
							createRemoteContactGroup(user, cb_sub);
					},
					function (cb_sub) {
						console.log("\n\n*** INSERTING CONTACT ***\n\n");
						var c = new GoogleContacts(gcommon.getDefaultGoogleContactsParams(user));
						c.insertContact(contact,
								{'email': user.email,
									'group_href': user.google.contacts.group_href},
						cb);
					}],
						cb);
			},
			callback
			);
}



/* @return boolean which indicates if the contact
 * 					belongs to a Societe object.
 */
function belongsToSociete(contact) {
	return contact && contact.societe && contact.societe.id;
}


function up_deleteGoogleContact(user, gcontact, callback) {
	console.log("\n\n*** DELETING CONTACT ***\n\n");
	var c = new GoogleContacts(gcommon.getDefaultGoogleContactsParams(user));
	c.deleteContact(gcontact.id, {'email': user.email}, callback);
}

function up_treatContacts(user, gcontact, contacts, callback) {
	//console.log("contacts = ");

	var _belongsToSociete = false;
	contacts.forEach(
			function (contact) {
				//console.log("     {"+contact.firstname+" "+contact.lastname+"}");
				if (!_belongsToSociete)
					_belongsToSociete = belongsToSociete(contact);
			}
	);

	if (_belongsToSociete)
		up_deleteGoogleContact(user, gcontact, callback);
	else
		callback();
}



function up_checkGoogleContacts(user, gcontacts, callback) {
	console.log("gcontacts =", gcontacts);
	// old: .each
	// seems to be too much requests
	async.eachSeries(gcontacts,
			function (gcontact, cb) {
				console.log("   gcontact=", gcontact);
				findNearestContacts(gcontact,
						function (err, contacts) {
							console.log("      contacts=", contacts.length);
							if (err || !contacts)
								return cb(err);
							up_treatContacts(user, gcontact, contacts, cb);
						}
				);
			},
			callback
			);
}


function up_listContactsBySociete(user, societe, callback) {
	var my_contacts = []

	var stream = ContactModel.find({"societe.id": societe.id}).stream();
	stream.on('data', function (contact) {

		console.log(">> contact : " + contact.name);
		my_contacts.push(contact);
		console.log("");

	}).on('error', function (err) {
		console.log("Stream Contact - err", err);
	}).on('close', function () {
		// old: .each : seems to be too much requests
		async.eachSeries(my_contacts,
				function (contact, cb) {
					insertOneContactForOneUser(contact, user, cb);
				},
				callback
				);
	});
}

function up_insertContactsFromSociete(user, callback) {
	var my_societes = []

	var stream = SocieteModel.find({"commercial_id.id": user.id}).stream();
	stream.on('data', function (societe) {
		console.log(">> Scan societe : " + societe._id);
		console.log("        name : " + societe.name);
		console.log("        commercial id: " + societe.commercial_id.id);

		my_societes.push(societe);

		console.log("");
	}).on('error', function (err) {
		callback(err);
	}).on('close', function () {
		// old: .each : seems to be too much requests
		async.eachSeries(my_societes,
				function (societe, cb) {
					up_listContactsBySociete(user, societe, cb);
				},
				callback
				);
	});
}


function updateGoogleUserAdressBook(user, callback) {
	console.log(user.id);
	gcommon.googleAction(user,
			function (cb_google) {
				var my_gcontacts = null;

				async.series([
					function (cb) {
						var c = new GoogleContacts(gcommon.getDefaultGoogleContactsParams(user));
						c.getContacts({
							email: user.email,
							storeContactId: true
						}, function (err, gcontacts) {
							my_gcontacts = gcontacts;
							console.log("*********** 563");
							cb(err);
						});
					},
					function (cb) {
						// old: .parallel
						// seem to be too much requests
						async.series([
							function (cb_sub) {
								up_checkGoogleContacts(user, my_gcontacts, cb_sub);
							},
							function (cb_sub) {
								up_insertContactsFromSociete(user, cb_sub);
							}],
								cb
								);
					}
				],
						function (err, results) {
							cb_google(err);
						});

			},
			callback
			);
}







/* Protected methods */




/* callback format : fct(err, contacts)
 */
function findNearestContactsByPhone(gcontact, callback) {
	if (gcontact.phone ||
			gcontact.phone_perso ||
			gcontact.phone_mobile) {

		var phone = gcontact.phone || '';
		var phone_perso = gcontact.phone_perso || '';
		var phone_mobile = gcontact.phone_mobile || '';

		ContactModel.find(
				{$or: [
						{phone: phone},
						{phone_perso: phone_perso},
						{phone_mobile: phone_mobile}
					]
				},
		callback
				);
	} else {
		callback(null, []);
	}
}

/* callback format : fct(err, contacts)
 */
function findNearestContactsByMail(gcontact, callback) {
	if (gcontact.emails && gcontact.emails.length > 0) {
		var addresses = _.pluck(gcontact.emails, 'address');
		if (typeof addresses.value === 'function')
			addresses = addresses.value();
		ContactModel.find({'emails.address': {$in: addresses}}, callback);
	} else {
		callback(null, []);
	}
}

/* callback format : fct(err, contacts)
 */
function findNearestContacts(gcontact, callback) {
	async.parallel([
		function (cb) {
			findNearestContactsByMail(gcontact, cb);
		},
		function (cb) {
			findNearestContactsByPhone(gcontact, cb);
		}
	],
			function (err, results) {
				var nearest = _.union(results[0], results[1]).sort("_id");
				nearest = _array_unique(nearest,
						function (a, b) {
							return a["_id"] == b["_id"];
						});

				callback(err, nearest);
			}
	);
}





/*
 * ****************** EXPORT *********************************************
 */


/* update address books of all google user
 */
function updateAddressBooksOfAllUsers(callback) {
	//	For each User
	//		For each google contact
	//			Find the nearest contact
	//			If the contact is related to a Societe
	//				Delete the google contact
	//
	//		For each Societe where User is the commercial
	//			For each contact related to the Societe
	//				Insert contact as a new google contact

	gcommon.forEachGoogleUser(updateGoogleUserAdressBook, callback);
}



/*
 * Events
 */

function _updateUserById(user_id, callback) {
	UserModel.findOne({_id: user_id},
	function (err, user) {
		if (err)
			return callback(err);
		updateGoogleUserAdressBook(user, callback);
	}
	);
}

function societeChanged(societe, old_commercial_id, new_commercial_id, callback) {
	if (old_commercial_id == new_commercial_id)
		return callback();

	async.parallel([
		function (cb) {
			_updateUserById(old_commercial_id, cb);
		},
		function (cb) {
			_updateUserById(new_commercial_id, cb);
		}
	],
			callback
			);
}


function updateSociete(societe, callback) {
	var googleUsers = [];

	// evolution : if commercial_id becomes an array,
	// change the query.
	var stream = UserModel.find({_id: societe.commercial_id.id}).stream();
	stream.on('data', function (user) {
		if (gcommon.isGoogleUserAndHasGrantedAccess(user))
			googleUsers.push(user);
	}).on('error', function (err) {
		callback(err);
	}).on('close', function () {
		// each = too much requests
		async.eachSeries(googleUsers,
				updateGoogleUserAdressBook,
				callback);
	});
}


function _updateSocieteById(societe_id, callback) {
	SocieteModel.findOne({_id: societe_id},
	function (err, societe) {
		if (err)
			return callback(err);
		updateSociete(societe, callback);
	}
	);
}

function contactChanged(contact, old_societe_id, new_societe_id, callback) {
	if (old_societe_id == new_societe_id)
		return callback();

	async.series([
		function (cb) {
			_updateSocieteById(old_societe_id, cb);
		},
		function (cb) {
			_updateSocieteById(new_societe_id, cb);
		}],
			callback
			);
}



















/* ****************************************** */

/* ****************************************** */

/* ****************************************** */



/* Personal module */


var _ = require('lodash'),
		qs = require('querystring'),
		util = require('util'),
		url = require('url'),
		https = require('https'),
		querystring = require('querystring'),
		XMLWriter = require('xml-writer');

var GoogleContacts = function (opts) {
	if (typeof opts === 'string') {
		opts = {token: opts}
	}
	if (!opts) {
		opts = {};
	}

	this.contacts = [];
	this.consumerKey = opts.consumerKey ? opts.consumerKey : null;
	this.consumerSecret = opts.consumerSecret ? opts.consumerSecret : null;
	this.token = opts.token ? opts.token : null;
	this.refreshToken = opts.refreshToken ? opts.refreshToken : null;
};

GoogleContacts.prototype = {};

//util.inherits(GoogleContacts, EventEmitter);


GoogleContacts.prototype._get = function (params, cb) {
	var self = this;

	if (typeof params === 'function') {
		cb = params;
		params = {};
	}

	var req = {
		host: 'www.google.com',
		port: 443,
		path: this._buildPath(params),
		method: 'GET',
		headers: {
			'Authorization': 'OAuth ' + this.token,
			'GData-Version': '3.0'
		}
	};

	console.log("HTTP req = ", req, "\n");

	https.request(req, function (res) {
		var data = '';

		res.on('end', function () {
			if (res.statusCode < 200 || res.statusCode >= 300) {
				var error = new Error('Bad client request status: ' + res.statusCode);
				return cb(error);
			}
			try {
				//console.log("Raw data = ", data, "\n");
				data = JSON.parse(data);
				cb(null, data);
			}
			catch (err) {
				cb(err);
			}
		});

		res.on('data', function (chunk) {
			//console.log(chunk.toString());
			data += chunk;
		});

		res.on('error', function (err) {
			cb(err);
		});

		//res.on('close', onFinish);
	}).on('error', function (err) {
		cb(err);
	}).end();
};

/* Get google contacts
 * @param params Hash parameters to get contacts.
 *        { email: "user@gmail.com" }
 * @param cb Callback called when error or to treat results.
 *        callback format : function (err, contacts)
 */
GoogleContacts.prototype.getContacts = function (params, cb) {
	var self = this;
	params.type = 'contacts';
	this.store_id = params.storeContactId || false;

	this._get(params, receivedContacts);
	function receivedContacts(err, data) {
		if (err)
			return cb(err);

		self._saveContactsFromFeed(data.feed);

		var next = false;
		data.feed.link.forEach(function (link) {
			if (link.rel === 'next') {
				next = true;
				var path = url.parse(link.href).path;
				self._get({path: path}, receivedContacts);
			}
		});
		if (!next) {
			cb(null, self.contacts);
		}
	}
	;
};

GoogleContacts.prototype._saveContactsFromFeed = function (feed) {
	var self = this;
	//console.log(feed);
	if (feed && feed.entry) {
		feed.entry.forEach(function (entry) {
			try {

				var new_contact = {};

				try {
					new_contact.lastname = entry['gd$name']['gd$familyName']['$t'];
				} catch (e) {
				}
				try {
					new_contact.firstname = entry['gd$name']['gd$givenName']['$t'];
				} catch (e) {
				}

				if (entry['gd$organization']) {
					new_contact.societe = {};
					try {
						new_contact.societe.name = entry['gd$organization'][0]['gd$orgName']['$t'];
					} catch (e) {
					}
					try {
						new_contact.poste = entry['gd$organization'][0]['gd$orgTitle']['$t'];
					} catch (e) {
					}
				}

				/* - Emails - */
				if (entry['gd$email']) {

					new_contact.emails = [];

					entry['gd$email'].forEach(function (email) {

						//console.log("> email = ", email);
						var emailType = email.rel;
						var emailTxt = email.address;

						if (emailType) {
							switch (emailType) {
								case "http://schemas.google.com/g/2005#home":
									new_contact.emails.push({type: "perso", address: emailTxt});
									new_contact.email = emailTxt;
									break;

								case "http://schemas.google.com/g/2005#work":
									new_contact.emails.push({type: "pro", address: emailTxt});
									new_contact.email = emailTxt;
									break;

								case "http://schemas.google.com/g/2005#other":
									new_contact.emails.push({type: "other", address: emailTxt});
									new_contact.email = emailTxt;
									break;

								default:
									console.log("> Email : unknow type.\n", emailType);
							}
						} else {
							console.log("> Email : no type.\n", email);
						}
					});
				} /* - end Emails - */

				/* - Phone numbers - */
				if (entry['gd$phoneNumber']) {
					entry['gd$phoneNumber'].forEach(function (phoneNumber) {

						//console.log("> phoneNumber = ", phoneNumber);
						var phoneNumberType = phoneNumber.rel;
						var phoneNumberTxt = phoneNumber['$t'];

						if (phoneNumberType) {
							switch (phoneNumberType) {
								case "http://schemas.google.com/g/2005#mobile":
									new_contact.phone_mobile = phoneNumberTxt;
									break;

								case "http://schemas.google.com/g/2005#work":
									new_contact.phone = phoneNumberTxt;
									break;

								case "http://schemas.google.com/g/2005#home":
									new_contact.phone_perso = phoneNumberTxt;
									break;

								case "http://schemas.google.com/g/2005#work_fax":
									new_contact.fax = phoneNumberTxt;
									break;

								case "http://schemas.google.com/g/2005#other":
									new_contact.phone = phoneNumberTxt;
									break;

								default:
									console.log("> Phone : unknow type.\n", phoneNumberType);
							}
						} else {
							console.log("> Phone : no type.\n", phoneNumber);
							// TODO: apply to phone ?
							//console.log("> Phone : no type. Apply to 'phone'.\n", phoneNumber);
							//new_contact.phone = phoneNumberTxt;
						}
					});
				} /* - end Phone numbers - */

				/* - Address - */
				if (entry['gd$structuredPostalAddress']) {
					entry['gd$structuredPostalAddress'].forEach(function (address) {
						var addressType = address.rel;

						if (address['gd$street'] && address['gd$street']['$t'])
							new_contact.address = address['gd$street']['$t'];

						if (address['gd$city'] && address['gd$city']['$t'])
							new_contact.town = address['gd$city']['$t'];

						if (address['gd$postcode'] && address['gd$postcode']['$t'])
							new_contact.zip = address['gd$postcode']['$t'];

					});
				}

				if (self.store_id) {
					try {
						var id = entry['id']['$t'];
						new_contact.id = id.substring(id.lastIndexOf("/") + 1);
					} catch (e) {
					}
				}

				if (new_contact.email != null || new_contact.lastname != null)
					self.contacts.push(new_contact);
			}
			catch (e) {
				// property not available...
				// or link to next contacts
				console.log("_saveContactsFromFeed : property not available...");
				console.log("   or error when parsing = ", e);
			}

		});
	}
	console.log("\n_saveContactsFromFeed");
	console.log(JSON.stringify(self.contacts, null, 2));
	console.log("Nb contacts = ", self.contacts.length);
}

GoogleContacts.prototype._buildPath = function (params) {
	if (params.path)
		return params.path;

	params = params || {};
	params.type = params.type || 'contacts';
	params.alt = params.alt || 'json';
	params.projection = params.projection || 'thin';
	params.email = params.email || 'default';
	params['max-results'] = params['max-results'] || 20000;
	params.updatedMin = params.updatedMin || '1980-01-01'

	var query = {
		alt: params.alt,
		'max-results': params['max-results'],
		'updated-min': params.updatedMin
	};

	var path = '/m8/feeds/';
	path += params.type + '/';
	path += params.email + '/';
	path += params.projection;
	path += '?' + qs.stringify(query);

	return path;
};

/*GoogleContacts.prototype.refreshAccessToken = function (refreshToken, cb) {
 if (typeof params === 'function') {
 cb = params;
 params = {};
 }
 
 var data = {
 refresh_token: refreshToken,
 client_id: this.consumerKey,
 client_secret: this.consumerSecret,
 grant_type: 'refresh_token'
 
 }
 
 var body = qs.stringify(data);
 
 var opts = {
 host: 'accounts.google.com',
 port: 443,
 path: '/o/oauth2/token',
 method: 'POST',
 headers: {
 'Content-Type': 'application/x-www-form-urlencoded',
 'Content-Length': body.length
 }
 };
 
 //console.log(opts);
 //console.log(data);
 
 var req = https.request(opts, function (res) {
 var data = '';
 res.on('end', function () {
 if (res.statusCode < 200 || res.statusCode >= 300) {
 var error = new Error('Bad client request status: ' + res.statusCode);
 return cb(error);
 }
 try {
 data = JSON.parse(data);
 //console.log(data);
 cb(null, data.access_token);
 }
 catch (err) {
 cb(err);
 }
 });
 
 res.on('data', function (chunk) {
 //console.log(chunk.toString());
 data += chunk;
 });
 
 res.on('error', function (err) {
 cb(err);
 });
 
 //res.on('close', onFinish);
 }).on('error', function (err) {
 cb(err);
 });
 
 req.write(body);
 req.end();
 }*/

// ********************************************************************
// insert contact

/* Get google contacts
 * @param params Hash parameters to get contacts.
 *        { email: "user@gmail.com" }
 * @param cb Callback called when error or to treat results.
 *        callback format : function (err, contacts)
 */
GoogleContacts.prototype.insertContact = function (contact, params, cb) {
	var self = this;
	params.type = 'contacts';

	if (typeof params === 'function') {
		cb = params;
		params = {};
	}

	if (params.group_href)
		contact.group_href = params.group_href;

	var body = this._contactToXML(contact);

	var opts = {
		host: 'www.google.com',
		port: 443,
		path: this._buildPathInsert(params),
		method: 'POST',
		headers: {
			'Authorization': 'OAuth ' + this.token,
			'GData-Version': '3.0',
			'Content-Type': 'application/atom+xml',
			'Content-Length': body.length
		}
	};

	console.log("HTTP req = ", opts, "\n");

	var req = https.request(opts,
			function (res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					console.log(chunk);
				});
				if (res.statusCode < 200 || res.statusCode >= 300) {
					var error = new Error('Bad client request status: ' + res.statusCode);
					return cb(error);
				}
				cb(null);

			});

	req.write(body);
	req.end();

	req.on('error', function (err) {
		cb(err);
	});
};

GoogleContacts.prototype._buildPathInsert = function (params) {
	if (params.path)
		return params.path;

	params = params || {};
	params.type = params.type || 'contacts';
	params.email = params.email || 'default';
	params.projection = params.projection || 'full';

	var path = '/m8/feeds/';
	path += params.type + '/';
	path += params.email + '/';
	path += params.projection;
	if (params.query)
		path += '?' + qs.stringify(params.query);

	return path;
};

GoogleContacts.prototype._contactToXML = function (contact) {
	var x = new XMLWriter;

	x.startElement('atom:entry')
			.writeAttribute('xmlns:atom', 'http://www.w3.org/2005/Atom')
			.writeAttribute('xmlns:gd', 'http://schemas.google.com/g/2005')

			.startElement('atom:category')
			.writeAttribute('scheme', 'http://schemas.google.com/g/2005#kind')
			.writeAttribute('term', 'http://schemas.google.com/contact/2008#contact')
			.endElement()

			.startElement('gd:name');
	if (contact.firstname) {
		x.startElement('gd:givenName')
				.text(contact.firstname)
				.endElement();
	}
	if (contact.lastname) {
		x.startElement('gd:familyName')
				.text(contact.lastname)
				.endElement();
	}
	x.endElement();

	if (contact.notes) {
		x.startElement('atom:content')
				.writeAttribute('type', 'text')
				.text(contact.notes)
				.endElement();
	}

	if (contact.emails) {
		contact.emails.forEach(function (email) {
			x.startElement('gd:email')
					.writeAttribute('address', email.address);

			var rel = '';
			switch (email.type) {
				case "perso":
					rel = 'http://schemas.google.com/g/2005#home';
					break;

				case "pro":
					rel = 'http://schemas.google.com/g/2005#work';
					break;

				case "other":
					rel = 'http://schemas.google.com/g/2005#other';
					break;
			}

			x.writeAttribute('rel', rel)
					.endElement();
		});
	}

	if (contact.phone) {
		x.startElement('gd:phoneNumber')
				.writeAttribute('rel', 'http://schemas.google.com/g/2005#work')
				.text(contact.phone)
				.endElement();
	}

	if (contact.phone_mobile) {
		x.startElement('gd:phoneNumber')
				.writeAttribute('rel', 'http://schemas.google.com/g/2005#mobile')
				.text(contact.phone_mobile)
				.endElement();
	}

	if (contact.phone_perso) {
		x.startElement('gd:phoneNumber')
				.writeAttribute('rel', 'http://schemas.google.com/g/2005#home')
				.text(contact.phone_perso)
				.endElement();
	}

	if (contact.fax) {
		x.startElement('gd:phoneNumber')
				.writeAttribute('rel', 'http://schemas.google.com/g/2005#work_fax')
				.text(contact.fax)
				.endElement();
	}

	if (contact.group_href) {
		x.startElement('gContact:groupMembershipInfo')
				.writeAttribute('deleted', 'false')
				.writeAttribute('href', contact.group_href)
				.endElement();
	}

	x.endElement();

	return x.toString();
}

// ***************************************************
// delete contact

GoogleContacts.prototype.deleteContact = function (contact_id, params, cb) {
	var opts = {
		hostname: 'www.google.com',
		port: 443,
		path: this._buildPathInsert(params) + '/' + contact_id,
		method: 'DELETE',
		headers: {
			'Authorization': 'OAuth ' + this.token,
			'GData-Version': '3.0',
			'If-match': '*'
		}
	};

	console.log(opts);

	var req = https.request(opts, function (res) {
		if (res.statusCode < 200 || res.statusCode >= 300) {
			var error = new Error('Bad client request status: ' + res.statusCode);
			return cb(error);
		}
		cb(null);
	}).on('error', function (err) {
		cb(err);
	}).end();
}


// *********** Groups


GoogleContacts.prototype._groupToXML = function (group) {
	x = new XMLWriter;

	x.startElement('atom:entry')
			.writeAttribute('xmlns:atom', 'http://www.w3.org/2005/Atom')
			.writeAttribute('xmlns:gd', 'http://schemas.google.com/g/2005')

			.startElement('atom:category')
			.writeAttribute('scheme', 'http://schemas.google.com/g/2005#kind')
			.writeAttribute('term', 'http://schemas.google.com/contact/2008#group')
			.endElement()

			.startElement('atom:title')
			.writeAttribute('type', 'text')
			.text(group.title)
			.endElement()
			.endElement();

	return x.toString();
}


GoogleContacts.prototype._getGroupId = function (json) {
	var id = json.entry.id["$t"];
	return id.substring(id.lastIndexOf("/") + 1);
}

/* group format :
 *  { title }
 *
 * callback format : callback(err, group_href)
 */
GoogleContacts.prototype.createGroup = function (group, params, callback) {
	var self = this;

	var body = this._groupToXML(group);

	params.type = 'groups';
	params.query = {'alt': 'json'};

	var opts = {
		host: 'www.google.com',
		port: 443,
		path: this._buildPathInsert(params),
		method: 'POST',
		headers: {
			'Authorization': 'OAuth ' + this.token,
			'GData-Version': '3.0',
			'Content-Type': 'application/atom+xml',
			'Content-Length': body.length
		}
	};

	console.log("HTTP req = ", opts, "\n");
	console.log("HTTP body = ", body, "\n");

	var data = '';

	var req = https.request(opts,
			function (res) {
				res.setEncoding('utf8');

				res.on('data', function (chunk) {
					data += chunk;
				});

				res.on('end', function () {
					if (res.statusCode < 200 || res.statusCode >= 300) {
						console.log(data);
						var error = new Error('Bad client request status: ' + res.statusCode);
						return callback(error);
					}
					try {
						console.log("Raw data = ", data, "\n");
						data = JSON.parse(data);
						callback(null, data.entry.id["$t"]);
					} catch (err) {
						callback(err);
					}
				});
			});


	req.write(body);
	req.end();

	req.on('error', function (err) {
		callback(err);
	});
};


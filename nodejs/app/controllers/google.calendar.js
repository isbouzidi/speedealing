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

var gcommon = require('./google.common');

/* Public declaration methods. See definition for documentation. */

// test
exports.insertCalendar = insertCalendar;

exports.insertEvent = insertEvent;

exports.insertQuickAddEvent = insertQuickAddEvent;



/* Methods definitions */

function _makeCalendarParams(user) {
	if (!user.google)
		user.google = {};
	if (!user.google.calendar)
		user.google.calendar = {};
}

function _setCalendarId(user, calendar_id, callback) {
	_makeCalendarParams(user);
	user.google.calendar.calendar_id = calendar_id;
	user.save(function(err, doc) { callback(err); });
}

function insertCalendar(user, summary, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback("Not a Google User or not access.", null);
	gcommon.googleAction(user,
		function (cb_google) {
			var t = new GoogleCalendar(gcommon.getDefaultGoogleContactsParams(user));
			var my_calendar_id = '';

			async.series([
				function (cb) {
					t.createCalendar({'summary': summary},
						function (err, calendar_id) {
							my_calendar_id = calendar_id;
							cb(err);
						});
				},

				function (cb) {
					t.insertCalendarIntoCalendarList(
						{'id':my_calendar_id},
						{'email': user.email},
						function (err) {
							if (err)
								return cb(err);
							_setCalendarId(user, my_calendar_id, cb);
						});
				}], 
				cb_google);
		},
		callback
	);
}

function hasRemoteCalendar(user) {
	return user && user.google &&
		user.google.calendar &&
		user.google.calendar.calendar_id;
}

/*
	event = https://developers.google.com/google-apps/calendar/v3/reference/events#resource
	callback = function(err, event_id)
*/
function insertEvent(user, event, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback("Not a Google User or not access.", null);
	gcommon.googleAction(user,
		function (cb_google) {
			async.series([
				function (cb) {
					if (hasRemoteCalendar(user))
						return cb();
					insertCalendar(user, "CRM", cb);
				},
				function (cb) {
					var t = new GoogleCalendar(gcommon.getDefaultGoogleContactsParams(user));
					t.insertEvent(event, 
						{'calendar_id': user.google.calendar.calendar_id}, 
						callback);
				}], 
				cb_google);
		},
		callback
	);
}

/*
	eventString : a text string which describe an event
		with start date and end date.
		e.g. "Rendez vous quelque part le 3 juin  à 10h jusqu'à 10h25"
	callback = function(err, event_id)
*/
function insertQuickAddEvent(user, eventString, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback("Not a Google User or not access.", null);
	gcommon.googleAction(user,
		function (cb_google) {
			async.series([
				function (cb) {
					if (hasRemoteCalendar(user))
						return cb();
					insertCalendar(user, "CRM", cb);
				},
				function (cb) {
					var t = new GoogleCalendar(gcommon.getDefaultGoogleContactsParams(user));
					t.insertQuickAddEvent(eventString, 
						{'calendar_id': user.google.calendar.calendar_id}, 
						callback);
				}], 
				cb_google);
		},
		callback
	);
}

/* *************************************************** */

/* Module */

var _ = require('lodash'),
qs = require('querystring'),
util = require('util'),
url = require('url'),
https = require('https'),
querystring = require('querystring'),
XMLWriter = require('xml-writer');

var GoogleCalendar = function (opts) {
	if (!opts) {
		opts = {};
	}

	this.tasks = [];
	this.consumerKey = opts.consumerKey ? opts.consumerKey : null;
	this.consumerSecret = opts.consumerSecret ? opts.consumerSecret : null;
	this.token = opts.token ? opts.token : null;
	this.refreshToken = opts.refreshToken ? opts.refreshToken : null;

	this.host = 'www.googleapis.com'
	this.port = 443;
};

exports.GoogleCalendar = GoogleCalendar;

GoogleCalendar.prototype = {};

/*
	path = path on the server web (after the host name)
	method = http method
	header = hash headers to add to request. Optional
*/
GoogleCalendar.prototype._createHttpsReqOptions = function(path, method, headers) {

	if (!headers)
		headers = {}

	headers['Authorization'] = 'OAuth ' + this.token;
	//headers['GData-Version'] = '3.0';

	return {
		'host': this.host,
		'port': this.port,
		'path': path,
		'method': method,
		'headers': headers
	};
}


GoogleCalendar.prototype._buildPath = function (params) {
	if (params.path) return params.path;

	params = params || {};
	params.type = params.type || 'event';
	//params.tasklist_id
	params.alt = params.alt || 'json';
	params.email = params.email || 'me';
	params.calendar_id = params.calendar_id || '0';
	params.query = params.query || '';

	var path = '/calendar/v3';

	if (params.type == 'calendar') {
		path += '/calendars';	
	} else if (params.type == 'calendar_list') {
		path += '/users/' + params.email + '/calendarList';
	} else if (params.type == 'event') {
		path += '/calendars/' + params.calendar_id + '/events';
	} else if (params.type == 'quick_add_event') {
		path += '/calendars/' + params.calendar_id + '/events/quickAdd/';
	}

	if (params.query)
		path += '?' + qs.stringify(params.query);

	return path;
};


/*
	opts = {host, port, path, method, headers}
	body [string]. Can be null
	callback = function(err, data)
*/
GoogleCalendar.prototype._sendHttpsRequest = function(opts, body, callback) {
	console.log("HTTPS opts = ", opts, "\n");
	body = body || '';
	var req = https.request(opts, function (res) {
		var data = '';
		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			data += chunk;
		});

		res.on('end', function () {
			if (res.statusCode < 200 || res.statusCode >= 300) {
				console.log("Response = ", data);
				var error = new Error('Bad client request status: ' + res.statusCode);
				return callback(error, data);
			} else {
				callback(null, data);
			}
		});
	}).on('error', function (err) {
		callback(err);
	});
	if (body)
		req.write(body);
	req.end();
	return req;
}



// ********************************************************************
// insert contact

/* @param task JSON Resource 
 {'summary': summary}
* 
* @param cb Callback called when error or to treat results.
*        callback format : function (err, calendar_id)
*/
GoogleCalendar.prototype.createCalendar = function (calendar, callback) {
		
	var body = JSON.stringify(calendar);

	var params = {};
	params['type'] = 'calendar';

	var opts = this._createHttpsReqOptions(
		this._buildPath(params),
		'POST', 
		{
			'Content-Type': 'application/json',
			'Content-Length': body.length
		}
	);

	this._sendHttpsRequest(opts, body, 
		function (err, data) {
			console.log("My data =", data);
			if (err)
				return callback(err);

			try {
				data = JSON.parse(data);
				callback(null, data.id);
			} catch (err) {
				callback(err);
			}
		}
	);
};


/*
 calendar = { 'id': '....'}
params = {'email': '...'}
 */

GoogleCalendar.prototype.insertCalendarIntoCalendarList = 
function (calendar, params, callback) {
		
	var body = JSON.stringify(calendar);

	var params = {};
	params['type'] = 'calendar_list';

	var opts = this._createHttpsReqOptions(
		this._buildPath(params),
		'POST', 
		{
			'Content-Type': 'application/json',
			'Content-Length': body.length
		}
	);

	this._sendHttpsRequest(opts, body, 
		function (err, data) {
			console.log("My data =", data);
			callback(err);
		}
	);
};



/*
	event = https://developers.google.com/google-apps/calendar/v3/reference/events#resource
	params = {calendar_id}
	callback = function(err, event_id)
*/
GoogleCalendar.prototype.insertEvent = 
function (event, params, callback) {
		
	var body = JSON.stringify(event);

	params['type'] = 'event';

	var opts = this._createHttpsReqOptions(
		this._buildPath(params),
		'POST', 
		{
			'Content-Type': 'application/json',
			'Content-Length': body.length
		}
	);

	this._sendHttpsRequest(opts, body, 
		function (err, data) {
			console.log("My data =", data);
			if (err)
				return callback(err);

			try {
				data = JSON.parse(data);
				callback(null, data.id);
			} catch (err) {
				callback(err);
			}
		}
	);
};


/*
	event = https://developers.google.com/google-apps/calendar/v3/reference/events#resource
	params = {calendar_id}
	callback = function(err, event_id)
*/
GoogleCalendar.prototype.insertQuickAddEvent = 
function (eventString, params, callback) {
	
	params['type'] = 'quick_add_event';
	params['query'] = { 'text': eventString };

	var opts = this._createHttpsReqOptions(
		this._buildPath(params),
		'POST'
	);

	this._sendHttpsRequest(opts, null, 
		function (err, data) {
			console.log("My data =", data);
			if (err)
				return callback(err);

			try {
				data = JSON.parse(data);
				callback(null, data.id);
			} catch (err) {
				callback(err);
			}
		}
	);
};

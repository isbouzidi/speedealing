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

var gcommon = require('./google.common');

/* Public declaration methods. See definition for documentation. */
exports.insertTasklist = insertTasklist;

exports.insertTask = insertTask;


/* Methods definitions */

	function _makeTasksParams(user) {
 		if (!user.google)
			user.google = {};
		if (!user.google.tasks)
			user.google.tasks = {};
 	}

 	function _setTasklistId(user, tasklist_id) {
 		_makeTasksParams(user);
 		user.google.tasks.tasklist_id = tasklist_id;
 		user.save(function(err, doc) { callback(err); });
 	}

 	function hasRemoteTasklist(user) {
		return user && user.google &&
			user.google.tasks &&
			user.google.tasks.tasklist_id;
	}

function insertTasklist(user, title, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback("Not a Google User or not access.", null);
	gcommon.googleAction(user,
		function (cb_google) {
			var t = new GoogleTasks(gcommon.getDefaultGoogleContactsParams(user));
			t.insertTasklist({'title': title},
				{'user_id':user.google.user_id},
			 	cb_google);
		},
		callback
	);
}



function insertTask(user, task, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback("Not a Google User or not access.", null);
	gcommon.googleAction(user,
		function (cb_google) {
			async.series([
				function (cb) {
					if (hasRemoteTasklist(user))
						return cb();
					insertTasklist(user, "CRM", cb);
				},
				function (cb) {
					var t = new GoogleTasks(gcommon.getDefaultGoogleContactsParams(user));
					t.insertTask(task, 
						{'email':user.email, 
						'tasklist_id': user.google.tasks.tasklist_id}, 
					callback);
				}], 
				cb_google);
		},
		callback
	);
}


function getAllTasks(user, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback(null, []);

	var t = new GoogleTasks(gcommon.getDefaultGoogleContactsParams(user));
	t.listTasks({'email':user.email, 'tasklist_id':tasklist_id}, callback);
}




function insertTaskFromReport(report, user, callback) {
	var notes = "";

	report.actions.forEach(
		function (action) {
			notes += "- [" + action.method +"] " + action.type + "\n" ;
		}
	);

	var task = {
		'notes': notes,
		'realised': report.realised,
		'due': report.dueDate,
		'title': report.model
	};

	insertTask(user, task, callback);
}























































































/* *************************************************** */

/* *************************************************** */

/* *************************************************** */




/* Module */




var _ = require('underscore'),
qs = require('querystring'),
util = require('util'),
url = require('url'),
https = require('https'),
querystring = require('querystring'),
XMLWriter = require('xml-writer');

var GoogleTasks = function (opts) {
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

exports.GoogleTasks = GoogleTasks;

GoogleTasks.prototype = {};

GoogleTasks.prototype._createHttpsReqOptions = function(path, method, headers) {

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

GoogleTasks.prototype._get = function (params, cb) {
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
*        { email: "user@gmail.com", tasklist_id: "..." }
* @param cb Callback called when error or to treat results.
*        callback format : function (err, contacts)
*/
GoogleTasks.prototype.listTasks = function (params, callback) {
	var self = this;

	this._get(params, receivedContacts);
	function receivedContacts(err, data) {
		if (err) return cb(err);

		self._saveContactsFromFeed(data.feed);

		var next = false;
		data.feed.link.forEach(function (link) {
			if (link.rel === 'next') {
				next = true;
				var path = url.parse(link.href).path;
				self._get({ path: path }, receivedContacts);
			}
		});
		if (!next) {
			cb(null, self.contacts);
		}
	};
};

GoogleTasks.prototype._saveContactsFromFeed = function (feed) {
	var self = this;
//console.log(feed);
if (feed && feed.entry) {
	feed.entry.forEach(function (entry) {
		try {

			var new_contact = { };



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
console.log( JSON.stringify( self.contacts, null, 2) );
console.log("Nb contacts = ", self.contacts.length);
}

GoogleTasks.prototype._buildPath = function (params) {
	if (params.path) return params.path;

	params = params || {};
	params.type = params.type || 'task';
	//params.tasklist_id
	params.alt = params.alt || 'json';
	params.email = params.email || '@me';

	//maxResults
	// var query = {
	// 	alt: params.alt,
	// 	'max-results': params['max-results'],
	// 	'updated-min': params.updatedMin
	// };

	var path = '/tasks/v1';

	if (params.type == 'tasklist') {
		path += '/users/'; 
		if (params['use_user_id'])
			path += params.user_id;
		else
			path += params.email;
		path += '/lists';
		if (params.tasklist_id)
			path += '/' + params.tasklist_id;
	} else if (params.type == 'task') {
		path += '/lists/' + params.tasklist_id + '/tasks';

	}

	//path += '?' + qs.stringify(query);

	return path;
};


GoogleTasks.prototype._sendHttpsRequest = function(opts, body, callback) {
	console.log("HTTPS opts = ", opts, "\n");
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
				return callback(error);
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
 { title }
* 
* @param params Hash parameters to get contacts.
*        { user_id: "...", name: "tasklist" }
* @param cb Callback called when error or to treat results.
*        callback format : function (err, tasklist_id)
*/
GoogleTasks.prototype.insertTasklist = function (tasklist, params, callback) {
	tasklist['kind'] = "tasks#taskList";
	
	var body = JSON.stringify(tasklist);

	params['type'] = 'tasklist';
	params['use_user_id'] = true;

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

			// ...
			var tasklist_id = '123';
			callback(err, tasklist_id)
		}
	);
};



/*
https://developers.google.com/google-apps/tasks/v1/reference/tasks?hl=fr#resource
* task = {}
{
  "title": string,
  "updated": datetime, (e.g. 2014-12-01T00:00:00.000Z)
  "position": string,
  "notes": string,
  "status": string,
  "due": datetime,
  "completed": datetime
}
* params = {tasklist_id}
*/
GoogleTasks.prototype.insertTask = function (task, params, callback) {
	
	//var tasklist_id = params.tasklist_id;
	task['kind'] = "tasks#task";
	
	var body = JSON.stringify(task);

	params['type'] = 'task';
	
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

			// ...
			callback(err);
		}
	);
};







// ***************************************************
/* Delete
* params [hash] {email, task_id}
*/
GoogleTasks.prototype.deleteTask = function (params, cb) {


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



GoogleTasks.prototype._getGroupId = function(json) {
	var id = json.entry.id["$t"];
	return id.substring(id.lastIndexOf("/")+1);
}

/* group format :
*  { title }
*
* callback format : callback(err, group_href)
*/
GoogleTasks.prototype.createGroup = function (group, params, callback) {
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
}





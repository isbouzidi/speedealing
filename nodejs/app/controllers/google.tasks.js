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

exports.updateTask = updateTask;

exports.insertTaskFromReport =
insertTaskFromReport;

exports.listTasks = listTasks;


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

/*
	* not working * 
	Refine the code to create a tasklist
	for the given user.
		*/
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


/* Insert a task into the speedealing tasklist
*/
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
						{'tasklist_id': user.google.tasks.tasklist_id}, 
						callback);
				}], 
				cb_google);
		},
		callback
		);
}


/* Get all tasks from the speedealing tasklist
	callback = function(err, results) with
		results an array of task.
		*/
		function listTasks(user, callback) {
			if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
				return callback("Not a Google User or not access.");
			var my_result = [];
			gcommon.googleAction(user,
				function (cb_google) {
					async.series([
						function (cb) {
							if (hasRemoteTasklist(user))
								return cb();
							cb(new Error("No speedealing tasklist"));
						},
						function (cb) {
							var t = new GoogleTasks(gcommon.getDefaultGoogleContactsParams(user));
							t.listTasks({'tasklist_id':user.google.tasks.tasklist_id},
								function (err, result) {
									if (err)
										return cb(err);
									my_result = result;
									cb();
								});
						}], 
						cb_google);
				},
				function (err) {
					if (err)
						return callback(err);
					callback(null, my_result);
				}

				);
		}



/*
	Convert a report into task. To refine.
	*/
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






/* Update a task (who belongs to the speedealing tasklist)
*/
function updateTask(user, task_id, task, callback) {
	if (! gcommon.isGoogleUserAndHasGrantedAccess(user))
		return callback("Not a Google User or not access.", null);
	gcommon.googleAction(user,
		function (cb_google) {
			async.series([
				function (cb) {
					if (hasRemoteTasklist(user))
						return cb();
					cb(new Error("No speedealing tasklist saved."));
				},
				function (cb) {
					task.id = task_id;
					var t = new GoogleTasks(gcommon.getDefaultGoogleContactsParams(user));
					t.updateTask(task, 
						{'task_id': task_id,
						'tasklist_id': user.google.tasks.tasklist_id}, 
						callback);
				}], 
				cb_google);
		},
		callback
		);
}



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

/*
	path = path on the server web (after the host name)
	method = http method
	header = hash headers to add to request. Optional
	*/
	GoogleTasks.prototype._createHttpsReqOptions = function(path, method, headers) {

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

GoogleTasks.prototype._buildPath = function (params) {
	if (params.path) return params.path;

	params = params || {};
	params.type = params.type || 'task';
	//params.tasklist_id
	params.alt = params.alt || 'json';
	params.email = params.email || '@me';
	params.query = params.query || '';

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
	}  else if (params.type == 'task') {
		path += '/lists/' + params.tasklist_id + '/tasks';
	} else if (params.type == 'task_update') {
		path += '/lists/' + params.tasklist_id + '/tasks/' + params.task_id;
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
	GoogleTasks.prototype._sendHttpsRequest = function(opts, body, callback) {
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

// *****************


GoogleTasks.prototype._getTasks = function (params, callback) {
	
	params['type'] = 'task';
	
	var opts = this._createHttpsReqOptions(
		this._buildPath(params),
		'GET'
		);

	this._sendHttpsRequest(opts, null, 
		function (err, data) {
			console.log("My data =", data);
			if (err)
				return callback(err);

			try {
				data = JSON.parse(data);
				if (data.kind != "tasks#tasks")
					throw new Error("Response is not a response tasks.");

				callback(null, data);
			} catch (err) {
				callback(err);
			}
		}
		);
};


GoogleTasks.prototype._treatTasks = function (data, params, callback) {
	var that = this;
	async.parallel([
		function (cb) {
			if (data.items)
				that.tasks = that.tasks.concat(data.items);
			cb();
		},
		function (cb) {
			if (data.nextPageToken) { // get next results
				if(!params.query)
					params.query = {};
				params.query.pageToken = data.nextPageToken;
				that._listTasks(params, cb);
			} else {
				cb();
			}
		}],
		callback
		);
}

/* Get google contacts
* @param params Hash parameters to get contacts.
*        {  tasklist_id }
* @param cb Callback called when error or to treat results.
*        callback format : function (err)
*/
GoogleTasks.prototype._listTasks = function (params, callback) {
	var that = this;
	var my_data = [];

	that._getTasks(params,
		function(err, data) {
			if (err)
				return callback(err);
			
			that._treatTasks(data, params, callback);
		}
		);
};

/* Get google contacts
* @param params Hash parameters to get contacts.
*        {  tasklist_id }
* example : params.query = {'maxResults': 2};
* @param cb Callback called when error or to treat results.
*        callback format : function (err, tasks)
*/
GoogleTasks.prototype.listTasks = function (params, callback) {
	var that = this;
	this.tasks = [];

	this._listTasks(params,
		function (err) {
			callback(err, that.tasks);
		}
		);
}

// ********************************************************************

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
			if (err) {
				console.log(err);
				return callback(err);
			}

			try {
				data = JSON.parse(data);
				callback(null, data.id);
			} catch (err) {
				console.log(err);
				callback(err);
			}
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
			if (err) {
				console.log(err);
				return callback(err);
			}

			try {
				data = JSON.parse(data);
				callback(null, data.id);
			} catch (err) {
				console.log(err);
				callback(err);
			}
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
* params = {task_id, tasklist_id}
*/
GoogleTasks.prototype.updateTask = function (task, params, callback) {
	
	task['kind'] = "tasks#task";
	var body = JSON.stringify(task);
	params['type'] = 'task_update';
	params['task_id'] = params.task_id;
	params['tasklist_id'] = params.tasklist_id;
	
	var opts = this._createHttpsReqOptions(
		this._buildPath(params),
		'PUT', 
		{
			'Content-Type': 'application/json',
			'Content-Length': body.length
		}
		);

	this._sendHttpsRequest(opts, body, 
		function (err, data) {
			console.log("My data =", data);
			if (err) {
				console.log(err);
				return callback(err);
			}

			try {
				data = JSON.parse(data);
				callback(null, data.id);
			} catch (err) {
				console.log(err);
				callback(err);
			}
		}
		);
};





"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		_ = require('lodash'),
		async = require("async");

var ExtrafieldModel = mongoose.model('extrafields');
var TaskModel = mongoose.model('task');

/* Public declaration methods. See definition for documentation. */
exports.read = readTask;
exports.create = createTask;
exports.update = updateTask;
exports.remove = removeTask;
exports.show = showTask;
exports.count = countTask;

var fk_extrafields = {};

ExtrafieldModel.findById('extrafields:Task', function (err, doc) {
	if (err) {
		console.log(err);
		return;
	}

	fk_extrafields = doc;
});

function readTask(params, callback) {
	
	var query = {type_code: "AC_RDV"};

		if (params.filters) {
			if (params.filters.filters) {
				var list = [];
				for (var i = 0; i < params.filters.filters.length; i++)
					list.push(params.filters.filters[i].value);
				query['usertodo.id'] = {'$in': list};
			} else {
				return res.send(200, []);
			}
		}
	
	
	var result = [];

	TaskModel.find(query, function (err, doc) {
		if (err) {
			return callback;
		}

		for (var i in doc) {
			//convert usertoto
			result[i] = JSON.parse(JSON.stringify(doc[i]));

			var usertodo = [];
			for (var j = 0; j < result[i].usertodo.length; j++)
				usertodo[j] = result[i].usertodo[j].id;

			result[i].usertodo = [];
			result[i].usertodo = usertodo;

			if (result[i].notes.length)
				result[i].notes = result[i].notes[0];

			//var date = new Date(result[i].datep);

			//result[i].start = "Date("+ Date.parse(result[i].datep) +")";
			//result[i].end = "Date("+ Date.parse(result[i].datef) +")";

			if (i == 1)
				console.log(result[i]);
			//console.dir(doc[i].typeMove);
		}
		callback(err, result);
	});
}

function countTask(params, callback) {
	callback(null, 12);
}

function createTask(user, task, callback) {

}

function updateTask(task, callback) {

}

function removeTask(id, callback) {

}

function showTask(id, callback) {

}


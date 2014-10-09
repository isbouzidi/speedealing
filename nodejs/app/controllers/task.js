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

function readTask(params, callback) {

	//console.log(params);
	var query = {};

	/*if (params.filters) {
	 if (params.filters.filters) {
	 var list = [];
	 for (var i = 0; i < params.filters.filters.length; i++)
	 list.push(params.filters.filters[i].value);
	 query['usertodo.id'] = {'$in': list};
	 } else {
	 return res.send(200, []);
	 }
	 }*/

	var result = [];


	switch (params.query) {
		case 'MYTASK':
			query['usertodo.id'] = params.user;
			break;
		case 'ALLTASK':
			query.entity = params.entity;
			break;
		default: //'ARCHIVED':
			query.archived = true;
	}

	TaskModel.find(query, params.fields, {skip: parseInt(params.skip) * parseInt(params.limit) || 0, limit: params.limit || 100, sort: JSON.parse(params.sort)}, callback);
}

function countTask(params, callback) {
	var query = {};

	/*if (params.filters) {
	 if (params.filters.filters) {
	 var list = [];
	 for (var i = 0; i < params.filters.filters.length; i++)
	 list.push(params.filters.filters[i].value);
	 query['usertodo.id'] = {'$in': list};
	 } else {
	 return res.send(200, []);
	 }
	 }*/

	var result = [];


	switch (params.query) {
		case 'MYTASK':
			query['usertodo.id'] = params.user;
			break;
		case 'ALLTASK':
			query.entity = params.entity;
			break;
		default: //'ARCHIVED':
			query.archived = true;
	}

	TaskModel.count(query, callback);
}

function createTask(task, user, callback) {
	var new_task = {};

	new_task = new TaskModel(task);

	new_task.author = {
		id: user._id,
		name: user.name
	};

	if (task.usertodo == null)
		new_task.usertodo = {
			id: user._id,
			name: user.name
		};

	if (new_task.entity == null)
		new_task.entity = user.entity;
	
	if(new_task.type == 'AC_RDV')
		new_task.datep = null;

	//console.log(bill);
	new_task.save(callback);
}

function updateTask(task, user, callback) {

}

function removeTask(id, callback) {

}

function showTask(id, callback) {

}


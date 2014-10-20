"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		_ = require('lodash'),
		i18n = require("i18next"),
		config = require('../../config/config'),
		async = require("async");

var TaskModel = mongoose.model('task');

var googleCalendar = require('./google.calendar');

/* Public declaration methods. See definition for documentation. */
exports.read = readTask;
exports.create = createTask;
exports.update = updateTask;
exports.remove = removeTask;
exports.get = getTask;
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
			query.$or = [
				{'usertodo.id': params.user, 'userdone.id': null},
				{'author.id': params.user, archived: false}
			];
			break;
		case 'ALLTASK':
			query.entity = params.entity;
			query['archived'] = false;
			break;
		case 'MYARCHIVED':
			query.$or = [
				{'usertodo.id': params.user, 'userdone.id': {$ne: null}},
				{'author.id': params.user, archived: true}];
			break;
		case 'ARCHIVED':
			query.entity = params.entity;
			query['archived'] = true;
			break;
		case 'TODAYMYRDV':  // For rdv list in menu
			query['usertodo.id'] = params.user;
			query.type = 'AC_RDV';
			query.datep = {$gte: new Date().setHours(0, 0, 0), $lte: new Date().setHours(23, 59, 59)};
			return TaskModel.find(query, params.fields, callback);
			break;
		default: //'ARCHIVED':
			query.archived = true;
	}

	//console.log(query);
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
			query.$or = [
				{'usertodo.id': params.user, 'userdone.id': null},
				{'author.id': params.user, archived: false}
			];
			break;
		case 'ALLTASK':
			query.entity = params.entity;
			query['archived'] = false;
			break;
		case 'MYARCHIVED':
			query.$or = [
				{'usertodo.id': params.user, 'userdone.id': {$ne: null}},
				{'author.id': params.user, archived: true}];
			break;
		case 'ARCHIVED':
			query.entity = params.entity;
			query['archived'] = true;
			break;
		default: //'ARCHIVED':
			query.archived = true;
	}

	TaskModel.count(query, callback);
}

function createTask(task, user, usersSocket, callback) {
	var new_task = {};

	new_task = new TaskModel(task);

	new_task.author = {
		id: user._id,
		name: user.firstname + " " + user.lastname
	};

	if (task.usertodo == null)
		new_task.usertodo = {
			id: user._id,
			name: user.firstname + " " + user.lastname
		};

	if (new_task.entity == null)
		new_task.entity = user.entity;

	if (new_task.type != 'AC_RDV')
		new_task.datep = null;

	if (new_task.type == 'AC_RDV')
		googleCalendar.insertEvent(new_task.usertodo.id, {
			status: "confirmed",
			start: {
				dateTime: new_task.datep
			},
			end: {
				dateTime: new_task.datef
			},
			summary: new_task.name + " (" + new_task.societe.name + ")",
			description: "Tache / evenement avec " + new_task.contact.name,
			location: new_task.societe.name,
			source: {
				title: "ERP CRM Speedealing",
				url: config.url + "/#!/task/" + new_task._id
			}
		}, function (err, event_id) {
			//if (err)
			//	console.log(err);

			//console.log(event_id);
		});

	//console.log(bill);
	new_task.save(function (err, task) {
		callback(err, task);

		var socket = usersSocket[task.usertodo.id];
		//console.log(usersSocket);
		if (task.usertodo.id != user._id && socket)
			socket.emit('notify', {
				title: i18n.t('tasks:Task') + " : " + task.name,
				message: '<strong>' + user.firstname + " " + user.lastname + '</strong> vous a ajouté une tache.',
				options: {
					autoClose: false,
					//link: "#!/task/" + newTask._id,
					classes: ["orange-gradient"]
				}
			});
	});
}

function updateTask(oldTask, newTask, user, usersSocket, callback) {
	newTask = _.extend(oldTask, newTask);
	//console.log(req.body);

	if (newTask.notes[newTask.notes.length - 1].percentage >= 100 && newTask.userdone.id == null)
		newTask.userdone = {
			id: user._id,
			name: user.firstname + " " + user.lastname
		};

	if (newTask.type == 'AC_RDV' && oldTask.usertodo.id != newTask.usertodo.id)
		googleCalendar.insertEvent(newTask.usertodo.id, {
			status: "confirmed",
			start: {
				dateTime: newTask.datep
			},
			end: {
				dateTime: newTask.datef
			},
			summary: new_task.name + " (" + newTask.societe.name + ")",
			description: "Rendez avec " + newTask.contact.name,
			location: newTask.societe.name,
			source: {
				title: "ERP CRM Speedealing",
				url: config.url + "/#!/task/" + newTask._id
			}
		}, function (err, event_id) {
			//if (err)
			//	console.log(err);

			//console.log(event_id);
		});

	newTask.save(function (err, task) {
		callback(err, task);

		var socket_author = usersSocket[task.author.id];
		var socket_todo = usersSocket[task.usertodo.id];
		//console.log(usersSocket);
		if ((task.author.id != user._id || task.usertodo.id != user._id) && (socket_author || socket_todo)) {
			if (task.author.id != user._id && socket_author) {
				if (task.percentage >= 100)
					socket_author.emit('notify', {
						title: i18n.t('tasks:Task') + " : " + task.name,
						message: '<strong>' + user.firstname + " " + user.lastname + '</strong> a terminé la tache.',
						options: {
							autoClose: true,
							//link: "#!/task/" + newTask._id,
							classes: ["green-gradient"]
						}
					});
				else
					socket_author.emit('notify', {
						title: i18n.t('tasks:Task') + " : " + task.name,
						message: '<strong>' + user.firstname + " " + user.lastname + '</strong> a modifié la tache.',
						options: {
							autoClose: true,
							//link: "#!/task/" + newTask._id,
							classes: ["blue-gradient"]
						}
					});
			} else if (task.percentage < 100 && task.usertodo.id != user._id && socket_todo)
				socket_todo.emit('notify', {
					title: i18n.t('tasks:Task') + " : " + task.name,
					message: '<strong>' + user.firstname + " " + user.lastname + '</strong> a modifié la tache.',
					options: {
						autoClose: true,
						//link: "#!/task/" + newTask._id,
						classes: ["blue-gradient"]
					}
				});
		}

		//refresh tasklist and counter on users
		refreshTask(usersSocket[user._id]);
	});
}

function removeTask(id, callback) {

}

function getTask(id, callback) {
	TaskModel.findOne({_id: id}, callback);
}

function refreshTask(socket) {
	if (socket) {
		socket.broadcast.emit('refreshTask', {}); // others
		socket.emit('refreshTask', {}); //me
	}
}

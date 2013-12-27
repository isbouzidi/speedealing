"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		dateFormat = require('dateformat'),
		config = require('../../config/config');

var TicketModel = mongoose.model('ticket');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Societe', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/ticket', auth.requiresLogin, function(req, res) {
		object.read(req, res);
		return;
	});

	app.get('/api/ticket/:id', auth.requiresLogin, function(req, res) {
		object.findOne(req, res);
		return;
	});

	app.post('/api/ticket', auth.requiresLogin, function(req, res) {
		object.create(req, res);
	});

	app.put('/api/ticket/read', auth.requiresLogin, function(req, res) {

		var addComment = {
			title: "<strong>" + req.user.firstname + "</strong> a ouvert le ticket",
			datec: new Date(),
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			icon: "icon-eye"
		};

		TicketModel.update({_id: req.body.id}, {'$push': {comments: addComment}, '$addToSet': {read: req.user._id}}, function(err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			return res.send(200, {});
		});
	});

	app.put('/api/ticket/expire', auth.requiresLogin, function(req, res) {

		var datef = new Date(req.body.datef);

		var addComment = {
			title: "<strong>" + req.user.firstname + "</strong> a change la date <strong>" + dateFormat(datef, "dd/mm/yyyy") + " " + datef.toLocaleTimeString() + "</strong>",
			datec: new Date(),
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			icon: "icon-clock"
		};

		TicketModel.update({_id: req.body.id}, {'$set': {datef: datef}, '$push': {comments: addComment}, '$pop': {read: req.body.controller.id}}, function(err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			return res.send(200, {});
		});
	});

	app.post('/api/ticket/comment', auth.requiresLogin, function(req, res) {

		var addComment = {
			datec: new Date(),
			note: req.body.note,
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname}
		};

		var update = {};

		switch (req.body.mode) {
			case 'forward' :
				addComment.icon = "icon-extract";
				addComment.title = "<strong>" + req.user.firstname + "</strong> transfert a <strong>" + req.body.addUser.name + "</strong>";
				update = {'$push': {comments: addComment}, '$addToSet': {affectedTo: req.body.addUser}};
				break;
			case 'reply' :
				addComment.title = "<strong>" + req.user.firstname + "</strong> repond a <strong>" + req.body.controller.name + "</strong>";
				addComment.icon = 'icon-reply';
				update = {'$push': {comments: addComment}, '$pop': {read: req.body.controller.id}};
				break;
			case 'comment':
				addComment.title = "<strong>" + req.user.firstname + "</strong> a ajoute un commentaire";
				addComment.icon = 'icon-chat';
				update = {'$push': {comments: addComment}, '$set': {read: [req.user._id]}};
				break;
		}

		console.log(addComment);

		TicketModel.update({_id: req.body.id}, update, function(err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			return res.send(200, {});
		});
	});

	app.post('/api/ticket/important', auth.requiresLogin, function(req, res) {
		TicketModel.update({_id: req.body.id}, {'$set': {important: true, read: [req.user._id]}}, function(err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			return res.send(200, {});
		});
	});

	app.put('/api/ticket/:id', auth.requiresLogin, function(req, res) {
		object.update(req, res);
	});

	app.del('/api/ticket', auth.requiresLogin, function(req, res) {
		object.del(req, res);
	});

	app.post('/api/ticket/file/:Id', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;
		//console.log(id);

		if (req.files && id) {
			//console.log(req.files);
			var filename = req.files.files.path;
			if (fs.existsSync(filename)) {
				//console.log(filename);
				TicketModel.findOne({_id: id}, function(err, ticket) {

					if (err) {
						console.log(err);
						return res.send(500, {status: "Id not found"});
					}

					var opts;
					opts = {
						content_type: req.files.files.type,
						metadata: {
							_id: id
						}
					};

					return ticket.addFile(req.files.files, opts, function(err, result) {
						if (err)
							console.log(err);

						//console.log(result);

						return res.send(200, {status: "ok"});
					});
				});
			} else
				res.send(500, {foo: "bar", status: "failed"});
		}
	});

	app.get('/api/ticket/file/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {
			TicketModel.findOne({_id: id}, function(err, ticket) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}

				ticket.getFile(req.params.fileName, function(err, store) {
					if (err)
						console.log(err);

					//console.log(store);
					res.type(store.contentType);
					res.attachment(store.filename); // for douwnloading
					store.stream(true).pipe(res);

				});
			});
		}
	});

	app.del('/api/ticket/file/:Id', auth.requiresLogin, function(req, res) {
		//console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.body.fileNames && id) {
			TicketModel.findOne({_id: id}, function(err, ticket) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}
				ticket.removeFile(req.body.fileNames, function(err, result) {
					if (err)
						console.log(err);

					res.send(200, {status: "ok"});
				});
			});
		} else
			res.send(500, "File not found");
	});

	//other routes..
};

function Object() {
}

Object.prototype = {
	create: function(req, res) {

		var ticket = new TicketModel(req.body);

		ticket.comments.push({author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			title: "<strong>" + req.user.firstname + "</strong> a cree le ticket",
			datec: new Date(),
			icon: "icon-speech"
		});

		ticket.save(function(err, doc) {
			if (err)
				console.log(err);

			res.send(200, doc);
		});
	},
	read: function(req, res) {
		var status_list = this.fk_extrafields.fields.Status;

		TicketModel.find({}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			/*for (var i in doc) {
			 var status = {};
			 doc[i] = doc[i].value;
			 
			 /*doc[i].societe_id = doc[i].societe.id;
			 doc[i].societe = doc[i].societe.name;
			 status.id = doc[i].Status;
			 if (status_list.values[status.id]) {
			 status.name = req.i18n.t("intervention." + status_list.values[status.id].label);
			 status.css = status_list.values[status.id].cssClass;
			 } else { // Value not present in extrafield
			 status.name = status.id;
			 status.css = "";
			 }*/

			//doc[i].Status = status;

			//}
			//console.log(doc);
			res.send(200, doc);
		});
	},
	findOne: function(req, res) {
		TicketModel.findOne({_id: req.params.id}, function(err, ticket) {
			if (err)
				return res.send(500, err);
			if (!ticket)
				return res.send(404, 'Failed to load ticket ' + req.params.id);
			res.send(200, ticket);
		});
	},
	update: function(req, res) {
		TicketModel.findOne({_id: req.params.id}, function(err, ticket) {
			if (err)
				return res.send(500, err);
			if (!ticket)
				return res.send(404, 'Failed to load ticket ' + req.params.id);

			ticket = _.extend(ticket, req.body);

			ticket.save(function(err) {
				return res.send(200, {_id: ticket._id});
			});
		});
	},
	del: function(req) {
		return req.body.models;
	}
};
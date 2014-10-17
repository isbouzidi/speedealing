"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var TicketModel = mongoose.model('ticket');

var Dict = require('../controllers/dict');

module.exports = function (app, passport, auth, usersSocket) {

	var object = new Object();
	object.usersSocket = usersSocket;

	app.get('/api/ticket', auth.requiresLogin, object.read);
	app.get('/api/ticket/:id', auth.requiresLogin, object.findOne);
	app.post('/api/ticket', auth.requiresLogin, function (req, res) {
		object.create(req, res);
	});
	app.put('/api/ticket/read', auth.requiresLogin, function (req, res) {

		var addComment = {
			title: "<strong>" + req.user.firstname + "</strong> a ouvert le ticket",
			datec: new Date(),
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			icon: "icon-eye"
		};

		// notify controller read
		var socket = usersSocket[req.body.controlledBy.id];
		if (req.body.controlledBy.id != req.user._id && socket)
			socket.emit('notify', {
				title: 'Ticket : ' + req.body.name,
				message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a ouvert le ticket ' + req.body.ref,
				options: {
					autoClose: true,
					classes: ["anthracite-gradient"]
				}
			});

		TicketModel.update({_id: req.body.id}, {'$push': {comments: addComment}, '$addToSet': {read: req.user._id}}, function (err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			object.refreshTicket(req.user._id, function () {
				return res.send(200, {});
			});
		});


	});

	app.put('/api/ticket/expire', auth.requiresLogin, function (req, res) {

		var datef = new Date(req.body.datef);

		var addComment = {
			title: "<strong>" + req.user.firstname + "</strong> a change la date d\'échéance au <strong>" + dateFormat(datef, "dd/mm/yyyy") + " " + datef.toLocaleTimeString() + "</strong>",
			datec: new Date(),
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			icon: "icon-clock"
		};

		var update = {
			'$set': {datef: datef},
			'$push': {comments: addComment}
		}
		if (req.user._id != req.body.controller.id)
			update['$pull'] = {read: req.body.controller.id};

		// notify controller chnge date
		var socket = usersSocket[req.body.controller.id];
		if (req.body.controller.id != req.user._id && socket)
			socket.emit('notify', {
				title: 'Ticket : ' + req.body.name,
				message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a changé la date d\'échéance au ' + dateFormat(datef, "dd/mm/yyyy"),
				options: {
					autoClose: false,
					link: "#!/ticket/" + req.body.id,
					classes: ["anthracite-gradient"]
				}
			});

		TicketModel.update({_id: req.body.id}, update, function (err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			object.refreshTicket(req.user._id, function () {
				return res.send(200, {});
			});
		});
	});

	app.post('/api/ticket/comment', auth.requiresLogin, function (req, res) {

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
				var socket = usersSocket[req.body.addUser.id];
				if (socket)
					socket.emit('notify', {
						title: 'Ticket : ' + req.body.name,
						message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> vous a ajouté sur le ticket ' + req.body.ref + ' et attend votre intervention.',
						options: {
							autoClose: false,
							delay: 300,
							link: "#!/ticket/" + req.body.id,
							classes: ["orange-gradient"],
						}
					});
				break;
			case 'reply' :
				addComment.title = "<strong>" + req.user.firstname + "</strong> repond a <strong>" + req.body.controller.name + "</strong>";
				addComment.icon = 'icon-reply';
				if (req.user._id != req.body.controller.id)
					update = {'$push': {comments: addComment}, '$pull': {read: req.body.controller.id}};
				else
					update = {'$push': {comments: addComment}};

				var socket = usersSocket[req.body.controller.id];
				if (socket)
					socket.emit('notify', {
						title: 'Ticket : ' + req.body.name,
						message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> vous pose un question sur votre ticket ' + req.body.ref + '.',
						options: {
							autoClose: false,
							delay: 300,
							link: "#!/ticket/" + req.body.id,
							classes: ["orange-gradient"],
						}
					});
				break;
			case 'comment':
				addComment.title = "<strong>" + req.user.firstname + "</strong> a ajoute un commentaire";
				addComment.icon = 'icon-chat';
				update = {'$push': {comments: addComment}, '$set': {read: [req.user._id]}};

				// notify all members change date
				TicketModel.findOne({_id: req.body.id}, function (err, ticket) {
					ticket.affectedTo.forEach(function (user) {
						if (user.id === req.user._id)
							return;

						var socket = usersSocket[user.id];
						if (socket)
							socket.emit('notify', {
								title: 'Ticket : ' + req.body.name,
								message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a commenté le ticket ' + req.body.ref + '.',
								options: {
									autoClose: true,
									delay: 300,
									link: "#!/ticket/" + req.body.id,
									classes: ["green-gradient"],
								}
							});
					});
				});

				break;
		}

//console.log(addComment);

		TicketModel.update({_id: req.body.id}, update, function (err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			object.refreshTicket(req.user._id, function () {
				return res.send(200, {});
			});
		});
	});

	/*app.post('/api/ticket/important', auth.requiresLogin, function(req, res) {
	 
	 // notify all members chnge date
	 TicketModel.findOne({_id: req.body.id}, function(err, ticket) {
	 ticket.affectedTo.forEach(function(user) {
	 if (user.id === req.user._id)
	 return;
	 
	 var socket = usersSocket[user.id];
	 if (socket)
	 socket.emit('notify', {
	 title: 'Ticket : ' + req.body.name,
	 message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a marqué le ticket ' + req.body.ref + ' comme étant important.',
	 options: {
	 autoClose: false,
	 delay: 300,
	 link: "#!/ticket/" + req.body.id,
	 classes: ["red-gradient"]
	 }
	 });
	 })
	 });
	 
	 TicketModel.update({_id: req.body.id}, {'$set': {important: true, read: [req.user._id]}}, function(err) {
	 if (err) {
	 console.log(err);
	 return res.send(500, err);
	 }
	 
	 object.refreshTicket(req.user._id, function() {
	 return res.send(200, {});
	 });
	 });
	 });*/

	app.put('/api/ticket/status', auth.requiresLogin, function (req, res) {

		var addComment = {
			datec: new Date(),
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			icon: "icon-cross-round",
			title: "<strong>" + req.user.firstname + "</strong> a cloture le ticket"
		};

		var update = {
			$set: {Status: req.body.Status},
			$push: {comments: addComment}
		};

		if (req.body.recurrency) {
			var datef = new Date();
			datef.setDate(datef.getDate() + req.body.recurrency + 5);

			var callback = new Date();
			callback.setDate(callback.getDate() + req.body.recurrency);

			update['$set'] = {Status: "NEW", read: [], datef: datef, callback: callback};
		}

		if (req.user._id != req.body.controller.id)
			update['$pull'] = {read: req.body.controller.id};

		TicketModel.update({_id: req.body.id}, update, function (err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			object.refreshTicket(req.user._id, function () {
				return res.send(200, {});
			});
		});
	});

	app.put('/api/ticket/percentage', auth.requiresLogin, function (req, res) {

		var addComment = {
			datec: new Date(),
			author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			icon: "icon-gauge",
			title: "<strong>" + req.user.firstname + "</strong> change a <strong>" + req.body.percentage + "%</strong>"
		};

		// notify controller chnge date
		var socket = usersSocket[req.body.controller.id];
		if (req.body.controller.id != req.user._id && socket) {
			if (parseInt(req.body.percentage) === 100)
				socket.emit('notify', {
					title: 'Ticket : ' + req.body.name,
					message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a terminé le ticket ' + req.body.ref + '.',
					options: {
						autoClose: false,
						link: "#!/ticket/" + req.body.id,
						classes: ["green-gradient"]
					}
				});
			else
				socket.emit('notify', {
					title: 'Ticket : ' + req.body.name,
					message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a changé le niveau du ticket ' + req.body.ref + ' à ' + req.body.percentage + '%.',
					options: {
						autoClose: true,
						link: "#!/ticket/" + req.body.id,
						classes: ["anthracite-gradient"]
					}
				});
		}

		TicketModel.update({_id: req.body.id}, {'$set': {percentage: req.body.percentage}, '$push': {comments: addComment}}, function (err) {
			if (err) {
				console.log(err);
				return res.send(500, err);
			}

			object.refreshTicket(req.user._id, function () {
				return res.send(200, {});
			});
		});
	});
	app.put('/api/ticket/:id', auth.requiresLogin, object.update);
	app.del('/api/ticket', auth.requiresLogin, object.del);
	app.post('/api/ticket/file/:Id', auth.requiresLogin, function (req, res) {
		var id = req.params.Id;
		//console.log(id);

		if (req.files && id) {
			//console.log(req.files);

			gridfs.addFile(TicketModel, id, req.files.files, function (err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "Error in request file");
	});

	app.get('/api/ticket/file/:Id/:fileName', auth.requiresLogin, function (req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {

			gridfs.getFile(TicketModel, id, req.params.fileName, function (err, store) {
				if (err)
					return res.send(500, err);

				if (req.query.download)
					res.attachment(store.filename); // for downloading 

				res.type(store.contentType);
				store.stream(true).pipe(res);

			});
		} else {
			res.send(500, "Error in request file");
		}

	});

	app.del('/api/ticket/file/:Id', auth.requiresLogin, function (req, res) {
//console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.body.fileNames && id) {
			gridfs.delFile(TicketModel, id, req.body.fileNames, function (err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "File not found");
	});

	//other routes..
};

function Object() {
}

Object.prototype = {
	create: function (req, res) {
		var self = this;
		var ticket = new TicketModel(req.body);

		ticket.comments.push({author: {id: req.user._id, name: req.user.firstname + " " + req.user.lastname},
			title: "<strong>" + req.user.firstname + "</strong> a crée le ticket",
			datec: new Date(),
			icon: "icon-speech",
			note: "Date d\'échéance au " + dateFormat(ticket.datef, "dd/mm/yyyy")
		});

		ticket.read.push(req.body.controlledBy.id);

		ticket.save(function (err, doc) {
			if (err)
				console.log(err);

			// notify all members change date
			doc.affectedTo.forEach(function (user) {
				if (user.id === req.user._id)
					return;

				var socket = self.usersSocket[user.id];
				if (socket)
					socket.emit('notify', {
						title: 'Ticket : ' + doc.name,
						message: '<strong>' + req.user.firstname + " " + req.user.lastname[0] + '.</strong> a ajouté le ticket ' + doc.ref + '.',
						options: {
							autoClose: false,
							delay: 300,
							link: "#!/ticket/" + doc._id,
							classes: ["orange-gradient"],
						}
					});
			});

			self.refreshTicket(req.user._id, function () {
				return res.send(200, doc);
			});
		});
	},
	read: function (req, res) {

		if (req.query.count)
			TicketModel.count({'affectedTo.id': req.user._id, read: {$ne: req.user._id}, Status: {$ne: 'CLOSED'}, $or: [{callback: {$lt: new Date()}}, {callback: null}]}, function (err, doc) {
				if (err) {
					console.log(err);
					res.send(500, doc);
					return;
				}

				res.send(200, {cpt: doc});
			});
		else {
			var query = {};
			var fields = {};
			/**
			 * Find for box ticket in fiche
			 */

			if (req.query.find) {
				query = JSON.parse(req.query.find);
			} else {
				query = {'affectedTo.id': req.user._id, Status: {$ne: 'CLOSED'}, $or: [{callback: {$lt: new Date()}}, {callback: null}]};
			}

			if (req.query.fields) {
				fields = req.query.fields;
			}

			TicketModel.find(query, fields, function (err, doc) {
				if (err) {
					console.log(err);
					res.send(500, doc);
					return;
				}

				res.send(200, doc);
			});
		}
	},
	findOne: function (req, res) {
		TicketModel.findOne({_id: req.params.id}, function (err, ticket) {
			if (err)
				return res.send(500, err);
			if (!ticket)
				return res.send(404, 'Failed to load ticket ' + req.params.id);
			res.send(200, ticket);
		});
	},
	update: function (req, res) {
		TicketModel.findOne({_id: req.params.id}, function (err, ticket) {
			if (err)
				return res.send(500, err);
			if (!ticket)
				return res.send(404, 'Failed to load ticket ' + req.params.id);

			//console.log(req.body);

			ticket = _.extend(ticket, req.body);

			ticket.save(function (err) {
				return res.send(200, {_id: ticket._id});
			});
		});
	},
	del: function (req) {
		return req.body.models;
	},
	refreshTicket: function (userId, callback) {
		var socket = this.usersSocket[userId];
		if (socket) {
			socket.broadcast.emit('refreshTicket', {});
			socket.emit('refreshTicket', {});
		}
		callback();
	}
};
"use strict";

var mongoose = require('mongoose'),
		gridfs = require('../controllers/gridfs'),
		nodemailer = require("nodemailer"),
		_ = require('underscore'),
		config = require(__dirname + '/../../config');

var CommandeModel = mongoose.model('commande');
var ContactModel = mongoose.model('contact');
var ExtrafieldModel = mongoose.model('extrafields');

var smtpTransport = nodemailer.createTransport("SMTP", config.transport);

module.exports = function(app, passport, auth) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Commande', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});
	app.get('/api/commande/lines/list', auth.requiresLogin, object.listLines);
	//app.get('/api/commande/BL/pdf', auth.requiresLogin, object.genBlPDF);

	app.get('/api/commande', auth.requiresLogin, object.all);
	app.post('/api/commande', auth.requiresLogin, object.create);
	app.get('/api/commande/:orderId', auth.requiresLogin, object.show);
	app.put('/api/commande/:orderId', auth.requiresLogin, object.update);
	app.del('/api/commande/:orderId', auth.requiresLogin, object.destroy);
	app.post('/api/commande/file/:Id', auth.requiresLogin, object.createFile);
	app.get('/api/commande/file/:Id/:fileName', auth.requiresLogin, object.getFile);
	app.del('/api/commande/file/:Id/:fileName', auth.requiresLogin, object.deleteFile);

	//Finish with setting up the orderId param
	app.param('orderId', object.order);
	//other routes..
};

function Object() {
}

Object.prototype = {
	listLines: function(req, res) {
		CommandeModel.findOne({_id: req.query.id}, "lines", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.send(200, doc.lines);
		});
	},
	/**
	 * Find order by id
	 */
	order: function(req, res, next, id) {
		CommandeModel.findOne({_id: id}, function(err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return next(new Error('Failed to load order ' + id));
			req.order = doc;
			next();
		});
	},
	/**
	 * Create an order
	 */
	create: function(req, res) {
		var order = new CommandeModel(req.body);
		order.author = {};
		order.author.id = req.user._id;
		order.author.name = req.user.name;

		if (order.entity == null)
			order.entity = req.user.entity;

		if (req.user.societe.id) { // It's an external order
			return ContactModel.findOne({'societe.id': req.user.societe.id}, function(err, contact) {
				if (err)
					console.log(err);

				if (contact == null)
					contact = new ContactModel();

				contact.entity = req.user.entity;
				contact.firstname = req.user.firstname;
				contact.lastname = req.user.lastname;
				contact.email = req.user.email;


				contact.societe.id = req.user.societe.id;
				contact.societe.name = req.user.societe.name;

				contact.name = contact.firstname + " " + contact.lastname;


				//console.log(contact);
				contact.save(function(err, doc) {
					if (err)
						console.log(err);

					//console.log(doc);

					order.contact.id = doc._id;
					order.contact.name = doc.name;

					order.societe.id = req.user.societe.id;
					order.societe.name = req.user.societe.name;

					order.save(function(err) {
						if (err) {
							return console.log(err);
						} else {
							res.json(order);
						}
					});

				});
			});
		}

		order.save(function(err) {
			if (err) {
				return console.log(err);
			} else {
				if (req.user.societe.id) { // It's an external order
					console.log("Mail order");
					setTimeout(function(order, societe) {
						// Send an email
						var mailOptions = {
							from: "ERP Speedealing<no-reply@speedealing.com>",
							//to: "Christophe Courtens<christophe.courtens@chaumeil.net>",
							cc: "herve.prot@symeos.com",
							subject: "Nouvelle commande " + societe.name + " - " + order.ref + " dans l'ERP"
						};

						mailOptions.text = "La commande " + order.ref + " vient d'etre cree \n";
						mailOptions.text += "Pour consulter la commande cliquer sur ce lien : ";
						mailOptions.text += '<a href="http://erp.chaumeil.net/commande/fiche.php?id=' + order._id + '">' + order.ref + '</a>';
						mailOptions.text += "\n\n";

						// send mail with defined transport object
						smtpTransport.sendMail(mailOptions, function(error, response) {
							if (error) {
								console.log(error);
							} else {
								console.log("Message sent: " + response.message);
							}

							// if you don't want to use this transport object anymore, uncomment following line
							smtpTransport.close(); // shut down the connection pool, no more messages
						});
					}, 900000, order, req.user.societe); // Envoi un mail 15 min plus tard
				}

				res.json(order);
			}
		});
	},
	/**
	 * Update an order
	 */
	update: function(req, res) {
		var order = req.order;
		order = _.extend(order, req.body);
		order.save(function(err, doc) {
			res.json(doc);
		});
	},
	/**
	 * Delete an order
	 */
	destroy: function(req, res) {
		var order = req.order;
		order.remove(function(err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(order);
			}
		});
	},
	/**
	 * Show an order
	 */
	show: function(req, res) {
		res.json(req.order);
	},
	/**
	 * List of orders
	 */
	all: function(req, res) {
		CommandeModel.find({}, {}, function(err, orders) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(orders);
			}
		});
	},
	/**
	 * Add a file in an order
	 */
	createFile: function(req, res) {
		var id = req.params.Id;
		//console.log(id);
		//console.log(req.body);

		if (req.files && id) {
			//console.log(req.files);

			/* Add dossier information in filename */
			if (req.body.idx)
				req.files.file.originalFilename = req.body.idx + "___" + req.files.file.originalFilename;

			gridfs.addFile(CommandeModel, id, req.files.file, function(err, result) {
				//console.log(result);
				if (err)
					res.send(500, err);
				else
					res.send(200, result);
			});
		} else
			res.send(500, "Error in request file");
	},
	/**
	 * Get a file form an order
	 */
	getFile: function(req, res) {
		var id = req.params.Id;
		if (id && req.params.fileName) {

			gridfs.getFile(CommandeModel, id, req.params.fileName, function(err, store) {
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

	},
	/**
	 * Delete a file in an order
	 */
	deleteFile: function(req, res) {
		//console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.params.fileName && id) {
			gridfs.delFile(CommandeModel, id, req.params.fileName, function(err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "File not found");
	}

};

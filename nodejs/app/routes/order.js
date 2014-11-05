"use strict";

var mongoose = require('mongoose'),
		gridfs = require('../controllers/gridfs'),
		nodemailer = require("nodemailer"),
		smtpTransport = require('nodemailer-smtp-transport'),
		_ = require('lodash'),
		dateFormat = require('dateformat'),
		config = require(__dirname + '/../../config/config');

var CommandeModel = mongoose.model('commande');
var ContactModel = mongoose.model('contact');
var SocieteModel = mongoose.model('societe');

var Dict = require('../controllers/dict');

var smtpTransporter = nodemailer.createTransport(smtpTransport(config.transport));

module.exports = function (app, passport, auth) {

	var object = new Object();

	Dict.extrafield({extrafieldName: 'Commande'}, function (err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});
	app.get('/api/commande/lines/list', auth.requiresLogin, object.listLines);
	app.get('/api/commande', auth.requiresLogin, object.all);
	app.post('/api/commande', auth.requiresLogin, object.create);
	app.get('/api/commande/:orderId', auth.requiresLogin, object.show);
	app.put('/api/commande/:orderId', auth.requiresLogin, object.update);
	app.del('/api/commande/:orderId', auth.requiresLogin, object.destroy);
	app.put('/api/commande/:orderId/:field', auth.requiresLogin, object.updateField);
	app.post('/api/commande/file/:Id', auth.requiresLogin, object.createFile);
	app.get('/api/commande/file/:Id/:fileName', auth.requiresLogin, object.getFile);
	app.del('/api/commande/file/:Id/:fileName', auth.requiresLogin, object.deleteFile);
	app.get('/api/commande/pdf/:orderId', auth.requiresLogin, object.genPDF);
	
	app.post('/api/commande/file/:Id', auth.requiresLogin, function (req, res) {
		var id = req.params.Id;
		//console.log(id);

		if (req.files && id) {
			//console.log(req.files);

			gridfs.addFile(SocieteModel, id, req.files.file, function (err, result, file, update) {
				if (err)
					return res.send(500, err);

				return res.send(200, {status: "ok", file: file, update: update});
			});
		} else
			res.send(500, "Error in request file");
	});

	app.get('/api/commande/file/:Id/:fileName', auth.requiresLogin, function (req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {

			gridfs.getFile(SocieteModel, id, req.params.fileName, function (err, store) {
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

	app.del('/api/commande/file/:Id/:fileNames', auth.requiresLogin, function (req, res) {
		console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.params.fileNames && id) {
			gridfs.delFile(SocieteModel, id, req.params.fileNames, function (err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "File not found");
	});

	//Finish with setting up the orderId param
	app.param('orderId', object.order);
	//other routes..
};

function Object() {
}

Object.prototype = {
	listLines: function (req, res) {
		CommandeModel.findOne({_id: req.query.id}, "lines", function (err, doc) {
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
	order: function (req, res, next, id) {
		CommandeModel.findOne({_id: id}, function (err, doc) {
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
	create: function (req, res) {
		var order = new CommandeModel(req.body);
		order.author = {};
		order.author.id = req.user._id;
		order.author.name = req.user.name;

		if (order.entity == null)
			order.entity = req.user.entity;

		if (req.user.societe.id) { // It's an external order
			return ContactModel.findOne({'societe.id': req.user.societe.id}, function (err, contact) {
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
				contact.save(function (err, doc) {
					if (err)
						console.log(err);

					//console.log(doc);

					order.contact.id = doc._id;
					order.contact.name = doc.name;

					order.client.id = req.user.societe.id;
					order.client.name = req.user.societe.name;

					order.save(function (err, doc) {
						if (err)
							return console.log(err);

						res.json(doc);
					});

				});
			});
		}

		console.log(order);

		order.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(doc);
		});
	},
	/**
	 * Update an order
	 */
	update: function (req, res) {
		var order = req.order;
		order = _.extend(order, req.body);

		if (req.user.societe.id && order.Status == "NEW") { // It's an external order
			console.log("Mail order");

			// Send an email
			var mailOptions = {
				from: "ERP Speedealing<no-reply@speedealing.com>",
				to: "Plan 92 Chaumeil<plan92@imprimeriechaumeil.fr>",
				cc: "herve.prot@symeos.com",
				subject: "Nouvelle commande " + order.client.name + " - " + order.ref + " dans l'ERP"
			};

			mailOptions.text = "La commande " + order.ref + " vient d'etre cree \n";
			mailOptions.text += "Pour consulter la commande cliquer sur ce lien : ";
			mailOptions.text += '<a href="http://erp.chaumeil.net/commande/fiche.php?id=' + order._id + '">' + order.ref + '</a>';
			mailOptions.text += "\n\n";

			// send mail with defined transport object
			smtpTransporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log("Message sent: " + info.response);
				}

				// if you don't want to use this transport object anymore, uncomment following line
				smtpTransporter.close(); // shut down the connection pool, no more messages
			});
		}


		order.save(function (err, doc) {
			res.json(doc);
		});
	},
	updateField: function (req, res) {
		if (req.body.value) {
			var order = req.order;

			order[req.params.field] = req.body.value;

			order.save(function (err, doc) {
				res.json(doc);
			});
		} else
			res.send(500);
	},
	/**
	 * Delete an order
	 */
	destroy: function (req, res) {
		var order = req.order;
		order.remove(function (err) {
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
	show: function (req, res) {
		res.json(req.order);
	},
	/**
	 * List of orders
	 */
	all: function (req, res) {
		var query = {};

		if (req.query) {
			for (var i in req.query) {
				if (i == "query") {
					var status = ["SHIPPING", "CLOSED", "CANCELED", "BILLING"];

					switch (req.query[i]) {
						case "NOW" :
							query.Status = {"$nin": status};
							break;
						case "CLOSED" :
							query.Status = {"$in": status};
							break;
						default :
							break;
					}
				} else
					query[i] = req.query[i];
			}
		}

		CommandeModel.find(query, "-files -latex", function (err, orders) {
			if (err)
				return res.render('error', {
					status: 500
				});

			res.json(orders);
		});
	},
	/**
	 * Add a file in an order
	 */
	createFile: function (req, res) {
		var id = req.params.Id;
		//console.log(id);
		//console.log(req.body);

		if (req.files && id) {
			console.log("Add : " + req.files.file.originalFilename);

			/* Add dossier information in filename */
			if (req.body.idx)
				req.files.file.originalFilename = req.body.idx + "_" + req.files.file.originalFilename;

			gridfs.addFile(CommandeModel, id, req.files.file, function (err, result) {
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
	getFile: function (req, res) {
		var id = req.params.Id;
		if (id && req.params.fileName) {

			gridfs.getFile(CommandeModel, id, req.params.fileName, function (err, store) {
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
	deleteFile: function (req, res) {
		//console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.params.fileName && id) {
			gridfs.delFile(CommandeModel, id, req.params.fileName, function (err, result) {
				//console.log(result);
				if (err)
					res.send(500, err);
				else
					res.send(200, result);
			});
		} else
			res.send(500, "File not found");
	},
	genPDF: function (req, res) {
		var latex = require('../models/latex');

		latex.loadModel("order.tex", function (err, tex) {
			var doc = req.order;

			SocieteModel.findOne({_id: doc.client.id}, function (err, societe) {

				// replacement des variables
				tex = tex.replace(/--NUM--/g, doc.ref.replace(/_/g, "\\_"));
				tex = tex.replace(/--DESTINATAIRE--/g, "\\textbf{\\large " + societe.name + "} \\\\" + societe.address + "\\\\ \\textsc{" + societe.zip + " " + societe.town + "}");
				tex = tex.replace(/--CODECLIENT--/g, societe.code_client.replace(/_/g, "\\_"));
				tex = tex.replace(/--TITLE--/g, doc.ref_client);
				tex = tex.replace(/--DATEC--/g, dateFormat(doc.datec, "dd/mm/yyyy"));
				tex = tex.replace(/--DATEL--/g, dateFormat(doc.date_livraison, "dd/mm/yyyy"));

				//tex = tex.replace(/--NOTE--/g, doc.desc.replace(/\n/g, "\\\\"));
				tex = tex.replace(/--NOTE--/g, "");

				//console.log(doc);

				var products = [];

				for (var i = 0; i < doc.notes.length; i++)
					products.push(doc.notes[i]);

				//console.log(product);


				//console.log(products);

				var tab_latex = "";

				for (var i = 0; i < products.length; i++) {
					//tab_latex += products[i].title.replace(/_/g, "\\_") + "&" + products[i].note.replace(/<br\/>/g,"\\\\") + "& & \\tabularnewline\n";
					tab_latex += products[i].title.replace(/_/g, "\\_") + "&\\specialcell[t]{" + products[i].note.replace(/<br\/>/g, "\\\\").replace(/<br \/>/g, "\\\\").replace(/<p>/g, "").replace(/<\/p>/g, "\\\\").replace(/<a.*>/g, "\\\\").replace(/&/g, "\\&") + "}& & \\tabularnewline\n";
				}

				//tab_latex += "&\\specialcell[t]{" + doc.desc.replace(/\n/g, "\\\\") + "}& & \\tabularnewline\n";

				tex = tex.replace("--TABULAR--", tab_latex);

				latex.headfoot(doc.entity, tex, function (tex) {

					tex = tex.replace(/undefined/g, "");

					doc.latex.data = new Buffer(tex);
					doc.latex.createdAt = new Date();
					doc.latex.title = "Order " + doc.ref;

					doc.save(function (err) {
						if (err) {
							console.log("Error while trying to save this document");
							console.log(err);
							return res.send(403, "Error while trying to save this document");
						}

						latex.compileDoc(doc._id, doc.latex, function (result) {
							if (result.errors.length) {
								//console.log(pdf);
								return res.send(500, result.errors);
							}

							return latex.getPDF(result.compiledDocId, function (err, pdfPath) {
								res.type('application/pdf');
								res.attachment(doc.ref + ".pdf"); // for douwnloading
								res.sendfile(pdfPath);
							});
						});
					});
				});
			});
		});
	}
};

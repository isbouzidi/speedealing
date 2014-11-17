"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		i18n = require("i18next"),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var ReportModel = mongoose.model('report');
var ContactModel = mongoose.model('contact');
var ProductModel = mongoose.model('product');
var SocieteModel = mongoose.model('societe');

var Task = require('../controllers/task');

module.exports = function (app, passport, auth, usersSocket) {

	var object = new Object();


	app.get('/api/report/contacts', auth.requiresLogin, function (req, res) {

		if (req.query.societe === null)
			return res.send(200, {});

		console.log("contacts : " + req.query.contacts);
		var societe = req.query.societe;

		ContactModel.find({'societe.id': societe}, function (err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			return res.send(200, doc);

		});

	});

	// add or update potential attract
	app.put('/api/report/addProspectLevel', auth.requiresLogin, function (req, res) {

		var prospectLevel = req.query.prospectLevel;
		var societe = req.query.societe;

		SocieteModel.update({_id: societe}, {$set: {prospectlevel: prospectLevel}}, function (err, doc) {

			if (err) {
				return console.log('Erreur : ' + err);
			} else {

				res.json(200, doc);
			}
		});


	});

	//add new report
	app.post('/api/reports', auth.requiresLogin, function (req, res) {
		object.create(req, res, usersSocket);
	});

	//get all report of a company
	app.get('/api/report', auth.requiresLogin, object.read);

	//get reports of other users
	app.get('/api/reports/listReports', auth.requiresLogin, object.listReports);

	//app.get('/api/reports/convertTask', auth.requiresLogin, object.convertTask);

	//get report details
	app.get('/api/reports/:reportId', auth.requiresLogin, object.show);

	//update report
	app.put('/api/reports/:reportId', auth.requiresLogin, object.update);

	app.param('reportId', object.report);
};

function Object() {
}

Object.prototype = {
	report: function (req, res, next, id) {
		ReportModel.findOne({_id: id}, function (err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return next(new Error('Failed to load report ' + id));

			req.report = doc;
			next();
		});
	},
	create: function (req, res, usersSocket) {

		var reportModel = new ReportModel(req.body);
		//console.log(req.body);

		function object2array(input) {
			var out = [];
			for (var i in input) {
				input[i].id = i;
				out.push(input[i]);
			}
			return out;
		}

		object2array(req.body.actions).forEach(function (action) {
			if (!action.type || action.type == "NONE")
				return;

			//console.log(action);
			//console.log(actioncomm);

			var datef = null;
			
			if(action.datef)
				datef = action.datef;
			else if (!action.datep) {
				datef = new Date();
				datef.setDate(datef.getDate() + action.delay);
			}

			var task = {
				name: i18n.t("tasks:" + action.id) + " (" + req.body.societe.name + ")",
				societe: req.body.societe,
				contact: req.body.contacts[0] || null,
				datec: new Date(),
				datep: action.datep || null, // date de debut
				datef: datef || null,
				type: action.type,
				entity: req.user.entity,
				notes: [
					{
						author: {
							id: req.user._id,
							name: req.user.firstname + " " + req.user.lastname
						},
						datec: new Date(),
						percentage: 0,
						note: i18n.t("tasks:" + action.id) + " " + i18n.t("tasks:" + action.type) + "\nCompte rendu du " + dateFormat(req.body.datec, "dd/mm/yyyy")
					}
				],
				lead: req.body.lead
			};

			//console.log(task);

			Task.create(task, req.user, usersSocket, function (err, task) {
				if (err)
					console.log(err);
				//	console.log(task);
			});

		});

		reportModel.save(function (err, doc) {
			if (err) {
				//return res.json(500, err);
				return console.log(err);
			}

			res.json(200, doc);
		});
	},
	read: function (req, res) {
		var query = {};
		var fields = {};

		query = JSON.parse(req.query.find);

		if (req.query.fields) {
			fields = req.query.fields;
		}

		ReportModel.find(query, fields)
				.populate("lead.id", "status")
				.exec(function (err, doc) {
					if (err) {
						console.log(err);
						res.send(500, doc);
						return;
					}

					res.send(200, doc);
				});
	},
	show: function (req, res) {
		//console.log("show : " + req.report);
		res.json(req.report);
	},
	listReports: function (req, res) {

		var user = req.query.user;

		var query = {
			"author.id": {
				"$nin": [user]
			},
			entity: req.query.entity
		};
		ReportModel.find(query, {}, {limit: req.query.limit, sort: {
				createdAt: -1 //Sort by Date created DESC
			}}, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.send(200, doc);
		});
	},
	update: function (req, res) {

		var report = req.report;
		report = _.extend(report, req.body);

		report.save(function (err, doc) {

			if (err) {
				return console.log(err);
			}

			res.json(200, doc);
		});
	},
	/*convertTask: function (req, res) {
	 ReportModel.aggregate([
	 {$match: {"actions.0": {$exists: true}}},
	 {$unwind: "$actions"}
	 ], function (err, docs) {
	 if (err)
	 console.log(err);
	 
	 docs.forEach(function (doc) {
	 
	 console.log(doc);
	 
	 var task = {
	 societe: doc.societe,
	 contact: doc.contacts[0] || null,
	 datec: doc.createdAt,
	 datep: doc.dueDate,
	 datef: doc.dueDate,
	 entity: doc.entity,
	 author: doc.author,
	 usertodo: doc.author,
	 notes: [
	 {
	 author: doc.author,
	 datec: doc.createdAt,
	 percentage: 0
	 }
	 ],
	 lead: doc.leads || null
	 };
	 
	 switch (doc.actions.type) {
	 case "Réunion interne":
	 task.type = "AC_INTERNAL";
	 break;
	 case "plaquette":
	 task.type = "AC_DOC";
	 break;
	 case "prochain rendez-vous":
	 task.type = "AC_PRDV";
	 break;
	 case "Rendez-vous":
	 task.type = "AC_RDV";
	 break;
	 case "offre":
	 task.type = "AC_PROP";
	 break;
	 case "visite atelier":
	 task.type = "AC_AUDIT";
	 break;
	 case "prochaine action":
	 task.type = "AC_REVIVAL";
	 break;
	 default:
	 console.log("Manque " + doc.actions.type);
	 }
	 
	 task.name = i18n.t("tasks:" + task.type) + " (" + doc.societe.name + ")";
	 task.notes[0].note = doc.actions.type + " " + i18n.t("tasks:" + task.type) + "\nCompte rendu du " + dateFormat(task.datec, "dd/mm/yyyy");
	 
	 console.log(task);
	 
	 Task.create(task, null, null, function (err, task) {
	 if (err)
	 console.log(err);
	 //	console.log(task);
	 });
	 
	 });
	 res.send(200);
	 });
	 }*/
};
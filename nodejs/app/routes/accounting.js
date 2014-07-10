"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		async = require('async');

var BillModel = mongoose.model('bill');
var SocieteModel = mongoose.model('societe');
var ProductModel = mongoose.model('product');

module.exports = function(app, passport, auth) {

	var object = new Object();

	app.get('/api/accounting', auth.requiresLogin, object.read);
	app.post('/api/accounting', auth.requiresLogin, object.create);

	//other routes..
};

function Object() {
}

Object.prototype = {
	bill: function(req, res, next, id) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {ref: id};

		//console.log(query);

		BillModel.findOne(query, "-latex", function(err, doc) {
			if (err)
				return next(err);

			req.bill = doc;

			//console.log(doc);
			next();
		});
	},
	read: function(req, res) {
		var dateStart = new Date(req.query.year, parseInt(req.query.month) - 1, 1);
		var dateEnd = new Date(req.query.year, parseInt(req.query.month), 1);

		var query = {
			entity: req.query.entity,
			total_ttc: {$ne: 0},
			datec: {'$gte': dateStart, '$lt': dateEnd},
			Status: {$ne: "DRAFT"}
		};

		var result = [];

		BillModel.find(query, "ref title client datec total_ttc total_tva lines", {sort: {datec: 1}}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			async.eachSeries(doc, function(bill, callback) {

				//console.log(bill);

				SocieteModel.findOne({_id: bill.client.id}, "code_compta name", function(err, societe) {
					//console.log(societe);

					// ligne client
					var line = {
						datec: bill.datec,
						journal: "VTE",
						compte: societe.code_compta,
						piece: parseInt(bill.ref.substr(7)),
						libelle: bill.ref + " " + societe.name,
						debit: 0,
						credit: 0,
						monnaie: "E"
					};

					if (bill.total_ttc > 0)
						line.debit = bill.total_ttc;
					else
						line.credit = Math.abs(bill.total_ttc);

					result.push(line);

					async.each(bill.lines, function(lineBill, cb) {

						//lignes produit
						ProductModel.findOne({_id: lineBill.product.id}, "", function(err, product) {
							if (err)
								return cb(err);

							var line = {};

							if (product == null)
								line = {
									datec: bill.datec,
									journal: "VTE",
									compte: null,
									piece: parseInt(bill.ref.substr(7)),
									libelle: bill.ref + ' ' + lineBill.product.name + ' (INCONNU)',
									debit: 0,
									credit: 0,
									monnaie: "E"
								};
							else
								line = {
									datec: bill.datec,
									journal: "VTE",
									compte: product.compta_sell,
									piece: parseInt(bill.ref.substr(7)),
									libelle: bill.ref + " " + lineBill.product.name + " " + societe.name,
									debit: 0,
									credit: 0,
									monnaie: "E"
								};

							if (lineBill.total_ht > 0)
								line.credit = lineBill.total_ht;
							else
								line.debit = Math.abs(lineBill.total_ht);

							//console.log(line);
							result.push(line);
							cb();
						});
					}, function(err) {
						if (err)
							return callback(err);

						//lignes TVA
						for (var i = 0; i < bill.total_tva.length; i++) {
							var line = {
								datec: bill.datec,
								journal: "VTE",
								compte: "445782",
								piece: parseInt(bill.ref.substr(7)),
								libelle: bill.ref + " " + societe.name,
								debit: 0,
								credit: 0,
								monnaie: "E"
							};

							if (bill.total_tva[i].total > 0)
								line.credit = bill.total_tva[i].total;
							else
								line.debit = Math.abs(bill.total_tva[i].total);

							result.push(line);
						}

						callback();
					});
				});
			}, function(err) {
				if (err)
					console.log(err);
				//console.log(doc);

				if (req.query.csv) {
					var tab_csv = {};
					for (var i = 0; i < result.length; i++) {
						if (tab_csv[result[i].piece] == null) {
							tab_csv[result[i].piece] = {};
						}

						if (tab_csv[result[i].piece][result[i].compte] == null) {
							tab_csv[result[i].piece][result[i].compte] = result[i];
						} else {
							tab_csv[result[i].piece][result[i].compte].debit += result[i].debit;
							tab_csv[result[i].piece][result[i].compte].credit += result[i].credit;
						}
					}


					var out = "";

					//entete
					out += "Date;Journal;compte;Numéro de piéce;Libellé;Débit;Crédit;Monnaie\n";

					var debit = 0;
					var credit = 0;

					for (var i in tab_csv) {
						for (var j in tab_csv[i]) {
							out += dateFormat(tab_csv[i][j].datec, "dd/mm/yyyy");
							out += ";" + tab_csv[i][j].journal;
							out += ";" + tab_csv[i][j].compte;
							out += ";" + tab_csv[i][j].piece;
							out += ";" + tab_csv[i][j].libelle;
							out += ";" + Math.round(tab_csv[i][j].debit * 100) / 100;
							out += ";" + Math.round(tab_csv[i][j].credit * 100) / 100;
							out += ";" + tab_csv[i][j].monnaie;
							out += "\n";

							debit += tab_csv[i][j].debit;
							credit += tab_csv[i][j].credit;
						}
					}

					console.log("Debit : " + debit);
					console.log("Credit : " + credit);

					res.attachment('VTE_' + dateStart.getFullYear().toString() + "_" + (dateStart.getMonth() + 1).toString() + ".csv");
					res.send(200, out);

				} else
					res.json(200, result);
			});
		});
	},
	create: function(req, res) {
		var bill = {};
		if (req.query.clone) {
			bill = req.bill.toObject();
			delete bill._id;
			delete bill.__v;
			delete bill.ref;
			delete bill.createdAt;
			delete bill.updatedAt;
			bill.Status = "DRAFT";
			bill.notes = [];
			bill.latex = {};
			bill.datec = new Date();

			bill = new BillModel(bill);
		} else
			bill = new BillModel(req.body);

		bill.author = {};
		bill.author.id = req.user._id;
		bill.author.name = req.user.name;

		if (bill.entity == null)
			bill.entity = req.user.entity;

		//console.log(bill);
		bill.save(function(err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(bill);
		});
	}
};
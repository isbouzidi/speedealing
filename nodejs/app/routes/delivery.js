"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		async = require('async'),
		latex = require('../models/latex');

var DeliveryModel = mongoose.model('delivery');
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var ProductModel = mongoose.model('product');
var FactureModel = mongoose.model('bill');

var Dict = require('../controllers/dict');

module.exports = function (app, passport, auth) {

	var object = {};
	var billing = new Billing();

	app.get('/api/delivery', auth.requiresLogin, object.read);
	app.get('/api/delivery/caFamily', auth.requiresLogin, object.caFamily);
	app.get('/api/delivery/pdf/:deliveryId', auth.requiresLogin, object.pdf);

	// list for autocomplete
	app.post('/api/delivery/autocomplete', auth.requiresLogin, function (req, res) {
		console.dir(req.body.filter);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {
			"$or": [
				{name: new RegExp(req.body.filter.filters[0].value, "i")},
				{ref: new RegExp(req.body.filter.filters[0].value, "i")}
			]
		};

		if (req.query.fournisseur) {
			query.fournisseur = req.query.fournisseur;
		} else // customer Only
			query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};

		console.log(query);
		DeliveryModel.find(query, {}, {limit: req.body.take}, function (err, docs) {
			if (err) {
				console.log("err : /api/delivery/autocomplete");
				console.log(err);
				return;
			}

			var result = [];

			if (docs !== null)
				for (var i in docs) {
					//console.log(docs[i].ref);
					result[i] = {};
					result[i].name = docs[i].name;
					result[i].id = docs[i]._id;
					if (docs[i].cptBilling.id == null) {
						result[i].cptBilling = {};
						result[i].cptBilling.name = docs[i].name;
						result[i].cptBilling.id = docs[i]._id;
					} else
						result[i].cptBilling = docs[i].cptBilling;

					if (docs[i].price_level)
						result[i].price_level = docs[i].price_level;
					else
						result[i].price_level = "BASE";

					// add address
					result[i].address = {};
					result[i].address.name = docs[i].name;
					result[i].address.address = docs[i].address;
					result[i].address.zip = docs[i].zip;
					result[i].address.town = docs[i].town;
					result[i].address.country = docs[i].country;
				}

			return res.send(200, result);
		});
	});

	// recupere la liste des courses pour verification
	app.get('/api/delivery/billing', auth.requiresLogin, billing.read);

	// Genere la facturation des BL en groupe
	app.post('/api/delivery/billing', auth.requiresLogin, billing.createAll);

	app.get('/api/delivery/billing/ca', auth.requiresLogin, billing.familyCA);

	app.post('/api/delivery', auth.requiresLogin, object.create);
	app.get('/api/delivery/:deliveryId', auth.requiresLogin, object.show);
	app.post('/api/delivery/:deliveryId', auth.requiresLogin, function (req, res) {
		if (req.query.method)
			switch (req.query.method) {
				case "clone" :
					object.clone(req, res);
					break;
				case "bill" :
					billing.create(req, res);
					break;
			}
	});
	app.put('/api/delivery/:deliveryId', auth.requiresLogin, object.update);
	app.del('/api/delivery/:deliveryId', auth.requiresLogin, object.destroy);
	app.param('deliveryId', object.delivery);

	//other routes..
};

function Object() {
}

Object.prototype = {
	delivery: function (req, res, next, id) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {ref: id};

		//console.log(query);

		DeliveryModel.findOne(query, "-latex")
				.populate("orders", "ref ref_client total_ht")
				.exec(function (err, doc) {
					if (err)
						return next(err);

					req.delivery = doc;

					//console.log(doc);
					next();
				});
	},
	read: function (req, res) {

		var query = {};

		if (req.query) {
			for (var i in req.query) {
				if (i === "query") {
					switch (req.query.query) {
						case "ENCOURS" :
							query.Status = {"$nin": ["BILLED", "CANCELED"]};
							break;
						default :
							break;
					}
				} else
					query[i] = req.query[i];
			}
		}

		DeliveryModel.find(query, "-history -files -latex", function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);

			res.json(200, doc);
		});
	},
	show: function (req, res) {
		res.json(req.delivery);
	},
	create: function (req, res) {
		var delivery = {};
		delivery = new DeliveryModel(req.body);

		delivery.author = {};
		delivery.author.id = req.user._id;
		delivery.author.name = req.user.name;

		if (delivery.entity == null)
			delivery.entity = req.user.entity;

		//console.log(delivery);
		delivery.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(delivery);
		});
	},
	clone: function (req, res) {
		var delivery = {};

		delivery = req.delivery.toObject();
		delete delivery._id;
		delete delivery.__v;
		delete delivery.ref;
		delete delivery.createdAt;
		delete delivery.updatedAt;
		delivery.Status = "DRAFT";
		delivery.notes = [];
		delivery.latex = {};
		delivery.datec = new Date();

		delivery = new DeliveryModel(delivery);

		delivery.author = {};
		delivery.author.id = req.user._id;
		delivery.author.name = req.user.name;

		if (delivery.entity == null)
			delivery.entity = req.user.entity;

		//console.log(delivery);
		delivery.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(delivery);
		});
	},
	update: function (req, res) {
		var delivery = req.delivery;
		//console.log(req.body);
		delivery = _.extend(delivery, req.body);

		delivery.save(function (err, doc) {
			if (err)
				console.log(err);

			//console.log(doc);
			res.json(doc);
		});
	},
	destroy: function (req, res) {
		var delivery = req.delivery;
		delivery.remove(function (err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(delivery);
			}
		});
	},
	pdf: function (req, res) {
		// Generation de la livraison PDF et download

		var fk_livraison;
		Dict.extrafield({extrafieldName: 'BonLivraison'}, function (err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			fk_livraison = doc;
		});

		var cond_reglement_code = {};
		Dict.dict({dictName: "fk_payment_term", object: true}, function (err, docs) {
			cond_reglement_code = docs;
		});

		var mode_reglement_code = {};
		Dict.dict({dictName: "fk_paiement", object: true}, function (err, docs) {
			mode_reglement_code = docs;
		});

		latex.loadModel("delivery.tex", function (err, tex) {

			var doc = req.delivery;

			if (doc.Status === "DRAFT") {
				res.type('html');
				return res.send(500, "Impossible de générer le PDF, le bon livraison n'est pas validé");
			}

			SocieteModel.findOne({_id: doc.client.id}, function (err, societe) {

				// replacement des variables
				tex = tex.replace(/--NUM--/g, doc.ref);
				tex = tex.replace(/--DESTINATAIRE--/g, "\\textbf{\\large " + doc.client.name + "} \\\\" + doc.address + "\\\\ \\textsc{" + doc.zip + " " + doc.town + "}");
				tex = tex.replace(/--CODECLIENT--/g, societe.code_client);
				tex = tex.replace(/--TITLE--/g, doc.title);
				tex = tex.replace(/--REFCLIENT--/g, doc.ref_client);
				tex = tex.replace(/--DATEC--/g, dateFormat(doc.datec, "dd/mm/yyyy"));
				tex = tex.replace(/--DATEECH--/g, dateFormat(doc.dater, "dd/mm/yyyy"));

				tex = tex.replace(/--REGLEMENT--/g, cond_reglement_code.values[doc.cond_reglement_code].label);

				tex = tex.replace(/--PAID--/g, mode_reglement_code.values[doc.mode_reglement_code].label);

				switch (doc.mode_reglement_code) {
					case "VIR" :
						tex = tex.replace(/--BK--/g, "\\\\ --IBAN--");
						break;

					case "CHQ" :
						tex = tex.replace(/--BK--/g, "A l'ordre de --ENTITY--");
						break;

					default :
						tex = tex.replace(/--BK--/g, "");
				}
				//tex = tex.replace(/--NOTE--/g, doc.desc.replace(/\n/g, "\\\\"));
				tex = tex.replace(/--NOTE--/g, "");

				//console.log(doc);

				var tab_latex = "";
				for (var i = 0; i < doc.lines.length; i++) {
					tab_latex += doc.lines[i].product.name.substring(0, 11).replace(/_/g, "\\_").replace(/%/gi, "\\%") + "&\\specialcell[t]{\\textbf{" + doc.lines[i].product.label.replace(/%/gi, "\\%") + "}\\\\" + doc.lines[i].description.replace(/\n/g, "\\\\").replace(/%/gi, "\\%").replace(/&/gi, "\\&") + "\\\\}&" + doc.lines[i].no_package + "&" + latex.number(doc.lines[i].qty, 3) + (doc.lines[i].units ? " " + doc.lines[i].units : " kg") + "\\tabularnewline\n";
				}
				//console.log(products)
				//console.log(tab_latex);
				//return;

				tex = tex.replace("--TABULAR--", tab_latex);

				tab_latex = "";
				tab_latex += "Total HT &" + latex.price(doc.total_ht) + "\\tabularnewline\n";
				for (var i = 0; i < doc.total_tva.length; i++) {
					tab_latex += "Total TVA " + doc.total_tva[i].tva_tx + "\\% &" + latex.price(doc.total_tva[i].total) + "\\tabularnewline\n";
				}
				tab_latex += "\\vhline\n";
				tab_latex += "Total TTC &" + latex.price(doc.total_ttc) + "\\tabularnewline\n";
				//Payé & --PAYE--\\ 
				tex = tex.replace("--TOTAL--", tab_latex);

				tex = tex.replace(/--APAYER--/g, latex.price(doc.total_ttc));

				latex.headfoot(doc.entity, tex, function (tex) {

					tex = tex.replace(/undefined/g, "");

					doc.latex.data = new Buffer(tex);
					doc.latex.createdAt = new Date();
					doc.latex.title = "Livraison - " + doc.ref;

					doc.save(function (err) {
						if (err) {
							console.log("Error while trying to save this document");
							res.send(403, "Error while trying to save this document");
						}

						latex.compileDoc(doc._id, doc.latex, function (result) {
							if (result.errors.length) {
								//console.log(pdf);
								return res.send(500, result.errors);
							}
							return latex.getPDF(result.compiledDocId, function (err, pdfPath) {
								res.type('application/pdf');
								//res.attachment(doc.ref + ".pdf"); // for douwnloading
								res.sendfile(pdfPath);
							});
						});
					});
				});
			});
		});
	},
	caFamily: function (req, res) {

		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), parseInt(d.getMonth() - 1, 10), 1);
		var dateEnd = new Date(d.getFullYear(), d.getMonth(), 1);

		var ca = {};

		async.parallel({
			caFamily: function (cb) {
				DeliveryModel.aggregate([
					{$match: {Status: {'$ne': 'DRAFT'}, entity: req.user.entity, datec: {'$gte': dateStart, '$lt': dateEnd}}},
					{$unwind: "$lines"},
					{$project: {_id: 0, lines: 1}},
					{$group: {_id: "$lines.product.name", total_ht: {"$sum": "$lines.total_ht"}}}
				], function (err, doc) {
					if (err) {
						return cb(err);
					}

					//console.log(doc);
					cb(null, doc);
				});
			}
			/*familles: function(cb) {
			 CoursesModel.aggregate([
			 {$match: {Status: {'$ne': 'REFUSED'}, total_ht: {'$gt': 0}, date_enlevement: {'$gte': dateStart, '$lt': dateEnd}}},
			 {$project: {_id: 0, type: 1, total_ht: 1}},
			 {$group: {_id: "$type", sum: {"$sum": "$total_ht"}}}
			 ], function(err, doc) {
			 if (doc.length == 0)
			 return cb(0);
			 
			 //console.log(doc);
			 cb(null, doc);
			 });
			 }*/
		}, function (err, results) {
			if (err)
				return console.log(err);

			//console.log(results);
			async.each(results.caFamily, function (product, callback) {
				//console.log(product);
				ProductModel.findOne({ref: product._id}, function (err, doc) {
					if (!doc)
						console.log(product);

					product.caFamily = doc.caFamily;

					if (typeof ca[doc.caFamily] === "undefined")
						ca[doc.caFamily] = 0;

					ca[doc.caFamily] += product.total_ht;
					//console.log(ca);

					callback();
				});

			}, function (err) {

				var result = [];
				for (var i in ca) {
					result.push({
						family: i,
						total_ht: ca[i]
					});
				}

				//console.log(results);

				res.json(200, result);
			});
		});
	}
};

/**
 * Calcul des donnees de facturation
 */

function Billing() {
}

Billing.prototype = {
	read: function (req, res) {

		var result = {
			GroupBL: {},
			GroupOrder: {}
		};

		var project = {};
		var fields = req.query.fields.split(" ");
		for (var i in fields) {
			project[fields[i].trim()] = 1;
		}

		DeliveryModel.aggregate([
			{$match: {Status: "SEND", entity: req.query.entity, datedl: {$lte: new Date(req.query.dateEnd)}}},
			{$project: project}
		])
				.unwind('lines')

				//.populate("orders", "ref ref_client total_ht")
				.exec(function (err, docs) {
					if (err)
						return console.log(err);

					//console.log(docs);
					result.GroupBL = docs;
					res.json(result);
				});
	},
	create: function (req, res) {

		var delivery = req.delivery;

		SocieteModel.findOne({_id: req.delivery.client.cptBilling.id}, function (err, societe) {
			var bill = new FactureModel();

			bill.client = {
				id: societe._id,
				name: societe.name
			};

			if (societe == null)
				console.log("Error : pas de societe pour le clientId : " + req.delivery.client.cptBilling.id);

			bill.price_level = societe.price_level;
			bill.mode_reglement_code = societe.mode_reglement;
			bill.cond_reglement_code = societe.cond_reglement;
			bill.commercial_id = societe.commercial_id;
			bill.datec = new Date();

			bill.entity = societe.entity;

			bill.address = societe.address;
			bill.zip = societe.zip;
			bill.town = societe.town;

			bill.shipping = delivery.shipping;

			bill.deliveries.push(delivery._id);
			if (delivery.order)
				bill.orders.push(delivery.order);

			bill.lines = delivery.lines;

			delivery.Status = 'BILLED';
			delivery.save(function (err, delivery) {
			});

			bill.save(function (err, bill) {
				if (err)
					console.log(err);

				res.json(bill);
			});
		});

		//res.send(200);
	},
	createAll: function (req, res) {
		//console.log(req.body.dateEnd);

		DeliveryModel.aggregate([
			{"$match": {Status: "SEND", entity: req.body.entity, datedl: {$lte: new Date(req.body.dateEnd)}}},
			{"$project": {"datec": 1, datedl: 1, "shipping": 1, "lines": 1, "ref": 1, "societe": "$client.cptBilling"}},
			{"$sort": {datedl: 1}},
			//{"$unwind": "$lines"},
			{"$group": {"_id": "$societe.id", "data": {"$push": "$$ROOT"}}}
		], function (err, docs) {
			if (err)
				return console.log(err);

			//console.log(docs)

			// Creation des factures
			async.each(docs, function (client, callback) {

				SocieteModel.findOne({_id: client._id}, function (err, societe) {

					var datec = new Date(req.body.dateEnd);

					var facture = new FactureModel({
						title: {
							ref: "BL" + dateFormat(datec, "dd/mm/yyyy"),
							autoGenerated: true
						},
						client: {
							id: client._id
						},
						type: 'INVOICE_AUTO'
					});

					if (societe == null)
						console.log("Error : pas de societe pour le clientId : " + client._id);

					facture.client.name = societe.name;
					facture.price_level = societe.price_level;
					facture.mode_reglement_code = societe.mode_reglement;
					facture.cond_reglement_code = societe.cond_reglement;
					facture.commercial_id = societe.commercial_id;
					facture.datec = datec;

					facture.entity = req.body.entity;

					facture.address = societe.address;
					facture.zip = societe.zip;
					facture.town = societe.town;

					facture.lines = [];

					var deliveries_id = [];

					for (var i in client.data) {
						//console.log(client.data[i]);

						for (var j = 0; j < client.data[i].lines.length; j++) {
							var aline = client.data[i].lines[j];
							aline.description += "\n" + client.data[i].ref + " (" + dateFormat(client.data[i].datec, "dd/mm/yyyy") + ")";
							facture.lines.push(aline);
						}

						facture.shipping.total_ht += client.data[i].shipping.total_ht;
						facture.shipping.total_tva += client.data[i].shipping.total_tva;

						deliveries_id.push(client.data[i]._id.toString());

					}

					facture.deliveries = _.uniq(deliveries_id, true);

					facture.save(function (err, bill) {
						for (var i = 0; i < bill.deliveries.length; i++) {
							DeliveryModel.update({_id: bill.deliveries[i]}, {$set: {Status: "BILLED"}}, function (err) {
								if (err)
									console.log(err);
							});
						}
						callback();
					});
				});

			}, function (err) {
				if (err)
					console.log(err);

				res.send(200);

			});

		});
	},
	familyCA: function (req, res) {
		var result = [];
		var dateStart = new Date();
		dateStart.setHours(0, 0, 0, 0);
		dateStart.setMonth(0);
		dateStart.setDate(1);

		var family = ["MESSAGERIE", "AFFRETEMENT", "COURSE", "REGULIER"];
		async.parallel({
			cafamily: function (cb) {
				var result = {};
				//init CA

				for (var i = 0; i < family.length; i++) {
					result[family[i]] = [];
					for (var m = 0; m < 12; m++)
						result[family[i]].push(0);
				}

				/*
				 * Error $month operator with GMT !!!
				 * See https://jira.mongodb.org/browse/SERVER-6310
				 * 
				 * 
				 CoursesModel.aggregate([
				 {$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
				 {$project: {total_ht: 1, type: 1, date_enlevement: 1}},
				 {$group: {
				 _id: {
				 type: "$type",
				 month: {$month: "$date_enlevement"}
				 },
				 total_ht: {$sum: "$total_ht"},
				 marge: {$sum: "$commission"}
				 }
				 }
				 ], function(err, docs) {
				 if (err)
				 console.log(err);
				 
				 console.log(docs);
				 
				 for (var i = 0; i < docs.length; i++) {
				 result[docs[i]._id.type][docs[i]._id.month - 1] = docs[i].total_ht;
				 }
				 
				 
				 console.log(result);
				 
				 cb(null, result);
				 });
				 */

				CoursesModel.find({Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}},
				{total_ht: 1, type: 1, date_enlevement: 1}, function (err, docs) {
					if (err)
						console.log(err);

					//console.log(docs);

					for (var i = 0; i < docs.length; i++) {

						result[docs[i].type][docs[i].date_enlevement.getMonth()] += docs[i].total_ht;
					}


					//console.log(result);

					cb(null, result);
				});

			},
			caMonth: function (cb) {
				var result = {};
				result.total = [];
				result.sum = [];
				for (var m = 0; m < 12; m++)
					result.total.push(0);

				/*CoursesModel.aggregate([
				 {$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
				 {$project: {total_ht: 1, date_enlevement: 1}},
				 {$group: {
				 _id: {
				 $month: "$date_enlevement"
				 },
				 total_ht: {$sum: "$total_ht"}}
				 }
				 ], function(err, docs) {*/
				CoursesModel.find({Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}},
				{total_ht: 1, date_enlevement: 1},
				function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						result.total[docs[i].date_enlevement.getMonth()] += docs[i].total_ht;
					}

					//apply sum on ca
					for (var i = 0; i < 12; i++)
						if (i === 0)
							result.sum[i] = result.total[i];
						else
							result.sum[i] = result.total[i] + result.sum[i - 1];

					cb(null, result);
				});
			},
			caCumul: function (cb) {
				var result = [];
				for (var m = 0; m < 12; m++)
					result.push(0);

				/*CoursesModel.aggregate([
				 {$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
				 {$project: {total_ht: 1, date_enlevement: 1}},
				 {$group: {
				 _id: {
				 $month: "$date_enlevement"
				 },
				 total_ht: {$sum: "$total_ht"}
				 }
				 }*/
				CoursesModel.find({Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}},
				{total_ht: 1, date_enlevement: 1},
				function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						result[docs[i].date_enlevement.getMonth()] += docs[i].total_ht;
					}

					cb(null, result);
				});
			}, caTotalfamily: function (cb) {
				var result = [];

				CoursesModel.aggregate([
					{$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
					{$project: {total_ht: 1, type: 1, date_enlevement: 1}}, {$group: {_id: "$type",
							total_ht: {$sum: "$total_ht"}
						}
					}
				], function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						result.push({
							name: docs[i]._id, y: docs[i].total_ht
						});
					}

					cb(null, result);
				});
			}
		},
		function (err, results) {
			var result = [];
			if (err)
				return console.log(err);

			for (var i in results.cafamily)
				result.push({
					type: 'column',
					name: i, data: results.cafamily[i]
				});

			result.push({
				type: 'spline',
				name: 'CA mensuel N',
				yAxis: 1,
				data: results.caMonth.total,
				marker: {
					lineWidth: 2,
					fillColor: '#4572A7'
				}
			});

			/*result.push({
			 type: 'spline',
			 name: 'CA cumulé',
			 data: results.caMonth.sum,
			 marker: {
			 lineWidth: 2,
			 fillColor: 'white'
			 }
			 });*/

			result.push({
				type: 'spline',
				name: 'CA mensuel N-1',
				yAxis: 1,
				data: [226181, 219052, 225464, 126920, 207904, 223189, 246774, 213849, 221774, 239235, 215774, 235522],
				marker: {
					lineWidth: 2,
					fillColor: '#4572A7'
				}
			});

			result.push({
				type: 'pie',
				name: 'Total par famille', data: results.caTotalfamily,
				center: [80, 40],
				size: 100,
				showInLegend: false,
				dataLabels: {
					enabled: false
				}
			});

			res.json(result);
			/*res.json(
			 [{
			 type: 'column',
			 name: 'Jane',
			 data: [3, 2, 1, 3, 4]
			 }, {
			 type: 'column',
			 name: 'John',
			 data: [2, 3, 5, 7, 6]
			 }, {
			 type: 'column',
			 name: 'Joe',
			 data: [4, 3, 3, 9, 0]
			 }, {
			 type: 'spline',
			 name: 'Average',
			 data: [3, 2.67, 3, 6.33, 3.33],
			 marker: {
			 lineWidth: 2,
			 fillColor: 'white'
			 }
			 }, {
			 type: 'pie',
			 name: 'Total family',
			 data: [{
			 name: 'Jane',
			 y: 13,
			 }, {
			 name: 'John',
			 y: 23,
			 }, {
			 name: 'Joe',
			 y: 19,
			 }],
			 center: [100, 40],
			 size: 100,
			 showInLegend: false,
			 dataLabels: {
			 enabled: false 			 }
			 }]
			 );*/
		});
	}
};

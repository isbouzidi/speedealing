"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		async = require('async'),
		latex = require('../models/latex');

var BillModel = mongoose.model('bill');
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var ProductModel = mongoose.model('product');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

module.exports = function(app, passport, auth) {

	var object = new Object();

	app.get('/api/bill', auth.requiresLogin, object.read);
	app.get('/api/bill/caFamily', auth.requiresLogin, object.caFamily);
	app.get('/api/bill/:billId', auth.requiresLogin, object.show);
	app.post('/api/bill', auth.requiresLogin, object.create);
	app.put('/api/bill/:billId', auth.requiresLogin, object.update);
	app.del('/api/bill/:billId', auth.requiresLogin, object.destroy);
	app.get('/api/bill/pdf/:billId', auth.requiresLogin, object.pdf);
	app.get('/api/bill/fk_extrafields/select', auth.requiresLogin, object.select);

	// list for autocomplete
	app.post('/api/bill/autocomplete', auth.requiresLogin, function(req, res) {
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
		BillModel.find(query, {}, {limit: req.body.take}, function(err, docs) {
			if (err) {
				console.log("err : /api/bill/autocomplete");
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

	app.param('billId', object.bill);

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
		var query = {};

		if (req.query) {
			for (var i in req.query) {
				if (i == "query") {
					switch (req.query.query) {
						case "NOTPAID" :
							query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};
							break;
						default :
							break;
					}
				} else
					query[i] = req.query[i];
			}
		}

		BillModel.find(query, "-history -files -latex", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);

			res.json(200, doc);
		});
	},
	show: function(req, res) {
		res.json(req.bill);
	},
	create: function(req, res) {
		var bill = new BillModel(req.body);
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
	},
	update: function(req, res) {
		var bill = req.bill;
		//console.log(req.body);
		bill = _.extend(bill, req.body);

		bill.save(function(err, doc) {
			if (err)
				console.log(err);

			//console.log(doc);
			res.json(doc);
		});
	},
	destroy: function(req, res) {
		var bill = req.bill;
		bill.remove(function(err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(bill);
			}
		});
	},
	select: function(req, res) {
		ExtrafieldModel.findById('extrafields:Facture', function(err, doc) {
			if (err) {
				console.log(err);
				return;
			}
			var result = [];
			if (doc.fields[req.query.field].dict)
				return DictModel.findOne({_id: doc.fields[req.query.field].dict}, function(err, docs) {

					if (docs) {
						for (var i in docs.values) {
							if (docs.values[i].enable) {
								var val = {};
								val.id = i;
								if (docs.values[i].label)
									val.label = docs.values[i].label;
								else
									val.label = req.i18n.t("bills:" + i);
								result.push(val);
							}
						}
						doc.fields[req.query.field].values = result;
					}

					res.json(doc.fields[req.query.field]);
				});

			for (var i in doc.fields[req.query.field].values) {
				if (doc.fields[req.query.field].values[i].enable) {
					var val = {};
					val.id = i;
					val.label = req.i18n.t("bills:" + doc.fields[req.query.field].values[i].label);
					result.push(val);
				}
			}
			doc.fields[req.query.field].values = result;

			res.json(doc.fields[req.query.field]);
		});
	},
	pdf: function(req, res) {
		// Generation de la facture PDF et download

		var fk_facture;
		ExtrafieldModel.findById('extrafields:Facture', function(err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			fk_facture = doc;
		});

		var cond_reglement_code = {};
		DictModel.findOne({_id: "dict:fk_payment_term"}, function(err, docs) {
			cond_reglement_code = docs;
		});

		var mode_reglement_code = {};
		DictModel.findOne({_id: "dict:fk_paiement"}, function(err, docs) {
			mode_reglement_code = docs;
		});

		latex.loadModel("facture.tex", function(err, tex) {

			var doc = req.bill;

			if (doc.Status == "DRAFT") {
				res.type('html');
				return res.send(500, "Impossible de générer le PDF, la facture n'est pas validée");
			}

			SocieteModel.findOne({_id: doc.client.id}, function(err, societe) {

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
					tab_latex += doc.lines[i].product.name.substring(0, 11).replace(/_/g, "\\_") + "&\\specialcell[t]{\\textbf{" + doc.lines[i].product.label + "}\\\\" + doc.lines[i].description.replace(/\n/g, "\\\\").replace(/%/gi, "\\%").replace(/&/gi, "\\&") + "\\\\}&" + doc.lines[i].tva_tx + "\\% &" + latex.price(doc.lines[i].pu_ht) + "&" + doc.lines[i].qty + "&" + latex.price(doc.lines[i].total_ht) + "\\tabularnewline\n";
				}
				//console.log(products)
				//console.log(tab_latex);
				//return;

				tex = tex.replace("--TABULAR--", tab_latex);

				var tab_latex = "";
				tab_latex += "Total HT &" + latex.price(doc.total_ht) + "\\tabularnewline\n";
				for (var i = 0; i < doc.total_tva.length; i++) {
					tab_latex += "Total TVA " + doc.total_tva[i].tva_tx + "\\% &" + latex.price(doc.total_tva[i].total) + "\\tabularnewline\n";
				}
				tab_latex += "\\vhline\n";
				tab_latex += "Total TTC &" + latex.price(doc.total_ttc) + "\\tabularnewline\n";
				//Payé & --PAYE--\\ 
				tex = tex.replace("--TOTAL--", tab_latex);

				tex = tex.replace(/--APAYER--/g, latex.price(doc.total_ttc));

				latex.headfoot(doc.entity, tex, function(tex) {

					tex = tex.replace(/undefined/g, "");

					doc.latex.data = new Buffer(tex);
					doc.latex.createdAt = new Date();
					doc.latex.title = "Facture - " + doc.ref;

					doc.save(function(err) {
						if (err) {
							console.log("Error while trying to save this document");
							res.send(403, "Error while trying to save this document");
						}

						latex.compileDoc(doc._id, doc.latex, function(result) {
							if (result.errors.length) {
								//console.log(pdf);
								return res.send(500, result.errors);
							}
							return latex.getPDF(result.compiledDocId, function(err, pdfPath) {
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
	caFamily: function(req, res) {

		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), d.getMonth() - 1, 1);
		var dateEnd = new Date(d.getFullYear(), d.getMonth(), 1);

		var ca = {};

		async.parallel({
			caFamily: function(cb) {
				BillModel.aggregate([
					{$match: {Status: {'$ne': 'DRAFT'}, entity: req.user.entity, datec: {'$gte': dateStart, '$lt': dateEnd}}},
					{$unwind: "$lines"},
					{$project: {_id: 0, lines: 1}},
					{$group: {_id: "$lines.product.id", total_ht: {"$sum": "$lines.total_ht"}}}
				], function(err, doc) {
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
		}, function(err, results) {
			if (err)
				return console.log(err);

			//console.log(results);
			async.each(results.caFamily, function(product, callback) {
				//console.log(product);
				ProductModel.findOne({_id: product._id}, function(err, doc) {
					console.log(product.name);
					product.caFamily = doc.caFamily;

					if (typeof ca[doc.caFamily] === "undefined")
						ca[doc.caFamily] = 0;

					ca[doc.caFamily] += product.total_ht;
					//console.log(ca);

					callback();
				});

			}, function(err) {
				
				var result = [];
				for (var i in ca) {
					result.push({
						family:i,
						total_ht:ca[i]
					});
				}

				res.json(200, result);
			});
		});
	}
};
"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		dateFormat = require('dateformat'),
		async = require('async'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		latex = require('../models/latex');

var BillModel = mongoose.model('billSupplier');
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

module.exports = function(app, passport, auth) {

	var object = new Object();

	app.get('/api/billSupplier', auth.requiresLogin, object.read);
	app.get('/api/billSupplier/costFamily', auth.requiresLogin, object.costFamily);
	app.get('/api/billSupplier/:billSupplierId', auth.requiresLogin, object.show);
	app.post('/api/billSupplier', auth.requiresLogin, object.create);
	app.put('/api/billSupplier/:billSupplierId', auth.requiresLogin, object.update);
	app.del('/api/billSupplier/:billSupplierId', auth.requiresLogin, object.destroy);
	app.get('/api/billSupplier/fk_extrafields/select', auth.requiresLogin, object.select);

	// list for autocomplete
	app.post('/api/billSupplier/autocomplete', auth.requiresLogin, function(req, res) {
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

	app.param('billSupplierId', object.bill);

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
	costFamily: function(req, res) {

		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), parseInt(d.getMonth() - 1), 1);
		var dateEnd = new Date(d.getFullYear(), d.getMonth(), 1);

		async.parallel({
			costFamily: function(cb) {
				BillModel.aggregate([
					{$match: {entity: req.user.entity, datec: {'$gte': dateStart, '$lt': dateEnd}}},
					{$unwind: "$lines"},
					{$project: {_id: 0, lines: 1}},
					{$group: {_id: "$lines.product.name", total_ht: {"$sum": "$lines.total_ht"}}}
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

			var result = [];
			for (var i in results.costFamily) {
				result.push({
					family: results.costFamily[i]._id,
					total_ht: results.costFamily[i].total_ht
				});
			}
			//console.log(results);

			res.json(200, result);
		});
	}
};
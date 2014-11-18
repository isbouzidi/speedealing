"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		dateFormat = require('dateformat'),
		async = require('async'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		latex = require('../models/latex');

var OrderModel = mongoose.model('orderSupplier');
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');

module.exports = function(app, passport, auth) {

	var object = new Object();

	app.get('/api/orderSupplier', auth.requiresLogin, object.read);
	app.get('/api/orderSupplier/:orderSupplierId', auth.requiresLogin, object.show);
	app.post('/api/orderSupplier', auth.requiresLogin, object.create);
	app.put('/api/orderSupplier/:orderSupplierId', auth.requiresLogin, object.update);
	app.del('/api/orderSupplier/:orderSupplierId', auth.requiresLogin, object.destroy);
	
	// list for autocomplete
	app.post('/api/orderSupplier/autocomplete', auth.requiresLogin, function(req, res) {
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
		OrderModel.find(query, {}, {limit: req.body.take}, function(err, docs) {
			if (err) {
				console.log("err : /api/orderSupplier/autocomplete");
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

	app.param('orderSupplierId', object.order);

	//other routes..
};

function Object() {
}

Object.prototype = {
	order: function(req, res, next, id) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {ref: id};

		//console.log(query);

		OrderModel.findOne(query, "-latex", function(err, doc) {
			if (err)
				return next(err);

			req.order = doc;

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

		OrderModel.find(query, "-history -files -latex", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);
			if (!_.isArray(doc))
				doc = [];

			res.json(200, doc);
		});
	},
	show: function(req, res) {
		res.json(req.order);
	},
	create: function(req, res) {
		var order = new OrderModel(req.body);
		order.author = {};
		order.author.id = req.user._id;
		order.author.name = req.user.name;

		if (!order.entity)
			order.entity = req.user.entity;

		order.save(function(err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(order);
		});
	},
	update: function(req, res) {
		var order = req.order;
		//console.log(req.body);
		order = _.extend(order, req.body);
		
		order.save(function(err, doc) {
			if (err)
				console.log(err);

			//console.log(doc);
			res.json(doc);
		});
	},
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
	}
};

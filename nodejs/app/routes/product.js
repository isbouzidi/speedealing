"use strict";
var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		async = require('async'),
		_ = require('lodash');
var ProductModel = mongoose.model('product');
var StorehouseModel = mongoose.model('storehouse');

var Dict = require('../controllers/dict');

module.exports = function (app, passport, auth) {

	var object = new Object();
	var pricelevel = require('../controllers/pricelevel.js');
	Dict.extrafield({extrafieldName:'Product'}, function (err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});
	app.get('/api/product', auth.requiresLogin, object.read);
	app.get('/api/product/count', auth.requiresLogin, object.count);
	// list for autocomplete
	app.post('/api/product/autocomplete', auth.requiresLogin, function (req, res) {
		//console.dir(req.body);

		if (req.body.filter == null)
			return res.send(200, {});
		var query = {
			"$or": [
				{ref: new RegExp(req.body.filter.filters[0].value, "i")},
				{label: new RegExp(req.body.filter.filters[0].value, "i")}
			]
		};
		
		/*
		 * EN FONCTION DU PRICELEVEL
		 */
		
		if (req.body.price_level && req.body.price_level !== 'BASE')
			return pricelevel.autocomplete(req.body, function (prices) {
				res.json(200, prices);
			});
		if (req.body.supplier)
			query.Status = {'$in': ["SELLBUY", "BUY"]};
		else
			query.Status = {'$in': ["SELL", "SELLBUY"]};
		//console.log(query);
		ProductModel.find(query, "ref _id label template pu_ht tva_tx minPrice description caFamily",
				{limit: req.body.take}, function (err, docs) {
			if (err) {
				console.log("err : /api/product/autocomplete");
				console.log(err);
				return;
			}
			//console.log(docs);

			var result = [];
			for (var i = 0; i < docs.length; i++) {
				var obj = {
					pu_ht: docs[i].pu_ht,
					price_level: 'BASE',
					discount: 0,
					qtyMin: 0,
					product: {
						id: docs[i],
						name: docs[i].ref
					}
				};
				result.push(obj);
			}

			return res.send(200, result);
		});
	});
	app.get('/api/product/convert_tva', auth.requiresLogin, function (req, res) {
		DictModel.findOne({_id: "dict:fk_tva"}, function (err, docs) {
			for (var i in docs.values) {
				if (docs.values[i].label)
					docs.values[i].value = docs.values[i].label;
				if (docs.values[i].label == null && docs.values[i].value == null)
					docs.values[i].value = 0;
				delete docs.values[i].label;
				//console.log(docs.values[i]);
			}
			docs.save(function (err, doc) {
				//console.log(err);
				res.json(doc);
			});
		});
	});
	app.post('/api/product', auth.requiresLogin, function (req, res) {
		object.create(req, res);
	});

	app.del('/api/product', auth.requiresLogin, function (req, res) {
		object.del(req, res);
	});
	app.get('/api/product/storehouse', auth.requiresLogin, function (req, res) {
		StorehouseModel.find({}, function (err, storehouses) {
			if (err)
				console.log(err);
			res.send(200, storehouses);
		});
	});
	app.post('/api/product/storehouse', auth.requiresLogin, function (req, res) {
		//console.log(req.body);

		req.body.name = req.body.name.toUpperCase();
		if (!req.body.substock)
			req.body.substock = "";
		req.body.substock = req.body.substock.toUpperCase();
		StorehouseModel.findOne({name: req.body.name}, function (err, storehouse) {
			if (err)
				return console.log(err);
			if (storehouse == null)
				storehouse = new StorehouseModel(req.body);
			var max = 0;
			for (var i in storehouse.subStock) {
				if (storehouse.subStock.length && req.body.substock == storehouse.subStock[i].name)
					return res.send(200, {}); //Already exist
				if (storehouse.subStock[i].barCode > max)
					max = storehouse.subStock[i].barCode;
			}

			var subStock = {};
			subStock.name = req.body.substock;
			subStock.barCode = max + 1;
			subStock.productId = [];
			storehouse.subStock.push(subStock);
			storehouse.save(function (err, doc) {
				if (err)
					console.log(err);
				res.send(200, storehouse);
			});
		});
	});
	// add or remove product to a storehouse for gencode
	app.put('/api/product/storehouse', auth.requiresLogin, function (req, res) {
		console.log(req.body);
		if (req.body.checked) // add a product
			StorehouseModel.update({name: req.body.stock.stock, 'subStock.name': req.body.stock.subStock}, {$addToSet: {'subStock.$.productId': req.body.product._id}}, function (err, doc) {
				if (err)
					console.log(err);
				console.log(doc);
				res.send(200, {});
			});
		else
			StorehouseModel.update({name: req.body.stock.stock, 'subStock.name': req.body.stock.subStock}, {$pull: {'subStock.$.productId': req.body.product._id}}, function (err, doc) {
				if (err)
					console.log(err);
				console.log(doc);
				res.send(200, {});
			});
	});
	app.post('/api/product/import', /*ensureAuthenticated,*/ function (req, res) {

		if (req.files) {
			var filename = req.files.filedata.path;
			if (fs.existsSync(filename)) {

				var tab = [];
				csv()
						.from.path(filename, {delimiter: ';', escape: '"'})
						.transform(function (row, index, callback) {
							if (index === 0) {
								tab = row; // Save header line
								return callback();
							}
							//console.log(tab);
							//console.log(row);

							//console.log(row[0]);

							//return;

							SocieteModel.findOne({code_client: row[0]}, function (err, societe) {
								if (err) {
									console.log(err);
									return callback();
								}

								if (societe == null)
									societe = new SocieteModel();
								for (var i = 0; i < row.length; i++) {
									societe[tab[i]] = row[i];
								}



								//console.log(row[10]);
								//console.log(societe)
								//console.log(societe.datec);

								societe.save(function (err, doc) {
									if (err)
										console.log(err);
									/*if (doc == null)
									 console.log("null");
									 else
									 console.log(doc);*/

									callback();
								});
							});
							//return row;
						}/*, {parallel: 1}*/)
						.on("end", function (count) {
							console.log('Number of lines: ' + count);
							fs.unlink(filename, function (err) {
								if (err)
									console.log(err);
							});
							return res.send(200, {count: count});
						})
						.on('error', function (error) {
							console.log(error.message);
						});
			}
		}
	});
	app.get('/api/product/status/select', auth.requiresLogin, object.StatusSelect);
	app.get('/api/product/price_level', auth.requiresLogin, pricelevel.read);
	app.get('/api/product/price_level/toUppercase', auth.requiresLogin, pricelevel.toUppercase);
	app.put('/api/product/price_level', auth.requiresLogin, pricelevel.update);
	app.post('/api/product/price_level', auth.requiresLogin, pricelevel.add);
	app.del('/api/product/price_level', auth.requiresLogin, pricelevel.remove);
	app.get('/api/product/price_level/select', auth.requiresLogin, pricelevel.list);
	app.post('/api/product/price_level/select', auth.requiresLogin, pricelevel.list);
	app.get('/api/product/price_level/upgrade', auth.requiresLogin, pricelevel.upgrade);
	app.post('/api/product/family/autocomplete', auth.requiresLogin, function (req, res) {
		console.dir(req.body);
		ProductModel.aggregate([{'$group': {_id: '$caFamily'}}, {'$project': {price_level: '$caFamily'}}, {'$match': {_id: new RegExp(req.body.filter.filters[0].value, "i")}}, {'$limit': parseInt(req.body.take)}], function (err, docs) {
			if (err) {
				console.log("err : /api/product/price_level/autocomplete");
				console.log(err);
				return;
			}

			var result = [];
			if (docs !== null)
				for (var i in docs) {
					//console.log(docs[i]);
					result[i] = {};
					result[i].name = docs[i]._id;
					result[i].text = docs[i]._id; //For Product Family
					//result[i].id = docs[i]._id;
				}

			return res.send(200, result);
		});
	});
	app.post('/api/product/family', auth.requiresLogin, function (req, res) {
		//console.log(req.body);

		var query = {
			"$and": [{caFamily: {$nin: [null, "OTHER", ""]}}]
		};
		if (req.body.filter)
			query.$and.push({caFamily: new RegExp(req.body.filter, "i")});

		ProductModel.distinct(req.body.field, query, function (err, data) {

			if (err) {
				console.log('Erreur : ' + err);
			} else {
				res.json(data);
				console.log(data);
			}
		});
		return;
	});
	// list for autocomplete
	app.post('/api/product/ref/autocomplete', auth.requiresLogin, function (req, res) {
		//console.dir(req.body);

		var query;
		if (req.query.type)
			query = {'$and':
						[{Status: req.query.type},
							{ref: new RegExp(req.body.filter.filters[0].value, "i")}
						]
			};
		else
			query = {ref: new RegExp(req.body.filter.filters[0].value, "i")};
		ProductModel.find(query, "_id ref", {limit: parseInt(req.body.take, 10)}, function (err, docs) {
			if (err) {
				console.log("err : /api/product/ref/autocomplete");
				console.log(err);
				return;
			}

			var result = [];
			if (docs !== null)
				for (var i in docs) {
					//console.log(docs[i]);
					result[i] = {};
					result[i].name = docs[i].ref;
					result[i].id = docs[i]._id;
				}
			console.log(result);
			return res.send(200, result);
		});
	});
	app.get('/api/product/:productId', auth.requiresLogin, object.show);
	app.put('/api/product/:productId/:field', auth.requiresLogin, object.updateField);
	app.put('/api/product/:productId', auth.requiresLogin, object.update);
	app.param('productId', object.product);
	//other routes..
};
function Object() {
}

Object.prototype = {
	product: function (req, res, next, id) {
//TODO Check ACL here
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};
		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {ref: id};
		//console.log(query);

		ProductModel.findOne(query, function (err, doc) {
			if (err)
				return next(err);
			req.product = doc;
			next();
		});
	},
	create: function (req, res) {
		var product = new ProductModel(req.body);

		product.author = {};
		product.author.id = req.user._id;
		product.author.name = req.user.name;

		var history = {};
		history.Status = product.Status;
		history.author = req.user.name;
		history.tms = new Date().toISOString();
		history.pu_ht = product.pu_ht;
		product.history.push(history);

		console.log(product);

		product.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(product);
		});
	},
	read: function (req, res) {
		var query = {};
		var fields = "-history -files";
		var sort = {};

		if (req.query.query) {
			switch (req.query.query) {
				case "SELL" :
					query.Status = {$in: ["SELL", "SELLBUY"]};
					break;
				case "BUY" :
					query.Status = {$in: ["BUY", "SELLBUY"]};
					break;
				default :
					break;
			}
		}

		if (req.query.barCode)
			query.barCode = {$nin: [null, ""]};

		if (req.query.fields)
			fields = req.query.fields;

		if (req.query.filter)
			query.$or = [
				{ref: new RegExp(req.query.filter, "i")},
				{label: new RegExp("\\b" + req.query.filter, "i")},
				{description: new RegExp("\\b" + req.query.filter, "i")}
			];

		if (req.query.sort)
			sort = JSON.parse(req.query.sort);

		ProductModel.find(query, fields, {skip: parseInt(req.query.skip, 10) * parseInt(req.query.limit, 10) || 0, limit: req.query.limit || 100, sort: sort}, function (err, docs) {
			if (err)
				console.log(err);
			//console.log(docs);

			res.send(200, docs);
		});
	},
	show: function (req, res) {
		res.json(req.product || {});
	},
	count: function (req, res) {
		var query = {};
		if (req.query.query) {
			switch (req.query.query) {
				case "SELL" :
					query.Status = {$in: ["SELL", "SELLBUY"]};
					break;
				case "BUY" :
					query.Status = {$in: ["BUY", "SELLBUY"]};
					break;
				default :
					break;
			}
		}

		ProductModel.count(query, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(200, {count: doc});
		});
	},
	readPrice: function (req, res) {
		var status_list = this.fk_extrafields.fields.Status;
		var type_list = this.fk_extrafields.fields.type;
		var result = [];
		var query = [];
		//console.log(req.query);

		if (req.query.ref)
			query.push({$match: {'ref': req.query.ref}});
		if (req.query.type)
			query.push({$match: {type: req.query.type}});
		query.push({$unwind: "$price"});
		if (req.query.price_level)
			query.push({$match: {'price.price_level': req.query.price_level}});
		if (req.query.qty) {
			query.push({$match: {'price.qtyMin': {'$lte': parseFloat(req.query.qty)}}});
			query.push({$sort: {'price.qtyMin': -1}});
		}

		//console.log(req.query);

		ProductModel.aggregate(query, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			for (var i in doc) {
				var status = {};
				status.id = doc[i].Status;
				if (status_list.values[status.id]) {
					status.name = req.i18n.t("products:Status." + status_list.values[status.id].label);
					status.css = status_list.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}
				doc[i].Status = status;
				var type = {};
				type.id = doc[i].type;
				if (type_list.values[type.id]) {
					type.name = req.i18n.t("products:" + type_list.values[type.id].label);
					type.css = type_list.values[type.id].cssClass;
				} else { // Value not present in extrafield
					type.name = type.id;
					type.css = "";
				}
				doc[i].type = type;
				var row = {};
				row._id = doc[i].price._id;
				row.label = doc[i].label;
				row.ref = doc[i].ref;
				row.Status = status;
				row.type = doc[i].type;
				row.compta_buy = doc[i].compta_buy;
				row.compta_sell = doc[i].compta_sell;
				if (doc[i].caFamily == null)
					row.caFamily = "OTHER";
				else
					row.caFamily = doc[i].caFamily;
				if (doc[i].barCode == null)
					row.barCode = "";
				else
					row.barCode = doc[i].barCode;
				if (doc[i].billingMode == null)
					row.billingMode = "QTY";
				else
					row.billingMode = doc[i].billingMode;
				row.pu_ht = doc[i].price.pu_ht;
				row.price_level = doc[i].price.price_level;
				row.tms = doc[i].price.tms;
				row.ref_customer_code = doc[i].price.ref_customer_code;
				row.tva_tx = doc[i].price.tva_tx;
				if (doc[i].price.qtyMin == null)
					row.qtyMin = 0;
				else
					row.qtyMin = doc[i].price.qtyMin;
				if (!row.compta_buy)
					row.compta_buy = "";
				if (!row.compta_sell)
					row.compta_sell = "";
				result.push(row);
				//console.log(row);

			}
			res.send(200, result);
		});
	},
	update: function (req, res) {

		var product = req.product;
		product = _.extend(product, req.body);
		//console.log(req.body);

		product.save(function (err, doc) {
			res.json(doc);
		});

		/*
		 if (obj._id)
		 ProductModel.update({"price._id": obj._id}, {$set: {"price.$": obj, ref: obj.ref, label: obj.label, Status: obj.Status.id, type: obj.type.id, compta_buy: obj.compta_buy, compta_sell: obj.compta_sell, barCode: obj.barCode, billingMode: obj.billingMode, caFamily: obj.caFamily}, $push: {history: obj}}, function(err) {
		 if (err)
		 console.log(err);
		 //console.log(obj);
		 });*/
	},
	updateField: function (req, res) {
		if (req.body.value) {
			var product = req.product;
			product[req.params.field] = req.body.value;
			product.save(function (err, doc) {
				res.json(doc);
			});
		} else
			res.send(500);
	},
	del: function (req) {
		return req.body.models;
	},
	StatusSelect: function (req, res) {
		var result = [];
		for (var i in this.fk_extrafields.fields.Status.values) {

			if (this.fk_extrafields.fields.Status.values[i].enable) {
				var status = {};
				status.id = i;
				status.name = req.i18n.t("products:Status." + this.fk_extrafields.fields.Status.values[i].label);
				status.css = this.fk_extrafields.fields.Status.values[i].cssClass;
				result.push(status);
			}
		}
		res.send(200, result);
	}
};

"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore');

var ProductModel = mongoose.model('product');
var StorehouseModel = mongoose.model('storehouse');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

module.exports = function(app, passport, auth) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Product', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/product', auth.requiresLogin, function(req, res) {
		if (req.query.withNoPrice)
			object.read(req, res);
		else
			object.readPrice(req, res);
		return;
	});

	// list for autocomplete
	app.post('/api/product/autocomplete', auth.requiresLogin, function(req, res) {
		//console.dir(req.body);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {
			"$or": [
				{ref: new RegExp(req.body.filter.filters[0].value, "i")},
				{label: new RegExp(req.body.filter.filters[0].value, "i")}
			]
		};
		
		if(req.body.supplier)
			query.Status = {'$in':["SELLBUY","BUY"]};
		else
			query.Status = {'$in':["SELL","SELLBUY"]};
			
		//console.log(query);
		ProductModel.aggregate([
			{$match: query},
			{$project: {name: "$ref", label: 1, template: 1, price: 1, minPrice: 1, description: 1}},
			{$unwind: "$price"},
			{$match: {'$or': [{'price.price_level': req.body.price_level}, {'price.price_level': 'BASE'}]}},
			{$limit: req.body.take}], function(err, docs) {
			if (err) {
				console.log("err : /api/product/autocomplete");
				console.log(err);
				return;
			}
			//console.log(docs);

			return res.send(200, docs);
		});
	});

	app.get('/api/product/fk_extrafields/select', auth.requiresLogin, object.select);
	app.get('/api/product/convert_tva', auth.requiresLogin, function(req, res) {
		DictModel.findOne({_id: "dict:fk_tva"}, function(err, docs) {
			for (var i in docs.values) {
				if (docs.values[i].label)
					docs.values[i].value = docs.values[i].label;

				if (docs.values[i].label == null && docs.values[i].value == null)
					docs.values[i].value = 0;

				delete docs.values[i].label;

				//console.log(docs.values[i]);
			}
			docs.save(function(err, doc) {
				//console.log(err);
				res.json(doc);
			});
		});

	});


	app.post('/api/product', auth.requiresLogin, function(req, res) {
		object.create(req, res);
	});

	app.put('/api/product', auth.requiresLogin, function(req, res) {
		object.update(req, res);
	});

	app.del('/api/product', auth.requiresLogin, function(req, res) {
		object.del(req, res);
	});

	app.get('/api/product/storehouse', auth.requiresLogin, function(req, res) {
		StorehouseModel.find({}, function(err, storehouses) {
			if (err)
				console.log(err);

			res.send(200, storehouses);
		});
	});

	app.post('/api/product/storehouse', auth.requiresLogin, function(req, res) {
		//console.log(req.body);

		req.body.name = req.body.name.toUpperCase();
		if (!req.body.substock)
			req.body.substock = "";

		req.body.substock = req.body.substock.toUpperCase();

		StorehouseModel.findOne({name: req.body.name}, function(err, storehouse) {
			if (err)
				return console.log(err);

			if (storehouse == null)
				storehouse = new StorehouseModel(req.body);

			var max = 0;

			for (var i in storehouse.subStock) {
				if (storehouse.subStock.length && req.body.substock == storehouse.subStock[i].name)
					return res.send(200, {}); //Already exist
				if (storehouse.subStock[i].barCode > max)
					max = storehouse.subStock[i].barCode
			}

			var subStock = {};
			subStock.name = req.body.substock;
			subStock.barCode = max + 1;
			subStock.productId = [];

			storehouse.subStock.push(subStock);

			storehouse.save(function(err, doc) {
				if (err)
					console.log(err);

				res.send(200, storehouse);
			});
		});
	});

	// add or remove product to a storehouse for gencode
	app.put('/api/product/storehouse', auth.requiresLogin, function(req, res) {
		console.log(req.body);

		if (req.body.checked) // add a product
			StorehouseModel.update({name: req.body.stock.stock, 'subStock.name': req.body.stock.subStock}, {$addToSet: {'subStock.$.productId': req.body.product._id}}, function(err, doc) {
				if (err)
					console.log(err);

				console.log(doc);

				res.send(200, {});
			});
		else
			StorehouseModel.update({name: req.body.stock.stock, 'subStock.name': req.body.stock.subStock}, {$pull: {'subStock.$.productId': req.body.product._id}}, function(err, doc) {
				if (err)
					console.log(err);

				console.log(doc);

				res.send(200, {});
			});
	});

	app.post('/api/product/import', /*ensureAuthenticated,*/ function(req, res) {

		if (req.files) {
			var filename = req.files.filedata.path;
			if (fs.existsSync(filename)) {

				var tab = [];

				csv()
						.from.path(filename, {delimiter: ';', escape: '"'})
						.transform(function(row, index, callback) {
							if (index === 0) {
								tab = row; // Save header line
								return callback();
							}
							//console.log(tab);
							//console.log(row);

							//console.log(row[0]);

							//return;

							SocieteModel.findOne({code_client: row[0]}, function(err, societe) {
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

								societe.save(function(err, doc) {
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
						.on("end", function(count) {
							console.log('Number of lines: ' + count);
							fs.unlink(filename, function(err) {
								if (err)
									console.log(err);
							});
							return res.send(200, {count: count});
						})
						.on('error', function(error) {
							console.log(error.message);
						});
			}
		}
	});

	app.get('/api/product/status/select', auth.requiresLogin, function(req, res) {
		//console.dir(req.query);
		object.StatusSelect(req, res);
	});

	// list for autocomplete
	app.post('/api/product/price_level/autocomplete', auth.requiresLogin, function(req, res) {
		//console.dir(req.body);

		ProductModel.aggregate([{$unwind: "$price"}, {'$group': {_id: '$price.price_level'}}, {'$project': {price_level: '$price.price_level'}}, {'$match': {_id: new RegExp(req.body.filter.filters[0].value, "i")}}, {'$limit': parseInt(req.body.take)}], function(err, docs) {
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
					//result[i].id = docs[i]._id;
				}

			return res.send(200, result);
		});
	});

	// list for autocomplete
	app.post('/api/product/ref/autocomplete', auth.requiresLogin, function(req, res) {
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

		ProductModel.find(query, "_id ref", {limit: parseInt(req.body.take)}, function(err, docs) {
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

	//other routes..
};

function Object() {
}

Object.prototype = {
	create: function(req, res) {
		var obj = JSON.parse(req.body.models);
		obj = obj[0];

		//console.log(obj);
		delete obj._id; //Just for create

		return res.send(200, obj);

		ProductModel.findOne({ref: obj.ref.toUpperCase()}, function(err, doc) {
			if (err)
				console.log(err);

			if (doc == null) {
				doc = new ProductModel(obj);

				doc.price.push(obj);
				doc.history.push(doc.price[0]);
				doc.Status = doc.Status.id;

				doc.save(function(err, doc) {
					if (err) {
						console.log(err);
						return res.send(500, doc);
					}
					obj._id = doc._id;

					obj.Status = {};
					//obj.Status.id = obj['Status.id'];
					obj.Status.css = this.fk_extrafields.fields.Status.values[obj.Status.id].cssClass;
					obj.Status.name = req.i18n.t("products:Status." + this.fk_extrafields.fields.Status.values[obj.Status.id].label);

					res.send(200, obj);
				});
			} else {
				obj.Status = obj.Status.id;

				ProductModel.update({"price._id": obj._id}, {$set: {"price.$": obj, ref: obj.ref, label: obj.label, Status: obj.Status}, $push: {history: obj}}, function(err) {
					if (err)
						console.log(err);
					//console.log(obj);
				});


				obj.tms = new Date();
				//obj.Status.id = obj['Status.id'];

				obj.Status.css = this.fk_extrafields.fields.Status.values[obj.Status.id].cssClass;
				obj.Status.name = req.i18n.t("products:Status." + this.fk_extrafields.fields.Status.values[obj.Status.id].label);

				doc.Status = obj[0].Status.id;

				var history = {};
				history.Status = doc.Status;
				history.author = req.user.name;
				history.tms = new Date().toISOString();
				history.total_ht = doc.total_ht;
				doc.history.push(history);

				doc.save(function(err, doc) {
					if (err) {
						console.log(err);
						return res.send(500, doc);
					}
					obj[0]._id = doc._id;
					obj[0].ref = doc.ref;

					res.send(200, obj);
				});
			}
		});
	},
	read: function(req, res) {
		var query = {};

		if (req.query.type)
			query.type = req.query.type;

		if (req.query.barCode)
			query.barCode = {$exists: true};

		ProductModel.find(query, "ref label barCode billingMode type", {limit: 50}, function(err, products) {
			if (err)
				console.log(err);

			//console.log(products);

			res.send(200, products);
		});
	},
	readPrice: function(req, res) {
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

		ProductModel.aggregate(query, function(err, doc) {
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
	update: function(req, res) {
		//console.log(req.body);
		var obj = JSON.parse(req.body.models);
		obj = obj[0];

		obj.pu_ht = parseFloat(obj.pu_ht);
		obj.tva_tx = parseFloat(obj.tva_tx);
		obj.qtyMin = parseFloat(obj.qtyMin);

		obj.ref = obj.ref.toUpperCase();

		if (obj._id == null) {
			delete obj._id; // new price

			ProductModel.findOne({ref: obj.ref}, function(err, doc) {
				if (err)
					console.log(err);

				//console.log(doc);

				if (doc == null) {
					doc = new ProductModel(obj);
					doc.Status = doc.Status.id;
					doc.type = doc.type.id;
				}

				obj.label = doc.label;
				obj.barCode = doc.barCode;
				obj.billingMode = doc.billingMode;

				var price = _.extend({_id: new mongoose.Types.ObjectId()}, obj);

				doc.price.push(price);
				doc.history.push(price);

				obj._id = price._id;
				res.send(200, obj);

				//console.log(doc);
				doc.save(function(err, doc) {
					if (err)
						console.log(err);

					//console.log(obj);
				});
			});
			return;
		}

		obj.tms = new Date();
		//console.log(obj);
		//obj.Status.id = obj['Status.id'];

		obj.Status.css = this.fk_extrafields.fields.Status.values[obj.Status.id].cssClass;
		obj.Status.name = req.i18n.t("products:Status." + this.fk_extrafields.fields.Status.values[obj.Status.id].label);

		res.send(200, obj);

		console.log(obj);

		if (obj._id)
			ProductModel.update({"price._id": obj._id}, {$set: {"price.$": obj, ref: obj.ref, label: obj.label, Status: obj.Status.id, type: obj.type.id, compta_buy: obj.compta_buy, compta_sell: obj.compta_sell, barCode: obj.barCode, billingMode: obj.billingMode}, $push: {history: obj}}, function(err) {
				if (err)
					console.log(err);
				//console.log(obj);
			});

	},
	del: function(req) {
		return req.body.models;
	},
	StatusSelect: function(req, res) {
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
	},
	select: function(req, res) {
		ExtrafieldModel.findById('extrafields:Product', function(err, doc) {
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
								if (docs.values[i].pays_code && docs.values[i].pays_code != 'FR')
									continue;
								//console.log(docs.values[i]);
								var val = {};
								val.id = i;
								if (docs.values[i].label)
									val.label = docs.values[i].label;
								else
									val.label = req.i18n.t("bills:" + i);

								if (docs.values[i].value !== null)
									val.value = docs.values[i].value

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
	}
};
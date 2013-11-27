"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore');

var ProductModel = mongoose.model('product');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, ensureAuthenticated) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Product', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/product', ensureAuthenticated, function(req, res) {
		object.read(req, res);
		return;
	});

	// list for autocomplete
	app.post('/api/product/autocomplete', ensureAuthenticated, function(req, res) {
		//console.dir(req.body);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {
			"$or": [
				{name: new RegExp(req.body.filter.filters[0].value, "i")},
				{ref: new RegExp(req.body.filter.filters[0].value, "i")}
			]
		};

		/*if (req.query.fournisseur) {
		 query.fournisseur = req.query.fournisseur;
		 } else // customer Only
		 query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};*/

		//console.log(query);
		ProductModel.find(query, {}, {limit: req.body.take}, function(err, docs) {
			if (err) {
				console.log("err : /api/product/autocomplete");
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
				}

			return res.send(200, result);
		});
	});

	app.post('/api/product', ensureAuthenticated, function(req, res) {
		object.create(req, res);
	});

	app.put('/api/product', ensureAuthenticated, function(req, res) {
		object.update(req, res);
	});

	app.del('/api/product', ensureAuthenticated, function(req, res) {
		object.del(req, res);
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

	app.get('/api/product/status/select', ensureAuthenticated, function(req, res) {
		//console.dir(req.query);
		object.StatusSelect(req, res);
	});

	// list for autocomplete
	app.post('/api/product/price_level/autocomplete', ensureAuthenticated, function(req, res) {
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
	app.post('/api/product/ref/autocomplete', ensureAuthenticated, function(req, res) {
		//console.dir(req.body);

		var query;

		if (req.query.type)
			query = [
				{'$match': {Status: req.query.type}},
				{'$group': {_id: '$ref'}},
				{'$project': {ref: 1}},
				{'$match': {_id: new RegExp(req.body.filter.filters[0].value, "i")}},
				{'$limit': parseInt(req.body.take)}
			];
		else
			query = [
				{'$group': {_id: '$ref'}},
				{'$project': {ref: 1}},
				{'$match': {_id: new RegExp(req.body.filter.filters[0].value, "i")}},
				{'$limit': parseInt(req.body.take)}
			];

		ProductModel.aggregate(query, function(err, docs) {
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
					result[i].name = docs[i]._id;
					//result[i].id = docs[i]._id;
				}

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

		console.log(obj);
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
					obj.Status.id = obj['Status.id'];
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
				obj.Status.id = obj['Status.id'];

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
		var status_list = this.fk_extrafields.fields.Status;
		var type_list = this.fk_extrafields.fields.type;

		var result = [];
		var query;

		console.log(req.query);

		if (req.query.type)
			query = [{$match: {type: req.query.type}}, {$unwind: "$price"}];
		else
			query = [{$unwind: "$price"}];

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

				row.pu_ht = doc[i].price.pu_ht;
				row.price_level = doc[i].price.price_level;
				row.tms = doc[i].price.tms;
				row.ref_customer_code = doc[i].price.ref_customer_code;
				row.tva_tx = doc[i].price.tva_tx;
				if (doc[i].price.qtyMin == null)
					row.qtyMin = 0;
				else
					row.qtyMin = doc[i].price.qtyMin;

				result.push(row);
				//console.log(row);

			}
			res.send(200, result);
		});
	},
	update: function(req, res) {
		var obj = JSON.parse(req.body.models);
		obj = obj[0];

		obj.pu_ht = parseFloat(obj.pu_ht);
		obj.tva_tx = parseFloat(obj.tva_tx);
		obj.qtyMin = parseFloat(obj.qtyMin);

		if (obj._id == null) {
			delete obj._id; // new price

			ProductModel.findOne({ref: obj.ref.toUpperCase()}, function(err, doc) {
				if (err)
					console.log(err);

				//console.log(doc);

				if (doc == null)
					doc = new ProductModel(obj);

				obj.label = doc.label;

				var price = _.extend({_id: new mongoose.Types.ObjectId()}, obj);

				doc.price.push(price);
				doc.history.push(price);

				obj._id = price._id;
				res.send(200, obj);

				doc.Status = doc.Status.id;
				doc.type = doc.type.id;

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
		obj.Status.id = obj['Status.id'];

		obj.Status.css = this.fk_extrafields.fields.Status.values[obj.Status.id].cssClass;
		obj.Status.name = req.i18n.t("products:Status." + this.fk_extrafields.fields.Status.values[obj.Status.id].label);

		res.send(200, obj);

		console.log(obj);

		ProductModel.update({"price._id": obj._id}, {$set: {"price.$": obj, ref: obj.ref, label: obj.label, Status: obj.Status.id, type: obj.type.id}, $push: {history: obj}}, function(err) {
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
	}
};
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
		console.dir(req.body);

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
		console.log(JSON.stringify(req.body));
		return res.send(200, object.create(req));
	});

	app.put('/api/product', ensureAuthenticated, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.update(req));
	});

	app.del('/api/product', ensureAuthenticated, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.update(req));
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

	//other routes..
};

function Object() {
}

Object.prototype = {
	create: function(req) {
		return req.body.models;
	},
	read: function(req, res) {
		var status_list = this.fk_extrafields.fields.Status;

		var result = [];

		ProductModel.find({}, function(err, doc) {
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

				for (var j = 0; j < doc[i].price.length; j++) {
					var row = {};
					row.label = doc[i].label;
					row.ref = doc[i].ref;
					row.Status = status;

					row.pu_ht = doc[i].price[j].pu_ht;
					row.price_level = doc[i].price[j].price_level;
					row.tms = doc[i].price[j].tms;
					row.ref_customer_code = doc[i].price[j].ref_customer_code;


					result.push(row);
					console.log(doc[i].price[j]);
				}

			}
			res.send(200, result);
		});
	},
	update: function(req) {
		return req.body.models;
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
};
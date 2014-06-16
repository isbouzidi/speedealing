"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

module.exports = function(app, passport, auth) {

	var object = new Object();

	app.get('/api/societe', auth.requiresLogin, object.read);
	app.get('/api/societe/uniqId', auth.requiresLogin, object.uniqId);
	app.get('/api/societe/:societeId', auth.requiresLogin, object.show);
	app.post('/api/societe', auth.requiresLogin, object.create);
	app.put('/api/societe/:societeId', auth.requiresLogin, object.update);
	app.del('/api/societe/:societeId', auth.requiresLogin, object.destroy);
	app.get('/api/societe/fk_extrafields/select', auth.requiresLogin, object.select);

	// list for autocomplete
	app.post('/api/societe/autocomplete', auth.requiresLogin, function(req, res) {
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
		SocieteModel.find(query, {}, {limit: req.body.take}, function(err, docs) {
			if (err) {
				console.log("err : /api/societe/autocomplete");
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

	app.post('/api/societe/segmentation/autocomplete', auth.requiresLogin, function(req, res) {
		//console.dir(req.body);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {
			'segmentation.text': new RegExp(req.body.filter.filters[0].value, "i")
		};

		//console.log(query);
		SocieteModel.aggregate([
			{$project: {_id: 0, segmentation: 1}},
			{$unwind: "$segmentation"},
			{$match: query},
			{$group: {_id : "$segmentation.text"}},
			{$limit: req.body.take}
		], function(err, docs) {
			if (err) {
				console.log("err : /api/societe/segmentation/autocomplete");
				console.log(err);
				return;
			}
			//console.log(docs);
			var result = [];

			if (docs !== null)
				for (var i in docs) {
					result.push({text:docs[i]._id});
				}

			return res.send(200, result);
		});
	});

	app.post('/api/societe/import', /*ensureAuthenticated,*/ function(req, res) {

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

	app.post('/api/societe/file/:Id', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;
		//console.log(id);
                
                if (req.files && id) {
			//console.log(req.files);

			gridfs.addFile(SocieteModel, id, req.files.file, function(err, result, file, update) {
				if (err)
					return res.send(500, err);

				return res.send(200, {status: "ok", file: file, update: update});
			});
		} else
			res.send(500, "Error in request file");
	});

	app.get('/api/societe/file/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {

			gridfs.getFile(SocieteModel, id, req.params.fileName, function(err, store) {
				if (err)
					return res.send(500, err);

				if (req.query.download)
					res.attachment(store.filename); // for downloading 

				res.type(store.contentType);
				store.stream(true).pipe(res);

			});
		} else {
			res.send(500, "Error in request file");
		}

	});

	app.del('/api/societe/file/:Id/:fileNames', auth.requiresLogin, function(req, res) {
		console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.params.fileNames && id) {
			gridfs.delFile(SocieteModel, id, req.params.fileNames, function(err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "File not found");
	});

	app.get('/api/societe/file/remove/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;

		if (req.params.fileName && id) {
			gridfs.delFile(SocieteModel, id, req.params.fileName, function(err) {
				if (err)
					res.send(500, err);
				else
					res.redirect('/societe/fiche.php?id=' + id);
			});
		} else
			res.send(500, "File not found");
	});

	app.get('/api/societe/contact/select', auth.requiresLogin, function(req, res) {
		//console.log(req.query);
		var result = [];

		if (req.query.societe)
			ContactModel.find({"societe.id": req.query.societe}, "_id name", function(err, docs) {
				if (err)
					console.log(err);

				if (docs === null)
					return res.send(200, []);

				for (var i in docs) {
					var contact = {};
					contact.id = docs[i]._id;
					contact.name = docs[i].name;

					result.push(contact);
				}
				res.send(200, result);
			});
		else
			ContactModel.find({}, "_id name", function(err, docs) {
				if (err)
					console.log(err);

				if (docs === null)
					return res.send(200, []);

				for (var i in docs) {
					var contact = {};
					contact.id = docs[i]._id;
					contact.name = docs[i].name;

					result.push(contact);
				}
				res.send(200, result);
			});
	});

	app.param('societeId', object.societe);

	//other routes..
};

function Object() {
}

Object.prototype = {
	societe: function(req, res, next, id) {
		SocieteModel.findOne({_id: id}, function(err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return next(new Error('Failed to load societe ' + id));

			req.societe = doc;
			next();
		});
	},
	read: function(req, res) {
		var query = {};

		if (req.query.query) {
			switch (req.query.query) {
				case "CUSTOMER" :
					query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};
					break;
				case "SUPPLIER" :
					query.fournisseur = "SUPPLIER";
					break;
				case "SUBCONTRACTOR" :
					query.fournisseur = "SUBCONTRACTOR";
					break;
				case "SUSPECT" :
					query.Status = {"$in": ["ST_NO", "ST_NEVER"]};
					break;
				default :
					break;
			}
		}

		SocieteModel.find(query, "-history -files", function(err, doc) {
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
		res.json(req.societe);
	},
	create: function(req, res) {
		var societe = new SocieteModel(req.body);
		societe.author = {};
		societe.author.id = req.user._id;
		societe.author.name = req.user.name;

		if (societe.entity == null)
			societe.entity = req.user.entity;

		console.log(societe);
		societe.save(function(err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(societe);
		});
	},
	uniqId: function(req, res) {
		if (!req.query.idprof2)
			return res.send(404);

		SocieteModel.findOne({idprof2: req.query.idprof2}, "name entity", function(err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return res.json({});

			res.json(doc);
		});

	},
	update: function(req, res) {
		var societe = req.societe;
		societe = _.extend(societe, req.body);

		societe.save(function(err, doc) {
			res.json(doc);
		});
	},
	destroy: function(req, res) {
		var societe = req.societe;
		societe.remove(function(err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(societe);
			}
		});
	},
	select: function(req, res) {
		ExtrafieldModel.findById('extrafields:Societe', function(err, doc) {
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
									val.label = req.i18n.t("companies:" + i);
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
					val.label = doc.fields[req.query.field].values[i].label;
					result.push(val);
				}
			}
			doc.fields[req.query.field].values = result;

			res.json(doc.fields[req.query.field]);
		});
	}
};

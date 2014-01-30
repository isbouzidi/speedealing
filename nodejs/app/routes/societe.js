"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		config = require('../../config/config');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Societe', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/societe', auth.requiresLogin, function(req, res) {
		object.read(req, res);
		return;
	});

	// Specific for autocomplete
	app.get('/api/societe/select', auth.requiresLogin, function(req, res) {
		if (config.couchdb_name)
			object.db = config.couchdb_name;
		else
			object.db = req.query.db;

		console.dir(req.query);
		object.select(req, res);
	});

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
						
					if(docs[i].price_level)
						result[i].price_level = docs[i].price_level;
					else
						result[i].price_level = "BASE";
				}

			return res.send(200, result);
		});
	});

	app.post('/api/societe', auth.requiresLogin, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.create(req));
	});

	app.put('/api/societe', auth.requiresLogin, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.update(req));
	});

	app.del('/api/societe', auth.requiresLogin, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.update(req));
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
			var filename = req.files.files.path;
			if (fs.existsSync(filename)) {
				//console.log(filename);
				SocieteModel.findOne({_id: id}, function(err, societe) {

					if (err) {
						console.log(err);
						return res.send(500, {status: "Id not found"});
					}

					var opts;
					opts = {
						content_type: req.files.files.type,
						metadata: {
							_id: id
						}
					};

					return societe.addFile(req.files.files, opts, function(err, result) {
						if (err)
							console.log(err);

						//console.log(result);

						return res.send(200, {status: "ok"});
					});
				});
			} else
				res.send(500, {foo: "bar", status: "failed"});
		}
	});

	app.get('/api/societe/file/remove/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;
		console.log(id);
		console.log("toto");

		if (id && req.params.fileName) {
			SocieteModel.findOne({_id: id}, function(err, societe) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}
				societe.removeFile(req.params.fileName, function(err, result) {
					if (err)
						console.log(err);

					res.redirect('/societe/fiche.php?id=' + id);
				});
			});
		} else
			res.send(500, "File not found");

	});

	app.get('/api/societe/file/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {
			SocieteModel.findOne({_id: id}, function(err, societe) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}

				societe.getFile(req.params.fileName, function(err, store) {
					if (err)
						console.log(err);

					//console.log(store);
					res.type(store.contentType);
					//res.attachment(store.filename); // for downloading
					store.stream(true).pipe(res);

				});
			});
		}
	});

	app.del('/api/societe/file/:Id', auth.requiresLogin, function(req, res) {
		//console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.body.fileNames && id) {
			SocieteModel.findOne({_id: id}, function(err, societe) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}
				societe.removeFile(req.body.fileNames, function(err, result) {
					if (err)
						console.log(err);

					res.send(200, {status: "ok"});
				});
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

		SocieteModel.find({}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			for (i in doc) {
				var status = {};
				doc[i] = doc[i].value;
				delete doc[i].entity;
				delete doc[i].class;
				delete doc[i].tms;
				delete doc[i]._rev;
				delete doc[i].history;

				doc[i].societe_id = doc[i].societe.id;
				doc[i].societe = doc[i].societe.name;
				status.id = doc[i].Status;
				if (status_list.values[status.id]) {
					status.name = req.i18n.t("intervention." + status_list.values[status.id].label);
					status.css = status_list.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}


				doc[i].Status = status;
				if (!doc[i].group.url)
					doc[i].group.url = doc[i].group.name;
			}
			res.send(200, doc);
		});
	},
	update: function(req) {
		return req.body.models;
	},
	del: function(req) {
		return req.body.models;
	},
	select: function(req, res) {
		var db = this.connection.database(this.db);

		db.get('extrafields:Intervention', function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}
			else {
				var result = [];
				for (i in doc.fields.Status.values) {

					if (doc.fields.Status.values[i].enable) {
						var status = {};

						status.id = i;
						status.name = req.i18n.t("intervention." + doc.fields.Status.values[i].label);
						status.css = doc.fields.Status.values[i].cssClass;

						result.push(status);
					}
				}
				res.send(200, result);
			}
			return;
		});
	}
};
/**
 * Migration from Couchdb to MongoDB
 * @type type
 */

"use strict";

var cradle = require('cradle'),
		mongoose = require('mongoose'),
		mongodb = require('mongodb'),
		acl = require('mongoose-acl'),
		timestamps = require('mongoose-timestamp'),
		config = require(__dirname +'/../../config/config'),
		fs = require('fs');

var ProductModel = mongoose.model('product');

var connection = new (cradle.Connection)(config.couchdb.host, config.couchdb.port, {
	secure: false,
	cache: true,
	cacheSize: 1024,
	auth: {username: config.couchdb.user, password: config.couchdb.passwd}
});

var couchdb = connection.database(config.couchdb.db);

/**
 * Schema
 */
var WidgetSchema = new mongoose.Schema({
	id: {type: String},
	from: {type: String},
	to: {type: String}});
WidgetSchema.plugin(acl.object);
WidgetSchema.plugin(timestamps);

module.exports = function(app, passport, auth) {

	app.get('/migrate/couchdb', function(req, res) {
		var migrate = new Migrate(req, res);

		migrate.exec();
		return;
	});

	app.get('/migrate/notes', function(req, res) {
		var collection = ["Commande", "Societe", "Agenda"];

		mongodb.connect(config.db, function(err, db) {
			if (err)
				return console.log(err);

			var updateCollection = function(collec) {
				db.collection(collec).find().toArray(function(err, doc) {
					if (err) {
						console.log(err);
						return res.send(500, err);
					}

					for (var i = 0; i < doc.length; i++) {
						if (typeof doc[i].notes === 'string') {
							var _id = doc[i]._id;
							var notes = {};

							notes.note = doc[i].notes;
							notes.title = "Notes";
							notes.edit = true;

							doc[i].notes = [];
							doc[i].notes.push(notes);
							delete doc[i]._id;

							console.log(doc[i].notes);
							db.collection(collec).update({_id: _id}, {$set: doc[i]}, function(err) {
								if (err)
									console.warn(err.message);
							});

						}
					}

					/*	if (doc !== null) {
					 var update = {};
					 update[key] = row[key];
					 update[key].id = doc._id;
					 db.collection(value).update({_id: row._id}, {$set: update}, {w: 1}, function(err) {
					 if (err)
					 console.warn(err.message);
					 });
					 }*/
				});
			};


			for (var collec = 0; collec < collection.length; collec++) {
				updateCollection(collection[collec]);

			}

			res.send(200, "ok");
		});

		return;
	});

	app.get('/migrate/agenda/usertodo', function(req, res) {
		mongodb.connect('mongodb://' + config.mongo.host + ":" + config.mongo.port + "/" + config.mongo.database, function(err, db) {
			if (err)
				return console.log(err);

			db.collection("Agenda").find().toArray(function(err, doc) {
				if (err) {
					console.log(err);
					return res.send(500, err);
				}

				for (var i = 0; i < doc.length; i++) {
					if (typeof doc[i].usertodo.id !== 'undefined') {

						var usertodo = [];
						usertodo.push(doc[i].usertodo);

						db.collection("Agenda").update({_id: doc[i]._id}, {$set: {usertodo: usertodo}}, function(err) {
							if (err)
								console.warn(err.message);
						});

					}
				}

				res.send(200, "ok");
			});
		});

		return;
	});

	app.post('/migrate/langs', function(req, res) {
		var data = req.body;

		var file = req.query.file;
		var dir = req.query.lang;

		var outputFilename = '/tmp/locales/' + dir + '/' + file + '.json';
		//console.log(outputFilename);

		var dir_lang = '/tmp/locales/' + dir;

		fs.mkdir(dir_lang, parseInt('0755', 8), function(e) {
			if (e)
				console.log(e);

			fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log("JSON langs saved");
				}
			});
		});

		res.send(200, {});
	});

	app.get('/migrate/product/id', function(req, res) {
		ProductModel.find({}, function(err, doc) {
			if (err)
				console.log(err);

			for (var i in doc) {

				var update = function(product) {
					var history = product.history;

					var price = product.price;

					ProductModel.update({_id: product._id}, {$set: {history: [], price: []}}, function(err) {
						if (err)
							console.log(err);

						for (var j in price)
							ProductModel.update({_id: product._id}, {$push: {price: price[j]}}, function(err) {
								if (err)
									console.log(err);
							});

						for (var j in history)
							ProductModel.update({_id: product._id}, {$push: {history: history[j]}}, function(err) {
								if (err)
									console.log(err);
							});
					});
				};

				update(doc[i]);

			}

			res.send(200, {});

		});
	});
};

var ModelWidget = mongoose.model('widget', WidgetSchema);

function Migrate(req, res) {

	this.res = res;
	this.req = req;

}

Migrate.prototype = {
	exec: function() {

		var res = this.res;

		couchdb.view('unlink/all', function(err, rows) {

			var i = 1;

			var oldId = function(db, value, row, key, collection) {
				db.collection(collection).findOne({oldId: row[key].id}, function(err, doc) {
					if (err)
						console.log(err);

					if (doc !== null) {
						var update = {};
						update[key] = row[key];
						update[key].id = doc._id;
						db.collection(value).update({_id: row._id}, {$set: update}, {w: 1}, function(err) {
							if (err)
								console.warn(err.message);
						});
					}
				});
			};

			var cb = function(db) {
				if (i >= rows.length) {
					/**
					 * Match old_ID to new Object_ID
					 */
					db.collectionNames(function(err, collections) {
						//for each collection
						collections.forEach(function(value) {
							if (value.name.indexOf("system") !== -1)
								return;

							var dbCollect = value.name.slice(value.name.indexOf(".") + 1); // collection name
							//console.log(dbCollect);
							db.collection(dbCollect).find().toArray(function(err, results) {
								//console.log("res"+dbCollect+results.length);
								// for each values in a collection
								if (err)
									console.log(err);
								results.forEach(function(row) {
									//console.log(row);
									var object = ["societe", "contact", "product", "client"];

									for (var j in object) {
										// if societe.id exist
										//console.log();
										if (typeof row[object[j]] === 'object'
												&& typeof row[object[j]].id !== 'undefined') {
											// search oldId
											var collection = "";

											if (object[j] == 'client')
												collection = 'Societe';
											else
												collection = object[j].charAt(0).toUpperCase() + object[j].slice(1); // to upper case first letter
											oldId(db, dbCollect, row, object[j], collection);
										}
									}
								});
							});
						});
					});
					/**
					 * Remove old_ID
					 */

					//db.close();
					res.send(200, {"ok": rows.length});
				}
				else
					i++;
			};

			mongodb.connect(config.db, function(err, db) {
				if (err)
					return console.log(err);
				rows.forEach(function(value) {
					if (typeof value.class !== 'undefined') {

						//correct class
						if (value.class === 'extrafields')
							value.class = 'ExtraFields';
						if (value.class === 'system')
							value.class = 'Conf';


						// Get the class collection
						var classs = value.class;

						// _id
						if (classs !== 'User'
								&& classs !== 'ExtraFields'
								&& classs !== 'Conf'
								&& classs !== 'Dict'
								&& classs !== 'menu'
								&& classs !== 'UserGroup'
								&& classs !== 'DolibarrModules') {
							value.oldId = value._id;
							delete value._id;

						}

						var convert_date = function(object) {
							var tabdate = ["tms", "datec", "datep", "datef", "date", "date_commande"];

							for (var j in tabdate) {
								if (typeof object[tabdate[j]] !== 'undefined') {
									object[tabdate[j]] = new Date(object[tabdate[j]]);
								}
							}
						};

						convert_date(value);

						if (typeof value.history !== 'undefined') {
							for (var j in value.history) {
								convert_date(value.history[j]);
							}
						}

						if (typeof value.trashed_by !== 'undefined') {
							convert_date(value.trashed_by);
						}

						//$value->id = $value->_id;

						//clean specific value for couchdb
						delete value.class;
						delete value._rev;
						delete value._deleted_conflicts;
						delete value._conflicts;

						//if (value._id == "module:User")
						//		console.log(value)

						db.collection(classs).save(value, {w: 1}, function(err, objects) {
							if (err)
								console.warn(err.message);

							cb(db);
							// Insert this new document into mongo class collection
						});
					}
				});
			});
		});
	},
	acl: function() {
		/** 
		 * Users Rights
		 */

		var object = new this.Object();

		object.setAccess('foo', ['c', 'd']);
		object.save();
		this.send(null, {"ok": object.getAccess('foo')});
	},
	send: function(err, data) {
		this.db.close();
		if (err)
			this.res.send(500);
		else
			this.res.send(200, data);
	}
};
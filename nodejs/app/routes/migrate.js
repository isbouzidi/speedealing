/**
 * Migration from Mysql Dolibarr to MongoDB
 * @type type
 */

"use strict";

var mongoose = require('mongoose'),
		mongodb = require('mongodb'),
		timestamps = require('mongoose-timestamp'),
		_ = require('lodash'),
		async = require('async'),
		config = require(__dirname + '/../../config/config'),
		fs = require('fs');

var connection;

if (config.couchdb !== undefined) {
	var cradle = require('cradle');
	var ProductModel = mongoose.model('product');

	connection = new (cradle.Connection)(config.couchdb.host, config.couchdb.port, {
		secure: false,
		cache: true,
		cacheSize: 1024,
		auth: {username: config.couchdb.user, password: config.couchdb.passwd}
	});

	var couchdb = connection.database(config.couchdb.db);
}

if (config.mysql !== undefined) {
	var mysql = require('mysql');
	connection = mysql.createConnection({
		host: config.mysql.host,
		user: config.mysql.user,
		password: config.mysql.password,
		database: config.mysql.db
	});
}

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var UserModel = mongoose.model('user');
var ProductModel = mongoose.model('product');
var BillModel = mongoose.model('bill');

var Task = require('../controllers/task');

module.exports = function (app, passport, auth) {

	var migrate = new Migrate();
	var migrateMySQL = new MigrateMySQL();

	app.get('/migrate/couchdb', function (req, res) {

		//migrate.exec(req, res);
		return;
	});

	app.get('/migrate/couchdb/:moduleId', function (req, res) {

		switch (req.params.moduleId) {
			case "societe":
				migrate.societe(req, res);
				break;
			case "user":
				migrate.user(req, res);
				break;
			case "contact":
				migrate.contact(req, res);
				break;
			case "task":
				migrate.task(req, res);
				break;
		}

		res.send(200);

	});

	app.get('/migrate/mysql/:moduleId', function (req, res) {

		switch (req.params.moduleId) {
			case "societe":
				migrateMySQL.societe(req, res);
				break;
			case "user":
				migrateMySQL.user(req, res);
				break;
			case "contact":
				migrateMySQL.contact(req, res);
				break;
			case "product":
				migrateMySQL.product(req, res);
				break;
			case "bill":
				migrateMySQL.bills(req, res);
				break;
			case "task":
				migrateMySQL.task(req, res);
				break;
		}

		res.send(200);

	});

	app.get('/migrate/notes', function (req, res) {
		var collection = ["Commande", "Societe", "Agenda"];

		mongodb.connect(config.db, function (err, db) {
			if (err)
				return console.log(err);

			var updateCollection = function (collec) {
				db.collection(collec).find().toArray(function (err, doc) {
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
							db.collection(collec).update({_id: _id}, {$set: doc[i]}, function (err) {
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

	app.get('/migrate/agenda/usertodo', function (req, res) {
		mongodb.connect('mongodb://' + config.mongo.host + ":" + config.mongo.port + "/" + config.mongo.database, function (err, db) {
			if (err)
				return console.log(err);

			db.collection("Agenda").find().toArray(function (err, doc) {
				if (err) {
					console.log(err);
					return res.send(500, err);
				}

				for (var i = 0; i < doc.length; i++) {
					if (typeof doc[i].usertodo.id !== 'undefined') {

						var usertodo = [];
						usertodo.push(doc[i].usertodo);

						db.collection("Agenda").update({_id: doc[i]._id}, {$set: {usertodo: usertodo}}, function (err) {
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

	app.post('/migrate/langs', function (req, res) {
		var data = req.body;

		var file = req.query.file;
		var dir = req.query.lang;

		var outputFilename = '/tmp/locales/' + dir + '/' + file + '.json';
		//console.log(outputFilename);

		var dir_lang = '/tmp/locales/' + dir;

		fs.mkdir(dir_lang, parseInt('0755', 8), function (e) {
			if (e)
				console.log(e);

			fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("JSON langs saved");
				}
			});
		});

		res.send(200, {});
	});

	app.get('/migrate/product/id', function (req, res) {
		ProductModel.find({}, function (err, doc) {
			if (err)
				console.log(err);

			for (var i in doc) {

				var update = function (product) {
					var history = product.history;

					var price = product.price;

					ProductModel.update({_id: product._id}, {$set: {history: [], price: []}}, function (err) {
						if (err)
							console.log(err);

						for (var j in price)
							ProductModel.update({_id: product._id}, {$push: {price: price[j]}}, function (err) {
								if (err)
									console.log(err);
							});

						for (var j in history)
							ProductModel.update({_id: product._id}, {$push: {history: history[j]}}, function (err) {
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

function Migrate() {
}

Migrate.prototype = {
	task: function (req, res) {

		var htmlToText = require('html-to-text');

		couchdb.view('Agenda/list', function (err, rows) {
			if (err)
				return console.log(err);

			//console.log(rows[0]);

			rows.forEach(function (row) {

				async.parallel({
					societe: function (callback) {
						if (row.societe.id == null)
							return callback(null, null);

						SocieteModel.findOne({oldId: row.societe.id}, "_id name", callback);
					},
					contact: function (callback) {
						if (row.contact.id == null)
							return callback(null, null);

						ContactModel.findOne({oldId: row.contact.id}, "_id firstname lastname", callback);
					}
				}, function (err, results) {

					delete row._id;

					if (results.societe)
						row.societe.id = results.societe._id;
					else
						delete row.societe.id;

					if (results.contact)
						row.contact.id = results.contact._id;
					else
						delete row.contact.id;

					var datec;
					if (typeof row.datec !== 'undefined')
						datec = new Date(row.datec);
					else
						datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

					//console.log(row);
					//return;

					var datef = null;
					if (typeof row.datef == 'string')
						datef = new Date(row.datef);

					var datep = null;
					if (typeof row.datep == 'string')
						datep = new Date(row.datep);

					if (!datef)
						datef = new Date(row.tms);

					if (datep == null || datef == null)
						console.log(row);

					switch (row.type_code) {
						case "RDV_RDV" :
							row.type_code = "AC_RDV";
							break;
					}

					var note = "";

					if (row.notes)
						note = htmlToText.fromString(row.notes, {
							wordwrap: 130
						});

					var task = {
						name: row.label,
						societe: row.societe,
						contact: row.contact || null,
						datec: datec,
						datep: datep, // date de debut
						datef: datef,
						type: row.type_code,
						entity: row.entity,
						author: row.author,
						notes: [
							{
								author: row.author,
								datec: new Date(row.tms),
								percentage: row.percentage || 0,
								note: note
							}
						]
					};

					switch (row.Status) {
						case "DONE" :
							task.archived = true;
							task.usertodo = row.usertodo;
							task.notes[0].percentage = 100;
							if (row.userdone.id)
								task.userdone = row.userdone;
							else
								task.userdone = row.usertodo;
							break;
						default:
							task.usertodo = row.usertodo;
					}

					if (!task.usertodo.name)
						task.usertodo.name = task.usertodo.id;

					if (!task.author.name)
						task.author.name = task.author.id;

					//console.log(task);
					//return;
					Task.create(task, req.user, null, function (err, task) {
						if (err)
							console.log(err);
						//	console.log(task);
					});

				});
			});
		});
	},
	contact: function (req, res) {

		couchdb.view('Contact/list', function (err, rows) {
			if (err)
				return console.log(err);

			rows.forEach(function (row) {

				var _id = row._id;

				SocieteModel.findOne({oldId: row.societe.id}, "_id name", function (err, societe) {
					if (err)
						console.log(err);

					delete row._id;

					if (societe)
						row.societe.id = societe._id;
					else
						delete row.societe.id;

					var datec;
					if (typeof row.datec !== 'undefined')
						datec = new Date(row.datec);
					else
						datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

					delete row.datec;

					var contact = new ContactModel(row);

					contact.oldId = _id;

					contact.datec = datec;
					contact.createdAt = datec;

					if (row.Tag && row.Tag.length)
						contact.Tag = row.Tag;

					//console.log(contact);

					//return;

					contact.save(function (err, doc) {
						if (err) {
							console.log(err);
						}

					});
				});
			});
		});
	},
	societe: function (req, res) {
		var convert_action_co = {
			"ACO_NONE": {
				"enable": true,
				"label": "-"
			},
			"ACO_ARGUDYN": {
				"enable": true,
				"label": "Argumentaire dynamiques"
			},
			"ACO_PRODPACK": {
				"enable": true,
				"label": "Production packaging"
			},
			"ACO_CATALOGENR": {
				"enable": true,
				"label": "Catalogues enrichis"
			},
			"ACO_SERGAME": {
				"enable": true,
				"label": "Serious game"
			},
			"ACO_OUTILVENTE": {
				"enable": true,
				"label": "Outils d'aide à la vente"
			},
			"ACO_NEWIDENTITY": {
				"enable": true,
				"label": "Nouvelle identité"
			},
			"ACO_PLATCOLL": {
				"enable": true,
				"label": "Plateforme collaborative"
			}
		};

		couchdb.view('Societe/list', function (err, rows) {
			if (err)
				return console.log(err);

			//console.log(rows[0]);

			rows.forEach(function (row) {

				var _id = row._id;

				delete row._id;
				var notes = row.notes;

				delete row.notes;

				var datec;
				if (typeof row.datec !== 'undefined')
					datec = new Date(row.datec);
				else
					datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

				delete row.datec;

				var societe = new SocieteModel(row);

				societe.datec = datec;
				societe.createdAt = datec;

				if (notes) {
					societe.notes.push({
						note: notes,
						author: {},
						datec: new Date(row.tms)
					});
				}

				if (row.public_notes)
					societe.notes.push({
						note: row.public_notes,
						author: {},
						datec: new Date(row.tms)
					});

				//console.log(row.action_co);
				if (row.action_co && row.action_co != "ACO_NONE")
					societe.familyProduct.push(convert_action_co[row.action_co].label);

				societe.oldId = _id;

				//console.log(societe);

				societe.save(function (err, doc) {
					if (err) {
						console.log(err);
					}

				});
			});
		});
	},
	user: function (req, res) {
		var couchdb = connection.database("system");

		couchdb.view('User/list', function (err, rows) {
			if (err)
				return console.log(err);

			//console.log(rows[0]);

			rows.forEach(function (row) {
				UserModel.findOne({_id: row._id}, function (err, user) {

					if (user == null)
						user = new UserModel(row);
					else
						user = _.extend(user, row);

					user.lastname = row.Lastname;
					user.firstname = row.Firstname;

					user.createdAt = new Date(row.tms);
					if (row.NewConnection)
						user.NewConnection = new Date(row.NewConnection);
					if (row.LastConnection)
						user.LastConnection = new Date(row.LastConnection);

					//console.log(user);

					user.save(function (err, doc) {
						if (err) {
							console.log(err);
						}

					});
				});
			});
		});
	},
	exec: function () {

		var res = this.res;

		couchdb.view('unlink/all', function (err, rows) {
			if (err)
				return console.log(err);

			var i = 1;

			var oldId = function (db, value, row, key, collection) {
				db.collection(collection).findOne({oldId: row[key].id}, function (err, doc) {
					if (err)
						console.log(err);

					if (doc !== null) {
						var update = {};
						update[key] = row[key];
						update[key].id = doc._id;
						db.collection(value).update({_id: row._id}, {$set: update}, {w: 1}, function (err) {
							if (err)
								console.warn(err.message);
						});
					}
				});
			};
			var cb = function (db) {
				if (i >= rows.length) {
					/**
					 * Match old_ID to new Object_ID
					 */
					db.collectionNames(function (err, collections) {
						//for each collection
						collections.forEach(function (value) {
							if (value.name.indexOf("system") !== -1)
								return;

							var dbCollect = value.name.slice(value.name.indexOf(".") + 1); // collection name
							//console.log(dbCollect);
							db.collection(dbCollect).find().toArray(function (err, results) {
								//console.log("res"+dbCollect+results.length);
								// for each values in a collection
								if (err)
									console.log(err);
								results.forEach(function (row) {
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
			mongodb.connect(config.db, function (err, db) {
				if (err)
					return console.log(err);

				rows.forEach(function (value) {
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
						var convert_date = function (object) {
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

						db.collection(classs).save(value, {w: 1}, function (err, objects) {
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
	send: function (err, data) {
		this.db.close();
		if (err)
			this.res.send(500);
		else
			this.res.send(200, data);
	}
};

function MigrateMySQL() {
}

MigrateMySQL.prototype = {
	task: function (req, res) {

		var htmlToText = require('html-to-text');

		couchdb.view('Agenda/list', function (err, rows) {
			if (err)
				return console.log(err);

			//console.log(rows[0]);

			rows.forEach(function (row) {

				async.parallel({
					societe: function (callback) {
						if (row.societe.id == null)
							return callback(null, null);

						SocieteModel.findOne({oldId: row.societe.id}, "_id name", callback);
					},
					contact: function (callback) {
						if (row.contact.id == null)
							return callback(null, null);

						ContactModel.findOne({oldId: row.contact.id}, "_id firstname lastname", callback);
					}
				}, function (err, results) {

					delete row._id;

					if (results.societe)
						row.societe.id = results.societe._id;
					else
						delete row.societe.id;

					if (results.contact)
						row.contact.id = results.contact._id;
					else
						delete row.contact.id;

					var datec;
					if (typeof row.datec !== 'undefined')
						datec = new Date(row.datec);
					else
						datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

					//console.log(row);
					//return;

					var datef = null;
					if (typeof row.datef == 'string')
						datef = new Date(row.datef);

					var datep = null;
					if (typeof row.datep == 'string')
						datep = new Date(row.datep);

					if (!datef)
						datef = new Date(row.tms);

					if (datep == null || datef == null)
						console.log(row);

					switch (row.type_code) {
						case "RDV_RDV" :
							row.type_code = "AC_RDV";
							break;
					}

					var note = "";

					if (row.notes)
						note = htmlToText.fromString(row.notes, {
							wordwrap: 130
						});

					var task = {
						name: row.label,
						societe: row.societe,
						contact: row.contact || null,
						datec: datec,
						datep: datep, // date de debut
						datef: datef,
						type: row.type_code,
						entity: row.entity,
						author: row.author,
						notes: [
							{
								author: row.author,
								datec: new Date(row.tms),
								percentage: row.percentage || 0,
								note: note
							}
						]
					};

					switch (row.Status) {
						case "DONE" :
							task.archived = true;
							task.usertodo = row.usertodo;
							task.notes[0].percentage = 100;
							if (row.userdone.id)
								task.userdone = row.userdone;
							else
								task.userdone = row.usertodo;
							break;
						default:
							task.usertodo = row.usertodo;
					}

					if (!task.usertodo.name)
						task.usertodo.name = task.usertodo.id;

					if (!task.author.name)
						task.author.name = task.author.id;

					//console.log(task);
					//return;
					Task.create(task, req.user, null, function (err, task) {
						if (err)
							console.log(err);
						//	console.log(task);
					});

				});
			});
		});
	},
	contact: function (req, res) {
		var $sql = "";

		$sql = "SELECT s.*, s.name as lastname, ";
		$sql += " p.code, u1.login as user_creat, u2.login as user_modif";
		$sql += " FROM (llx_socpeople as s";
		$sql += " ) ";
		$sql += " LEFT JOIN llx_c_pays as p on (p.rowid = s.fk_pays)";
		$sql += " LEFT JOIN llx_user AS u1 ON u1.rowid = s.fk_user_creat";
		$sql += " LEFT JOIN llx_user AS u2 ON u2.rowid = s.fk_user_modif";

		connection.query($sql, function (err, rows) {
			if (err)
				console.log(err);

			//console.log(rows);
			//console.log(rows.length);


			//console.log(rows[0]);

			var tab = [];
			tab.push(rows[0]);

			rows.forEach(function (row) {

				var _id = row._id;

				SocieteModel.findOne({oldId: row.fk_soc}, "_id name", function (err, societe) {
					if (err)
						console.log(err);

					delete row._id;

					row.societe = {};
					if (societe) {
						row.societe.id = societe._id;
						row.societe.name = societe.name;
					}

					var datec;
					if (typeof row.datec !== 'undefined')
						datec = new Date(row.datec);
					else
						datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

					delete row.datec;

					ContactModel.findOne({oldId: row.rowid}, function (err, contact) {

						if (!contact)
							contact = new ContactModel(row);
						else
							contact = _.extend(contact, row);

						contact.oldId = row.rowid;

						contact.datec = datec;
						contact.createdAt = datec;

						if (row.Tag && row.Tag.length)
							contact.Tag = row.Tag;

						//console.log(contact);

						//return;

						contact.save(function (err, doc) {
							if (err) {
								console.log(err);
							}

						});
					});
				});
			});
		});
	},
	societe: function (req, res) {
		var $sql = "";

		$sql = "SELECT s.*, s.cp as zip, s.ville as town, s.nom as name, ";
		$sql += " st.code as Status, p.code as country_id, u1.login as user_creat, u2.login as user_modif ";
		$sql += ",c.label, cp.code as mode_reglement, pt.code as cond_reglement ";
		$sql += ",u.login";

		$sql += " FROM ( llx_societe as s";
		$sql += " ) ";
		$sql += " LEFT JOIN llx_c_pays as p on (p.rowid = s.fk_pays)";
		$sql += " LEFT JOIN llx_c_stcomm as st ON st.id = s.fk_stcomm";
		$sql += " LEFT JOIN llx_user AS u1 ON u1.rowid = s.fk_user_creat";
		$sql += " LEFT JOIN llx_user AS u2 ON u2.rowid = s.fk_user_modif";
		$sql += " LEFT JOIN llx_categorie_societe as cs ON cs.fk_societe = s.rowid ";
		$sql += " LEFT JOIN llx_categorie as c ON c.rowid=cs.fk_categorie ";
		$sql += " LEFT JOIN llx_c_paiement as cp ON cp.id=s.mode_reglement ";
		$sql += " LEFT JOIN llx_c_payment_term as pt ON pt.rowid=s.cond_reglement ";

		$sql += " LEFT JOIN llx_societe_commerciaux as sc ON sc.fk_soc = s.rowid";
		$sql += " LEFT JOIN llx_user AS u ON u.rowid = sc.fk_user ";


		connection.query($sql, function (err, rows) {
			if (err)
				console.log(err);

			//console.log(rows);
			//console.log(rows.length);


			//console.log(rows[0]);

			rows.forEach(function (row) {

				var _id = row._id;

				delete row._id;
				var notes = row.note;

				delete row.note;

				var datec;
				if (typeof row.datec !== 'undefined')
					datec = new Date(row.datec);
				else
					datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

				delete row.datec;

				row.state_id = row.fk_departement;
				row.phone = row.tel;

				row.idprof1 = row.siren;
				row.idprof2 = row.siret;
				row.idprof3 = row.ape;
				if (row.latitude && row.longitude) {
					row.gps = [];
					row.gps[0] = row.latitude;
					row.gps[1] = row.longitude;
				}
				row.entity = 'ALL';
				delete row.price_level;

				SocieteModel.findOne({oldId: row.rowid}, function (err, societe) {

					if (!societe) {
						societe = new SocieteModel(row);

						if (notes) {
							societe.notes.push({
								note: notes,
								author: {},
								datec: new Date(row.tms)
							});
						}

						if (row.public_notes)
							societe.notes.push({
								note: row.public_notes,
								author: {},
								datec: new Date(row.tms)
							});

					} else
						societe = _.extend(societe, row);

					societe.datec = datec;
					societe.createdAt = datec;


					//console.log(row.action_co);

					societe.oldId = row.rowid;

					//console.log(societe);

					societe.save(function (err, doc) {
						if (err) {
							console.log(err);
						}

					});
				});
			});
		});
	},
	user: function (req, res) {
		var couchdb = connection.database("system");

		couchdb.view('User/list', function (err, rows) {
			if (err)
				return console.log(err);

			//console.log(rows[0]);

			rows.forEach(function (row) {
				UserModel.findOne({_id: row._id}, function (err, user) {

					if (user == null)
						user = new UserModel(row);
					else
						user = _.extend(user, row);

					user.lastname = row.Lastname;
					user.firstname = row.Firstname;

					user.createdAt = new Date(row.tms);
					if (row.NewConnection)
						user.NewConnection = new Date(row.NewConnection);
					if (row.LastConnection)
						user.LastConnection = new Date(row.LastConnection);

					//console.log(user);

					user.save(function (err, doc) {
						if (err) {
							console.log(err);
						}

					});
				});
			});
		});
	},
	product: function (req, res) {
		var $sql = "";

		$sql = "SELECT p.*, p.code_comptable_achat as compta_buy, p.price as pu_ht, p.code_comptable_vente as compta_sell,  c.code, u1.login as user_author ";
		$sql += " FROM ( llx_product as p";
		$sql += " ) ";
		$sql += " LEFT JOIN llx_c_pays as c on (c.rowid = p.fk_country)";
		$sql += " LEFT JOIN llx_user AS u1 ON u1.rowid = p.fk_user_author";

		connection.query($sql, function (err, rows) {
			if (err)
				console.log(err);

			//console.log(rows);
			//console.log(rows.length);

			//console.log(rows[0]);

			//var tab = [];
			//tab.push(rows[0]);

			rows.forEach(function (row) {

				delete row.entity;
				delete row.price;

				delete row._id;
				var notes = row.note;

				delete row.note;

				var datec;
				if (typeof row.datec !== 'undefined')
					datec = new Date(row.datec);
				else
					datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

				delete row.datec;

				if (row.tosell && row.tobuy)
					row.Status = "SELLBUY";
				else if (row.tosell)
					row.Status = "SELL";
				else if (row.tobuy)
					row.Status = "BUY";
				else
					row.Status = "NONE";

				ProductModel.findOne({oldId: row.rowid}, function (err, product) {

					if (!product) {
						product = new ProductModel(row);
					} else
						product = _.extend(product, row);

					product.datec = datec;
					product.createdAt = datec;


					//console.log(row.action_co);

					product.oldId = row.rowid;

					console.log(product);
					//return;

					product.save(function (err, doc) {
						if (err) {
							console.log(err);
						}

					});
				});
			});
		});
	},
	bills: function (req, res) {

		var tabBills = {};
		var tabLines = [];

		async.parallel({
			bills: function (callback) {

				var $sql = "";

				$sql = 'SELECT f.*, f.facnumber as ref, pt.code as cond_reglement_code, cp.code as mode_reglement_code ';
				$sql += ' FROM llx_facture as f';
				$sql += " LEFT JOIN llx_c_paiement as cp ON cp.id=f.fk_mode_reglement ";
				$sql += " LEFT JOIN llx_c_payment_term as pt ON pt.rowid=f.fk_cond_reglement ";

				connection.query($sql, function (err, rows) {
					if (err)
						console.log(err);

					//console.log(rows);
					//console.log(rows.length);

					//console.log(rows[0]);

					//var tab = [];
					//tab.push(rows[0]);

					async.each(rows, function (row, cb) {

						delete row.entity;

						delete row._id;
						var notes = row.note;

						delete row.note;

						var datec;
						if (typeof row.datec !== 'undefined')
							datec = new Date(row.datec);
						else
							datec = new Date(row.tms);

//console.log(row.datec + "/"+row.tms+":" + datec);

						delete row.datec;

						if (row.paye)
							row.Status = "PAID";
						else if (row.fk_status == 0)
							row.Status = "DRAFT";
						else if (row.fk_status == 1)
							row.Status = "NOT_PAID";
						else
							row.Status = "DRAFT";

						row.entity = "symeos";

						if (!row.cond_reglement_code)
							delete row.cond_reglement_code;

						SocieteModel.findOne({oldId: row.fk_soc}, function (err, societe) {

							BillModel.findOne({oldId: row.rowid}, function (err, bill) {

								if (!bill) {
									bill = new BillModel(row);
								} else
									bill = _.extend(bill, row);
								bill.datec = datec;
								bill.createdAt = datec;

								bill.lines = [];
								bill.total_ht = 1;

								bill.dater = row.date_lim_reglement;

								bill.client = {
									id: societe._id,
									name: societe.name
								};

								bill.address = societe.address;
								bill.zip = societe.zip;
								bill.town = societe.town;

								//console.log(row.action_co);

								bill.oldId = row.rowid;
								//console.log(bill);
								//return;

								tabBills[row.rowid] = bill;
								cb();
							});
						});
					}, function () {
						callback();
					});
				});
			},
			lines: function (callback) {
				var $sql = "";

				$sql = 'SELECT l.rowid, l.fk_product, l.fk_facture, l.fk_parent_line, l.description, l.product_type, l.price, l.qty, l.tva_tx, ';
				$sql += ' l.localtax1_tx, l.localtax2_tx, l.remise, l.remise_percent, l.fk_remise_except, l.subprice,';
				$sql += ' l.rang, l.special_code,';
				$sql += ' l.date_start as date_start, l.date_end as date_end,';
				$sql += ' l.info_bits, l.total_ht, l.total_tva, l.total_localtax1, l.total_localtax2, l.total_ttc, l.fk_code_ventilation, l.fk_export_compta, ';
				$sql += ' p.ref as product_ref, p.fk_product_type as fk_product_type, p.label as product_label, p.description as product_desc';
				$sql += ' FROM llx_facturedet as l';
				$sql += ' LEFT JOIN llx_product as p ON l.fk_product = p.rowid';
				$sql += ' ORDER BY l.rang';

				connection.query($sql, function (err, rows) {
					if (err)
						console.log(err);

					async.each(rows, function (row, cb) {
						var line = {
							fk_facture: row.fk_facture,
							qty: row.qty,
							tva_tx: row.tva_tx,
							pu_ht: row.price,
							description: row.product_desc,
							product: {},
							product_type: (row.fk_product_type == 1 ? "SERVICE" : "PRODUCT"),
							total_tva: row.total_tva,
							total_ttc: row.total_ttc,
							discount: row.remise_percent,
							total_ht: row.total_ht,
							date_start: (row.date_start instanceof Date ? row.date_start : null),
							date_end: (row.date_end instanceof Date ? row.date_end : null)
						};

						ProductModel.findOne({oldId: row.fk_product}, {_id: 1, ref: 1}, function (err, product) {
							if (err)
								console.log(err);

							if (!product)
								return "produit manquant " + row.fk_product;

							line.product = {
								id: product._id,
								name: product.ref,
								label: row.product_label
							};

							tabLines.push(line);
							//console.log(row);

							cb();
						});
					}, function () {
						callback();
					});
				});
			}
		}, function () {

			//add lines to bills
			for (var i = 0; i < tabLines.length; i++) {
				tabBills[tabLines[i].fk_facture].lines.push(tabLines[i]);
			}


			for (var i in tabBills) {
				tabBills[i].save(function (err, doc) {
					if (err) {
						console.log(err);
					}

				});
			}
			console.log("save bills : ok");

		});
	}
};

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
	var contact = new Contact();

	app.get('/api/societe', auth.requiresLogin, object.read);
	app.get('/api/societe/uniqId', auth.requiresLogin, object.uniqId);
	app.get('/api/societe/contact', auth.requiresLogin, contact.read);
	app.get('/api/societe/contact/:contactId', auth.requiresLogin, contact.show);
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
				{ref: new RegExp(req.body.filter.filters[0].value, "i")},
				{code_client: new RegExp(req.body.filter.filters[0].value, "i")}
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

					result[i].price_level = docs[i].price_level;

					// add address
					result[i].address = {};
					result[i].address.name = docs[i].name;
					result[i].address.address = docs[i].address;
					result[i].address.zip = docs[i].zip;
					result[i].address.town = docs[i].town;
					result[i].address.country = docs[i].country;

					result[i].mode_reglement_code = docs[i].mode_reglement;
					result[i].cond_reglement_code = docs[i].cond_reglement;
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
			{$group: {_id: "$segmentation.text"}},
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
					result.push({text: docs[i]._id});
				}

			return res.send(200, result);
		});
	});

	app.post('/api/societe/import/kompass', /*ensureAuthenticated,*/ function(req, res) {

		var conv = [
			"kompass_id",
			"name",
			"address",
			"address1",
			"town",
			"zip",
			false,
			"country_id",
			"phone",
			false,
			"url",
			"effectif_id",
			false,
			false,
			false,
			"typent_id",
			"idprof3",
			false,
			false,
			false,
			false,
			false,
			"brand",
			"idprof2",
			false,
			false,
			false,
			"fax",
			false,
			"email",
			false,
			"BP",
			false,
			"forme_juridique_code",
			"yearCreated",
			false,
			"segmentation",
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			"civilite",
			"firstname",
			"lastname",
			"poste",
			"sex",
			false,
			false,
			false,
			false,
			"annualCA",
			"capital",
			false,
			"annualEBE",
			false,
			false,
			false,
			false,
			"risk",
			false
		];

		var conv_id = {
			civilite: {
				"": "NO",
				"Mme": "MME",
				"Mlle": "MLE",
				"M.": "MR"
			},
			effectif_id: {
				"": "EF0",
				"5": "EF1-5",
				"10": "EF6-10",
				"50": "EF11-50",
				"De 50 à 99": "EF51-100",
				"De 100 à 249": "EF101-250",
				"De 250 à 499": "EF251-500",
				"De 500 à 999": "EF501-1000",
				"De 1 000 à 4 999": "EF1001-5000",
				"Plus de 5 000": "EF5000+"
			},
			sex: {
				"":null,
				"Homme": "H",
				"Femme": "F"
			},
			risk: {
				"": "NO",
				"Risque fort": "HIGH",
				"Risque faible": "LOW",
				"Risque modéré": "MEDIUM"
			},
			typent_id: {
				"Siège": "TE_SIEGE",
				"Etablissement": "TE_ETABL",
				"Publique / Administration": "TE_PUBLIC"
			},
			forme_juridique_code: {
				"":null,
				"59":null,
				"60":null,
				"62":null,
				"Affaire Personnelle (AF.PERS)": "11",
				"Association sans but lucratif (AS 1901)": "92",
				"Coopérative (COOPE.)": "51",
				"Epic": "41",
				"Etablissement Public (ET-PUBL)": "73",
				"Ets Public Administratif (E.P.A.)": "73",
				"EURL": "58",
				"Groupement Intérêt Economique (GIE)": "62",
				"Mutal Association (MUT-ASS)": "92",
				"Profession Libérale (Prof. libé)": "15",
				"S.A. à Directoire (SA DIR.)": "56",
				"S.A. Coopérative (S.A. COOP.)": "51",
				"S.A. Economie Mixte (SA Eco.Mix)": "56",
				"S.A.R.L.": "54",
				"SA Conseil Administration (SA CONSEIL)": "55",
				"SA Directoire & Conseil Surv. (SA Dir & C)": "56",
				"Société Anonyme (S.A.)": "55",
				"Société Civile (STE CIV)": "65",
				"Société de Droit Etranger (STE DR. ET)": "31",
				"Société en Participation (STE PART.)": "23",
				"Sté Coop Ouvrière Production (SCOP)": "51",
				"Sté en commandite par actions (SCA)": "53",
				"Sté en commandite simple (SCS)": "53",
				"Sté en nom collectif (SNC)": "52",
				"Sté Expl Libérale Resp Limitée (SELARL)": "15",
				"Sté par Action Simplifiée (S.A.S.)": "57",
				"Syndicat (SYND.)": "91",
				"Sté Intérêt Collectif Agrico (Sica)":"63",
				"Sté Coop Production Anonyme (SCPA)":"51"
			}
		};

		var is_Array = [
			"brand",
			"segmentation",
			"annualCA",
			"annualEBE"
		];

		var convertRow = function(row, index, cb) {
			var societe = {};

			for (var i = 0; i < row.length; i++) {
				if (conv[i] === false)
					continue;

				if (typeof conv_id[conv[i]] !== 'undefined') {
					if (conv_id[conv[i]][row[i]] === undefined) {
						console.log("error : unknown " + conv[i] + "->" + row[i] + " ligne " + index);
						return;
					}

					row[i] = conv_id[conv[i]][row[i]];
				}

				switch (conv[i]) {
					case "address1":
						if (row[i])
							societe.address += "\n" + row[i];
						break;
					case "BP":
						if (row[i]) {
							societe.address += "\n" + row[i].substr(0, row[i].indexOf(','));
						}
						break;
					case "brand" :
						if (row[i])
							societe[conv[i]] = row[i].split(',');
						break;
					case "segmentation" :
						if (row[i]) {
							var seg = row[i].split(',');
							societe[conv[i]] = [];
							for (var j = 0; j < seg.length; j++) {
								seg[j] = seg[j].replace(/\./g, "");
								seg[j] = seg[j].trim();

								societe[conv[i]].push({text: seg[j]});
							}
						}


						break;
					case "capital" :
						if (row[i])
							societe[conv[i]] = parseInt(row[i].substr(0, row[i].indexOf(' ')));
						break;
					case "yearCreated" :
						if (row[i])
							societe[conv[i]] = parseInt(row[i]) || null;
						break;
					case "phone":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "fax":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "idprof2":
						societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "typent_id":
						var juridic = conv_id[conv[33]][row[33]];
						if (row[33] && juridic == "41" || juridic == "73")
							//console.log('PUBLIC');
							societe.typent_id = "TE_PUBLIC";
						break;
					case "annualCA":
						societe[conv[i]] = [];
						if (row[i]) {
							var tmp = row[i].split(',');
							for (var j in tmp) {
								var data = tmp[j].split("=");
								var obj = {
									year: parseInt(data[0]),
									amount: parseInt(data[1])
								};
								societe[conv[i]].push(obj);
							}
						}
						break;
					case "annualEBE":
						societe[conv[i]] = [];
						if (row[i]) {
							var tmp = row[i].split(',');
							for (var j in tmp) {
								var data = tmp[j].split("=");
								var obj = {
									year: parseInt(data[0]),
									amount: parseInt(data[1])
								};
								societe[conv[i]].push(obj);
							}
						}
						break;
					default :
						if (row[i])
							societe[conv[i]] = row[i];
				}
			}

			cb(societe);
		};

		var is_imported = {};


		if (req.files) {
			var filename = req.files.filedata.path;
			if (fs.existsSync(filename)) {

				var tab = [];

				csv()
						.from.path(filename, {delimiter: ';', escape: '"'})
						.transform(function(row, index, callback) {
							if (index === 0) {
								tab = row; // Save header line

								//for (var i = 0; i < tab.length; i++)
								//if (conv[i] !== false)
								//	console.log(i + ". " + tab[i] + "->" + conv[i]);

								return callback();
							}

							var alreadyImport = false;
							if (is_imported[row[0]])
								alreadyImport = true;

							is_imported[row[0]] = true;

							//console.log(row);

							//console.log(row[0]);

							convertRow(row, index, function(data) {

								//callback();

								//return;

								SocieteModel.findOne({$or: [{kompass_id: data.kompass_id}, {idprof2: data.idprof2}]}, function(err, societe) {
									if (err) {
										console.log(err);
										return callback();
									}

									var isNew = false
									if (societe == null) {
										societe = new SocieteModel(data);
										societe.Status = "ST_NEVER";
										isNew = true;
									} else
										societe = _.extend(societe, data);

									//console.log(row[10]);
									//console.log(societe)
									//console.log(societe.datec);
									//callback();
									//return;

									if (!alreadyImport)
										societe.save(function(err, doc) {
											if (err)
												console.log(err);
											/*if (doc == null)
											 console.log("null");
											 else
											 console.log(doc);*/

											callback();
										});

									if (!isNew) {
										ContactModel.findOne({'societe.id': societe._id, firstname: data.firstname, lastname: data.lastname}, function(err, contact) {
											if (err) {
												console.log(err);
												return callback();
											}

											if (contact == null) {
												contact = new ContactModel(data);

												contact.societe.id = societe.id;
												contact.societe.name = societe.name;

											} else
												contact = _.extend(contact, data);

											//console.log(contact);

											contact.save(function(err, doc) {
												callback();
											});
										});
									} else
										callback();

								});

								//return row;
							});
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
	app.param('contactId', contact.contact);

	//other routes..
};

function Object() {
}

Object.prototype = {
	societe: function(req, res, next, id) {
		//TODO Check ACL here
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {code_client: id};

		//console.log(query);

		SocieteModel.findOne(query, function(err, doc) {
			if (err)
				return next(err);

			req.societe = doc;
			next();
		});
	},
	read: function(req, res) {
		var query = {
			$or: [{
					entity: "ALL"
				}, {
					entity: req.query.entity
				}]
		};

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

function Contact() {
}

Contact.prototype = {
	contact: function(req, res, next, id) {
		//TODO Check ACL here
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {code_client: id};

		//console.log(query);

		ContactModel.findOne(query, function(err, doc) {
			if (err)
				return next(err);

			req.contact = doc;
			next();
		});
	},
	read: function(req, res) {
		ContactModel.find(JSON.parse(req.query.find), req.query.fields, function(err, doc) {
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
	}
};
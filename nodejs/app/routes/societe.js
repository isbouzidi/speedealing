"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		async = require('async'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var UserModel = mongoose.model('user');

var Dict = require('../controllers/dict');
var DictModel = mongoose.model('dict'); // For update segmentation

module.exports = function (app, passport, auth) {

	var object = new Object();

	app.get('/api/societe', auth.requiresLogin, object.read);
	app.get('/api/societe/uniqId', auth.requiresLogin, object.uniqId);
	app.get('/api/societe/count', auth.requiresLogin, object.count);
	app.get('/api/societe/export', auth.requiresLogin, object.export);
	app.get('/api/societe/statistic', auth.requiresLogin, object.statistic);
	app.get('/api/societe/listCommercial', auth.requiresLogin, object.listCommercial);
	app.get('/api/societe/segmentation', auth.requiresLogin, object.segmentation);
	app.post('/api/societe/segmentation', auth.requiresLogin, object.segmentationRename);
	app.put('/api/societe/segmentation', auth.requiresLogin, object.segmentationUpdate);
	app.del('/api/societe/segmentation', auth.requiresLogin, object.segmentationDelete);
	app.get('/api/societe/:societeId', auth.requiresLogin, object.show);
	app.post('/api/societe', auth.requiresLogin, object.create);
	app.put('/api/societe/:societeId', auth.requiresLogin, object.update);
	app.del('/api/societe/:societeId', auth.requiresLogin, object.destroy);
	app.put('/api/societe/:societeId/:field', auth.requiresLogin, object.updateField);

	// list for autocomplete
	app.post('/api/societe/autocomplete', auth.requiresLogin, function (req, res) {
		//console.dir(req.body.filter);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {
			"$or": [
				{name: new RegExp("\\b" + req.body.filter.filters[0].value, "i")},
				{ref: new RegExp(req.body.filter.filters[0].value, "i")},
				{code_client: new RegExp(req.body.filter.filters[0].value, "i")}
			]
		};

		if (req.query.fournisseur || req.body.fournisseur) {
			if (req.query.fournisseur)
				query.fournisseur = req.query.fournisseur;
			else
				//console.log(req.body.fournisseur);
				query.fournisseur = {$in: req.body.fournisseur};
		} else // customer Only
			query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};

		//console.log(query);
		SocieteModel.find(query, {}, {limit: req.body.take}, function (err, docs) {
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
					result[i].commercial_id = docs[i].commercial_id;
				}

			return res.send(200, result);
		});
	});

	app.post('/api/societe/autocomplete/:field', auth.requiresLogin, function (req, res) {
		//console.dir(req.body);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {};

		query[req.params.field] = new RegExp(req.body.filter.filters[0].value, "i");

		if (typeof SocieteModel.schema.paths[req.params.field].options.type == "object")
			//console.log(query);
			SocieteModel.aggregate([
				{$project: {_id: 0, Tag: 1}},
				{$unwind: "$" + req.params.field},
				{$match: query},
				{$group: {_id: "$" + req.params.field}},
				{$limit: req.body.take}
			], function (err, docs) {
				if (err) {
					console.log("err : /api/societe/autocomplete/" + req.params.field);
					console.log(err);
					return;
				}
				//console.log(docs);
				var result = [];

				if (docs !== null)
					for (var i in docs) {
						//result.push({text: docs[i]._id});
						result.push(docs[i]._id);
					}

				return res.send(200, result);
			});
		else
			SocieteModel.distinct(req.params.field, query, function (err, docs) {
				if (err) {
					console.log("err : /api/societe/autocomplete/" + req.params.field);
					console.log(err);
					return;
				}
				return res.send(200, docs);
			});
	});

	app.post('/api/societe/segmentation/autocomplete', auth.requiresLogin, function (req, res) {
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
		], function (err, docs) {
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

	app.post('/api/societe/import/kompass', /*ensureAuthenticated,*/ function (req, res) {

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
				"": null,
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
				"": null,
				"59": null,
				"60": null,
				"62": null,
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
				"Sté Intérêt Collectif Agrico (Sica)": "63",
				"Sté Coop Production Anonyme (SCPA)": "51",
				"Sté nationalisée droit public (SNDP)": "41",
				"S.A.R.L. Coopérative (SARL COOP.)": "51",
				"Société de Fait (STE FAIT)": "22",
				"Sté nationalisée droit comm. (SNADC)": "41",
				"S.A. Conseil de Surveillance (SA C.SURV.)": "56"
			}
		};

		var is_Array = [
			"brand",
			"segmentation",
			"annualCA",
			"annualEBE"
		];

		var convertRow = function (row, index, cb) {
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
							societe[conv[i]] = parseInt(row[i].substr(0, row[i].indexOf(' ')), 10);
						break;
					case "yearCreated" :
						if (row[i])
							societe[conv[i]] = parseInt(row[i], 10) || null;
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
									year: parseInt(data[0], 10),
									amount: parseInt(data[1], 10)
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
									year: parseInt(data[0], 10),
									amount: parseInt(data[1], 10)
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
						.transform(function (row, index, callback) {
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

							convertRow(row, index, function (data) {

								//callback();

								//return;

								SocieteModel.findOne({$or: [{kompass_id: data.kompass_id}, {idprof2: data.idprof2}]}, function (err, societe) {
									if (err) {
										console.log(err);
										return callback();
									}

									var isNew = false;
									if (societe == null) {
										societe = new SocieteModel(data);
										societe.Status = "ST_NEVER";
										isNew = true;
									}

									societe = _.extend(societe, data);

									//console.log(row[10]);
									//console.log(societe)
									//console.log(societe.datec);
									//callback();
									//return;

									if (!alreadyImport)
										societe.save(function (err, doc) {
											if (err)
												console.log(err);
											/*if (doc == null)
											 console.log("null");
											 else
											 console.log(doc);*/

											callback();
										});

									if (!isNew) {
										ContactModel.findOne({'societe.id': societe._id, firstname: data.firstname, lastname: data.lastname}, function (err, contact) {
											if (err) {
												console.log(err);
												return callback();
											}

											if (contact == null) {
												contact = new ContactModel(data);

												contact.societe.id = societe.id;
												contact.societe.name = societe.name;

											}

											contact = _.extend(contact, data);

											//console.log(contact);

											if (!contact.firstname && !contact.lastname)
												return callback();

											contact.save(function (err, doc) {
												callback();
											});
										});
									} else
										callback();

								});

								//return row;
							});
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

	app.post('/api/societe/import/horsAntenne', /*ensureAuthenticated,*/ function (req, res) {
		req.connection.setTimeout(300000);

		var conv = [
			false,
			false,
			"ha_id",
			"civilite",
			"firstname",
			"lastname",
			'poste',
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			"contact_phone",
			"phone",
			"contact_fax",
			"fax",
			"contact_email",
			"email",
			"name",
			false,
			false,
			false,
			false,
			"address",
			"address1",
			'zip',
			"town",
			false,
			"url",
			"Tag",
			"Tag",
			"Tag",
			"effectif_id", // Nombre d'habitants
			false,
			false,
			"idprof1",
			"entity"
		];

		var conv_id = {
			civilite: {
				"": "NO",
				"MME": "MME",
				"MLLE": "MLE",
				"M.": "MR",
				"COLONEL": "COLONEL",
				"DOCTEUR": "DR",
				"GENERAL": "GENERAL",
				"PROFESSEUR": "PROF"
			},
			effectif_id: {
				"0": "EF0",
				"1": "EF1-5",
				"6": "EF6-10",
				"11": "EF11-50",
				"51": "EF51-100",
				"101": "EF101-250",
				"251": "EF251-500",
				"501": "EF501-1000",
				"1001": "EF1001-5000",
				"5001": "EF5000+"
			},
			typent_id: {
				"Siège": "TE_SIEGE",
				"Etablissement": "TE_ETABL",
				"Publique / Administration": "TE_PUBLIC"
			}
		};

		var is_Array = [
			"Tag"
		];

		var convertRow = function (row, index, cb) {
			var societe = {};
			societe.typent_id = "TE_PUBLIC";
			societe.country_id = "FR";
			societe.Tag = [];
			societe.remise_client = 0;

			for (var i = 0; i < row.length; i++) {
				if (conv[i] === false)
					continue;

				if (conv[i] != "effectif_id" && typeof conv_id[conv[i]] !== 'undefined') {

					if (conv[i] == "civilite" && conv_id[conv[i]][row[i]] === undefined)
						row[i] = "";

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
					case "Tag" :
						if (row[i]) {
							var seg = row[i].split(',');
							for (var j = 0; j < seg.length; j++) {
								seg[j] = seg[j].replace(/\./g, "");
								seg[j] = seg[j].trim();

								societe[conv[i]].push({text: seg[j]});
							}
						}
						break;
					case "capital" :
						if (row[i])
							societe[conv[i]] = parseInt(row[i].substr(0, row[i].indexOf(' ')), 10);
						break;
					case "yearCreated" :
						if (row[i])
							societe[conv[i]] = parseInt(row[i], 10) || null;
						break;
					case "phone":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "fax":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "contact_phone":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "contact_fax":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "idprof2":
						societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "idprof1":
						societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "idprof3":
						societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "effectif_id":
						societe[conv[i]] = "EF0";

						for (var idx in conv_id[conv[i]]) {
							if (parseInt(idx, 10) <= parseInt(row[i], 10))
								societe[conv[i]] = conv_id[conv[i]][idx];
						}
						break;
					default :
						if (row[i])
							societe[conv[i]] = row[i];
				}
			}
			//console.log(societe);
			cb(societe);
		};

		var is_imported = {};


		if (req.files) {
			var filename = req.files.filedata.path;
			if (fs.existsSync(filename)) {

				var tab = [];

				csv()
						.from.path(filename, {delimiter: ';', escape: '"'})
						.transform(function (row, index, callback) {
							if (index === 0) {
								tab = row; // Save header line

								//for (var i = 0; i < tab.length; i++)
								//	if (conv[i] !== false)
								//		console.log(i + ". " + tab[i] + "->" + conv[i]);

								return callback();
							}
							//if (index == 1)
							//	console.log(row);

							var alreadyImport = false;
							if (is_imported[row[2]])
								alreadyImport = true;

							is_imported[row[2]] = true;

							//console.log(row);

							//console.log(row[0]);

							convertRow(row, index, function (data) {

								//callback();

								//return;

								//if (!data.idprof2) // Pas de SIRET
								//	return callback();

								var query;
								//console.log(data.idprof2);
								//if (data.idprof2)
								//	query = {$or: [{ha_id: data.ha_id}, {idprof2: data.idprof2}]};
								//else
								query = {ha_id: data.ha_id};

								SocieteModel.findOne(query, function (err, societe) {
									if (err) {
										console.log(err);
										return callback();
									}
									//if (index == 1)
									//	console.log(societe);

									var isNew = false;
									if (societe == null) {
										societe = new SocieteModel(data);
										societe.Status = "ST_NEVER";
										isNew = true;
										//console.log("new societe");
									} else {
										//console.log("update societe");
									}
									//console.log(data);
									societe = _.extend(societe, data);

									//console.log(row[10]);
									//console.log(societe);
									//console.log(societe.datec);
									//callback();
									//return;

									if (!alreadyImport)
										societe.save(function (err, doc) {
											if (err)
												console.log("societe : " + JSON.stringify(err));

											//console.log("save");
											/*if (doc == null)
											 console.log("null");
											 else
											 console.log(doc);*/

											callback();
										});

									if (!isNew) {
										ContactModel.findOne({'societe.id': societe._id, firstname: data.firstname, lastname: data.lastname}, function (err, contact) {
											if (err) {
												console.log(err);
												return callback();
											}

											if (contact == null) {
												contact = new ContactModel(data);

												contact.societe.id = societe.id;
												contact.societe.name = societe.name;

											}

											contact = _.extend(contact, data);

											//console.log(data);
											if (data.contact_phone)
												contact.phone = data.contact_phone;
											if (data.contact_fax)
												contact.fax = data.contact_fax;
											if (data.contact_email)
												contact.email = data.contact_email;

											//console.log(contact);

											if (!contact.firstname || !contact.lastname)
												return callback();

											contact.save(function (err, doc) {
												if (err)
													console.log("contact : " + err);

												callback();
											});
										});
									} else
										callback();

								});

								//return row;
							});
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

	app.post('/api/societe/import', /*ensureAuthenticated,*/ function (req, res) {
		req.connection.setTimeout(300000);
		var commercial_list = {};

		UserModel.find({Status: "ENABLE"}, function (err, users) {
			//console.log(users);

			for (var i = 0; i < users.length; i++) {
				commercial_list[users[i]._id] = users[i];
			}

			var conv_id = {
				effectif_id: {
					"0": "EF0",
					"1": "EF1-5",
					"6": "EF6-10",
					"11": "EF11-50",
					"51": "EF51-100",
					"101": "EF101-250",
					"251": "EF251-500",
					"501": "EF501-1000",
					"1001": "EF1001-5000",
					"5001": "EF5000+"
				},
				typent_id: {
					"Siège": "TE_SIEGE",
					"Etablissement": "TE_ETABL",
					"Publique / Administration": "TE_PUBLIC"
				},
				Status: {
					"": "ST_CFID",
					"Moins de 3 mois": "ST_CINF3",
					"OK Sensibilisation": "ST_NEW",
					"Bonne relation": "ST_NEW",
					"Peu visité": "ST_NEW",
					"Recontacter dans 2 mois": "ST_NEW",
					"Ne pas recontacter": "ST_NO",
					"Chaud": "ST_PCHAU",
					"Tiède": "ST_PTIED",
					"Froid": "ST_PFROI",
					"Non Déterminé": "ST_NEVER"
				},
				prospectlevel: {
					"": "PL_NONE",
					"Niveau 3": "PL_HIGH",
					"Niveau 2": "PL_MEDIUM",
					"Niveau 1": "PL_LOW",
					"Niveau 0": "PL_NONE"
				}
			};

			var is_Array = [
				"Tag"
			];

			var convertRow = function (tab, row, index, cb) {
				var societe = {};
				societe.country_id = "FR";
				societe.Tag = [];
				societe.remise_client = 0;

				for (var i = 0; i < row.length; i++) {
					if (tab[i] === "false")
						continue;

					/* optional */
					if (tab[i].indexOf(".") >= 0) {
						var split = tab[i].split(".");

						if (row[i]) {
							if (typeof societe[split[0]] === "undefined")
								societe[split[0]] = {};

							societe[split[0]][split[1]] = row[i];
						}
						continue;
					}

					if (tab[i] != "effectif_id" && typeof conv_id[tab[i]] !== 'undefined') {

						if (tab[i] == "civilite" && conv_id[tab[i]][row[i]] === undefined)
							row[i] = "";

						if (conv_id[tab[i]][row[i]] === undefined) {
							console.log("error : unknown " + tab[i] + "->" + row[i] + " ligne " + index);
							return;
						}

						row[i] = conv_id[tab[i]][row[i]];
					}

					switch (tab[i]) {
						case "address":
							if (row[i]) {
								if (societe.address)
									societe.address += "\n" + row[i];
								else
									societe.address = row[i];
							}
							break;
						case "BP":
							if (row[i]) {
								societe.address += "\n" + row[i].substr(0, row[i].indexOf(','));
							}
							break;
						case "brand" :
							if (row[i])
								societe[tab[i]] = row[i].split(',');
							break;
						case "Tag" :
							if (row[i]) {
								var seg = row[i].split(',');
								for (var j = 0; j < seg.length; j++) {
									seg[j] = seg[j].replace(/\./g, "");
									seg[j] = seg[j].trim();

									societe[tab[i]].push({text: seg[j]});
								}
							}
							break;
						case "capital" :
							if (row[i])
								societe[tab[i]] = parseInt(row[i].substr(0, row[i].indexOf(' ')), 10);
							break;
						case "yearCreated" :
							if (row[i])
								societe[tab[i]] = parseInt(row[i], 10) || null;
							break;
						case "phone":
							if (row[i])
								societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "phone_mobile":
							if (row[i])
								societe["phone"] += "/" + row[i].replace(/ /g, "");
							break;
						case "fax":
							if (row[i])
								societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "contact_phone":
							if (row[i])
								societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "contact_fax":
							if (row[i])
								societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "idprof2":
							societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "idprof1":
							societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "idprof3":
							societe[tab[i]] = row[i].replace(/ /g, "");
							break;
						case "effectif_id":
							societe[tab[i]] = "EF0";

							for (var idx in conv_id[tab[i]]) {
								if (parseInt(idx, 10) <= parseInt(row[i], 10))
									societe[tab[i]] = conv_id[tab[i]][idx];
							}
							break;
						case "notes":
							if (row[i]) {
								if (!_.isArray(societe.notes))
									societe.notes = [];

								societe[tab[i]].push({
									author: {
										name: "Inconnu"
									},
									datec: new Date(0),
									note: row[i]
								});
							}

							break;
						case "commercial_id":
							if (row[i]) {
								societe.commercial_id = {
									id: row[i],
									name: (commercial_list[row[i]] ? commercial_list[row[i]].firstname + " " + commercial_list[row[i]].lastname : row[i])
								};
							}
							break;
						case "datec":
							if (row[i])
								societe[tab[i]] = new Date(row[i]);
							break;
						default :
							if (row[i])
								societe[tab[i]] = row[i];
					}
				}
				//console.log(societe);
				cb(societe);
			};

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

								convertRow(tab, row, index, function (data) {

									if (data.code_client)
										SocieteModel.findOne({code_client: data.code_client}, function (err, societe) {
											if (err) {
												console.log(err);
												return callback();
											}

											if (societe == null)
												societe = new SocieteModel(data);
											else
												societe = _.extend(societe, data);

											//console.log(row[10]);
											//console.log(societe)
											//console.log(societe.datec);

											societe.save(function (err, doc) {
												if (err)
													console.log(err);

												callback();
											});

										});
									else if (data.oldId)
										SocieteModel.findOne({$or: [{oldId: data.oldId}, {name: data.name}]}, function (err, societe) {
											if (err) {
												console.log(err);
												return callback();
											}

											if (societe == null || societe.zip != data.zip)
												societe = new SocieteModel(data);
											else {
												console.log("Found : update");
												societe = _.extend(societe, data);
											}

											//console.log(row[10]);
											//console.log(societe)
											//console.log(societe.datec);

											societe.save(function (err, doc) {
												if (err)
													console.log(err);

												callback();
											});

										});
									else
										SocieteModel.findOne({name: data.name}, function (err, societe) {
											if (err) {
												console.log(err);
												return callback();
											}

											if (societe == null || societe.zip != data.zip)
												societe = new SocieteModel(data);
											else {
												console.log("Found : update");
												societe = _.defaults(societe, data);
											}

											//console.log(row[10]);
											//console.log(societe)
											//console.log(societe.datec);

											societe.save(function (err, doc) {
												if (err)
													console.log(err);

												callback();
											});

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
	});

	app.post('/api/societe/notes/import', /*ensureAuthenticated,*/ function (req, res) {

		var convertRow = function (tab, row, index, cb) {
			var societe = {};

			for (var i = 0; i < row.length; i++) {
				if (tab[i] === "false")
					continue;

				switch (tab[i]) {
					case "notes":
						if (row[i]) {

							societe[tab[i]] = {
								author: {
									name: "Inconnu"
								},
								datec: new Date(),
								note: row[i]
							};
						}
						break;
					default :
						if (row[i])
							societe[tab[i]] = row[i];
				}
			}
			//console.log(societe);
			cb(societe);
		};

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

							convertRow(tab, row, index, function (data) {

								if (!data.notes.note) {
									return callback();
								}

								SocieteModel.findOne({oldId: data.oldId}, function (err, societe) {
									if (err) {
										console.log(err);
										return callback();
									}

									if (societe == null) {
										console.log("Societe not found : " + data.oldId);
										return callback();
									}

									societe.notes.push(data.notes);
									//console.log(data.notes);

									//console.log(societe);

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

	app.post('/api/societe/file/:Id', auth.requiresLogin, function (req, res) {
		var id = req.params.Id;
		//console.log(id);

		if (req.files && id) {
			//console.log(req.files);

			gridfs.addFile(SocieteModel, id, req.files.file, function (err, result) {
				if (err)
					return res.send(500, err);

				return res.send(200, result);
			});
		} else
			res.send(500, "Error in request file");
	});

	app.get('/api/societe/file/:Id/:fileName', auth.requiresLogin, function (req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {

			gridfs.getFile(SocieteModel, id, req.params.fileName, function (err, store) {
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

	app.del('/api/societe/file/:Id/:fileNames', auth.requiresLogin, function (req, res) {
		console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.params.fileNames && id) {
			gridfs.delFile(SocieteModel, id, req.params.fileNames, function (err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "File not found");
	});

	app.get('/api/societe/contact/select', auth.requiresLogin, function (req, res) {
		//console.log(req.query);
		var result = [];

		if (req.query.societe)
			ContactModel.find({"societe.id": req.query.societe}, "_id name", function (err, docs) {
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
			ContactModel.find({}, "_id name", function (err, docs) {
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
	societe: function (req, res, next, id) {
		//TODO Check ACL here
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {code_client: id};

		//console.log(query);

		SocieteModel.findOne(query, function (err, doc) {
			if (err)
				return next(err);

			req.societe = doc;
			//console.log(doc);
			next();
		});
	},
	read: function (req, res) {
		var query = {
			entity: {$in: ["ALL", req.query.entity]}
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
				default : //ALL
					break;
			}
		}

		if (req.query.Status)
			query.Status = req.query.Status;

		if (req.query.commercial_id)
			query["commercial_id.id"] = req.query.commercial_id;

		var fields = "-history -files";

		if (req.query.fields)
			fields = req.query.fields;

		if (req.query.filter) {
			query.$or = [
				{name: new RegExp(req.query.filter, "gi")},
				{code_client: new RegExp(req.query.filter, "gi")},
				{Tag: new RegExp(req.query.filter, "gi")},
				{"segmentation.label": new RegExp(req.query.filter, "g")}
			];
			//query.$text = {$search: req.query.filter, $language: "fr"};
		}

		if (!req.user.rights.societe.seeAll && !req.user.admin)
			query["commercial_id.id"] = req.user._id;

		/*console.log(query);
		 
		 if (req.query.filter)
		 SocieteModel.search({query: req.query.filter}, function (err, result) {
		 console.log(err);
		 });*/

		SocieteModel.find(query, fields, {skip: parseInt(req.query.skip, 10) * parseInt(req.query.limit, 10) || 0, limit: req.query.limit || 100, sort: JSON.parse(req.query.sort)}, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);

			res.json(200, doc);
		});
	},
	show: function (req, res) {
		res.json(req.societe);
	},
	count: function (req, res) {
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
				default : // ALL
					break;
			}
		}

		if (req.query.Status)
			query.Status = req.query.Status;

		if (req.query.commercial_id)
			query["commercial_id.id"] = req.query.commercial_id;

		if (!req.user.rights.societe.seeAll && !req.user.admin)
			query["commercial_id.id"] = req.user._id;

		SocieteModel.count(query, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(200, {count: doc});
		});
	},
	create: function (req, res) {
		var societe = new SocieteModel(req.body);
		societe.author = {};
		societe.author.id = req.user._id;
		societe.author.name = req.user.name;

		if (societe.entity == null)
			societe.entity = req.user.entity;

		console.log(societe);
		societe.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(societe);
		});
	},
	uniqId: function (req, res) {
		if (!req.query.idprof2)
			return res.send(404);

		SocieteModel.findOne({idprof2: req.query.idprof2}, "name entity", function (err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return res.json({});

			res.json(doc);
		});

	},
	update: function (req, res) {
		var societe = req.societe;
		societe = _.extend(societe, req.body);
		//console.log(req.body);

		societe.save(function (err, doc) {
			res.json(doc);
		});
	},
	updateField: function (req, res) {
		if (req.body.value) {
			var societe = req.societe;

			societe[req.params.field] = req.body.value;

			societe.save(function (err, doc) {
				res.json(doc);
			});
		} else
			res.send(500);
	},
	destroy: function (req, res) {
		var societe = req.societe;
		societe.remove(function (err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(societe);
			}
		});
	},
	segmentation: function (req, res) {
		var segmentationList = {};
		DictModel.findOne({_id: "fk_segmentation"}, function (err, docs) {
			if (docs) {
				segmentationList = docs.values;
			}

			SocieteModel.aggregate([
				{$project: {_id: 0, segmentation: 1}},
				{$unwind: "$segmentation"},
				{$group: {_id: "$segmentation.text", count: {$sum: 1}}}
			], function (err, docs) {
				if (err) {
					console.log("err : /api/societe/segmentation/autocomplete");
					console.log(err);
					return;
				}

				var result = [];
				if (docs == null)
					docs = [];

				for (var i = 0; i < docs.length; i++) {

					result[i] = docs[i];
					if (segmentationList[docs[i]._id])
						result[i].attractivity = segmentationList[docs[i]._id].attractivity;
				}

				//console.log(result);

				return res.send(200, result);
			});
		});
	},
	segmentationUpdate: function (req, res) {
		DictModel.findOne({_id: "fk_segmentation"}, function (err, doc) {
			if (doc == null)
				return console.log("fk_segmentation doesn't exist !");

			if (req.body.attractivity)
				doc.values[req.body._id] = {
					label: req.body._id,
					attractivity: req.body.attractivity
				};
			else if (doc.values[req.body._id])
				delete doc.values[req.body._id];

			doc.markModified('values');

			doc.save(function (err, doc) {
				if (err)
					console.log(err);
			});

			res.send(200);

		});
	},
	segmentationDelete: function (req, res) {
		//console.log(req.body);
		SocieteModel.update({'segmentation.text': req.body._id},
		{$pull: {segmentation: {text: req.body._id}}},
		{multi: true},
		function (err) {
			res.send(200);
		});
	},
	segmentationRename: function (req, res) {
		console.log(req.body);
		SocieteModel.update({'segmentation.text': req.body.old},
		{$push: {segmentation: {text: req.body.new}}},
		{multi: true},
		function (err) {
			if (err)
				return console.log(err);

			SocieteModel.update({'segmentation.text': req.body.old},
			{$pull: {segmentation: {text: req.body.old}}},
			{multi: true},
			function (err) {
				if (err)
					console.log(err);
				res.send(200);
			});
		});
	},
	statistic: function (req, res) {
		//console.log(req.query);

		async.parallel({
			own: function (cb) {
				Dict.dict({dictName: "fk_stcomm", object: true}, function (err, dict) {
					SocieteModel.aggregate([
						{$match: {entity: {$in: ["ALL", req.query.entity]}, Status: {$nin: ["ST_NO"]}, "commercial_id.id": "user:" + req.query.name}},
						{$project: {_id: 0, "Status": 1}},
						{$group: {_id: "$Status", count: {$sum: 1}}}
					], function (err, docs) {

						for (var i = 0; i < docs.length; i++) {
							docs[i]._id = dict.values[docs[i]._id];
						}

						cb(err, docs || []);
					});
				});
			},
			commercial: function (cb) {
				var query = {};

				if (req.user.rights.societe.seeAll || req.user.admin) {
					query = {entity: {$in: ["ALL", req.query.entity]}, "commercial_id.name": {$ne: null}};
					if (req.query.commercial_id)
						query["commercial_id.id"] = req.query.commercial_id;
				} else
					query = {entity: {$in: ["ALL", req.query.entity]}, "commercial_id.id": req.user._id};

				SocieteModel.aggregate([
					{$match: query},
					{$project: {_id: 0, "commercial_id.id": 1, "commercial_id.name": 1}},
					{$group: {_id: {id: "$commercial_id.id", name: "$commercial_id.name"}, count: {$sum: 1}}},
					{$sort: {"_id.name": 1}}
				], function (err, docs) {
					cb(err, docs || []);
				});
			},
			status: function (cb) {
				SocieteModel.aggregate([
					{$match: {entity: {$in: ["ALL", req.query.entity]}, "commercial_id.name": {$ne: null}}},
					{$project: {_id: 0, "commercial_id.id": 1, "Status": 1}},
					{$group: {_id: {commercial: "$commercial_id.id", Status: "$Status"}, count: {$sum: 1}}}
				], function (err, docs) {
					cb(err, docs || []);
				});
			},
			fk_status: function (cb) {
				Dict.dict({dictName: "fk_stcomm", object: true}, function (err, doc) {
					var result = [];

					for (var i in doc.values) {

						if (doc.values[i].enable && doc.values[i].order) {
							doc.values[i].id = i;
							result.push(doc.values[i]);
						}
					}

					result.sort(function (a, b) {
						return a.order > b.order;
					});

					cb(err, result);
				});
			}
		},
		function (err, results) {
			if (err)
				return console.log(err);

			var output = {
				data: [],
				commercial: results.commercial,
				status: results.fk_status,
				own: results.own
			};

			for (var i = 0; i < results.commercial.length; i++) {
				for (var j = 0; j < results.fk_status.length; j++) {

					if (j === 0)
						output.data[i] = [];

					output.data[i][j] = 0;

					for (var k = 0; k < results.status.length; k++) {
						//console.log(results.commercial[i]);
						//console.log(results.fk_status[j]);
						//console.log(results.status[k]);
						//console.log("----------------------------");

						if (results.commercial[i]._id.id === results.status[k]._id.commercial &&
								results.fk_status[j].id === results.status[k]._id.Status) {
							output.data[i][j] = results.status[k].count;
							break;
						}

					}
				}
			}

			//console.log(output);
			res.json(output);
		});
	},
	export: function (req, res) {
		if (!req.user.admin)
			return console.log("export non autorised");

		var json2csv = require('json2csv');

		SocieteModel.find({}, function (err, societe) {
			//console.log(societe);
			json2csv({data: societe, fields: ['_id', 'name', 'address', 'Tag', 'zip'], del: ";"}, function (err, csv) {
				if (err)
					console.log(err);

				res.type('application/text');
				res.attachment('societe_' + dateFormat(new Date(), "ddmmyyyy_HH:MM") + '.csv');
				res.send(csv);

				//console.log(csv);
			});
		});
	},
	listCommercial: function (req, res) {

		var query = {};

		query = {entity: {$in: ["ALL", req.query.entity]}, "commercial_id.name": {$ne: null}};

		SocieteModel.aggregate([
			{$match: query},
			{$project: {_id: 0, "commercial_id.id": 1, "commercial_id.name": 1}},
			{$group: {_id: {id: "$commercial_id.id", name: "$commercial_id.name"}}}
		], function (err, doc) {

			if (err)
				return console.log(err);

			res.json(doc);
		});
	}
};

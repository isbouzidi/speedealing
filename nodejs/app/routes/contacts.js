"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');

module.exports = function (app, passport, auth) {

	var contact = new Contact();

	//create a new contact
	app.post('/api/contact', auth.requiresLogin, contact.create);

	//get all contacts of a given company
	app.get('/api/contact', auth.requiresLogin, contact.showAll);

	//get all contacts for search engine
	app.get('/api/contact/searchEngine', auth.requiresLogin, contact.showList);

	// list all contact for a societe
	app.get('/api/contact/societe', auth.requiresLogin, contact.societe);

	//get a contact
	app.get('/api/contact/:contactId', auth.requiresLogin, contact.findOne);

	//update a contact
	app.put('/api/contact/:contactId', auth.requiresLogin, contact.update);

	//delete a contact
	app.del('/api/contact/:contactId', auth.requiresLogin, contact.delete);

	//get all contacts
	app.get('/api/contacts', auth.requiresLogin, contact.read);

	app.post('/api/contact/autocomplete', auth.requiresLogin, function (req, res) {
		console.dir(req.body.filter);

		if (req.body.filter === null)
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
				}

			return res.send(200, result);
		});
	});

	app.post('/api/contact/autocomplete/:field', auth.requiresLogin, function (req, res) {
		//console.dir(req.body);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {};

		query[req.params.field] = new RegExp(req.body.filter.filters[0].value, "i");

		if (typeof ContactModel.schema.paths[req.params.field].options.type == "object")
			//console.log(query);
			ContactModel.aggregate([
				{$project: {_id: 0, Tag: 1}},
				{$unwind: "$" + req.params.field},
				{$match: query},
				{$group: {_id: "$" + req.params.field}},
				{$limit: req.body.take}
			], function (err, docs) {
				if (err) {
					console.log("err : /api/contact/autocomplete/" + req.params.field);
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

		//TODO write code for distinct attribute
	});

	app.post('/api/contact/import', /*ensureAuthenticated,*/ function (req, res) {
		req.connection.setTimeout(300000);

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
			},
			Status: {
				"": "ST_NEVER",
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
			var contact = {
				Status: "ST_ENABLE",
				tag: []
			};
			contact.country_id = "FR";

			for (var i = 0; i < row.length; i++) {
				if (tab[i] === "false")
					continue;

				/* optional */
				if (tab[i] && tab[i].indexOf(".") >= 0) {
					var split = tab[i].split(".");

					if (row[i]) {
						if (typeof contact[split[0]] === "undefined")
							contact[split[0]] = {};

						contact[split[0]][split[1]] = row[i];
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
					case "name" :
						var name = row[i].split(" ");
						contact.firstname = name[0];

						if (name[1]) {
							contact.lastname = name[1];
							for (var j = 2; j < name.length; j++)
								contact.lastname += " " + name[j];
						}

						break;
					case "address1":
						if (row[i])
							contact.address += "\n" + row[i];
						break;
					case "address2":
						if (row[i])
							contact.address += "\n" + row[i];
						break;
					case "address3":
						if (row[i])
							contact.address += "\n" + row[i];
						break;
					case "address4":
						if (row[i])
							contact.address += "\n" + row[i];
						break;
					case "BP":
						if (row[i]) {
							contact.address += "\n" + row[i].substr(0, row[i].indexOf(','));
						}
						break;
					case "Tag" :
						if (row[i]) {
							var seg = row[i].split(',');
							if (typeof contact[tab[i]] != "object")
								contact[tab[i]] = [];

							for (var j = 0; j < seg.length; j++) {
								seg[j] = seg[j].replace(/\./g, "");
								seg[j] = seg[j].trim();

								contact[tab[i]].push({text: seg[j]});
							}
							//console.log(typeof contact[tab[i]]);
						}
						break;
					case "phone_mobile":
						if (row[i])
							contact[tab[i]] = row[i].replace(/ /g, "");
						break;
					case "phone":
						if (row[i])
							contact[tab[i]] = row[i].replace(/ /g, "");
						break;
					case "phone1":
						if (row[i])
							contact["phone"] = row[i].replace(/ /g, "");
						break;
					case "fax":
						if (row[i])
							contact[tab[i]] = row[i].replace(/ /g, "");
						break;
					case "entity":
						if (row[i])
							contact[tab[i]] = row[i].toLowerCase();
						break;
					case "notes":
						if (row[i]) {
							if (typeof contact.notes != "array")
								contact.notes = [];

							contact[tab[i]].push({
								author: {
									name: "Inconnu"
								},
								datec: new Date(0),
								note: row[i]
							});
						}

						break;
					default :
						if (row[i])
							contact[tab[i]] = row[i];
				}
			}
			//console.log(contact);
			cb(contact);
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

								if (data.code_client) {
									SocieteModel.findOne({code_client: data.code_client}, function (err, societe) {
										if (err) {
											console.log(err);
											return callback();
										}

										if (societe == null) {
											console.log("Societe not found : " + data.code_client);
											return callback();
										}

										data.societe = {
											id: societe._id,
											name: societe.name
										};

										ContactModel.findOne({"societe.id": data.societe.id, lastname: data.lastname}, function (err, contact) {

											if (err) {
												console.log(err);
												return callback();
											}

											if (contact == null) {
												contact = new ContactModel(data);
											} else {
												if (data.Tag)
													data.Tag = _.union(contact.Tag, data.Tag); // Fusion Tag

												contact = _.extend(contact, data);
											}

											//console.log(data);

											//console.log(row[10]);
											//console.log(contact);
											//console.log(societe.datec);

											contact.save(function (err, doc) {
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
								} else {

									var query = {
										$or: []
									};

									if (data.email != null)
										query.$or.push({email: data.email});
									//if (data.phone != null)
									//	query.$or.push({phone: data.phone});
									if (data.phone_mobile != null)
										query.$or.push({phone_mobile: data.phone_mobile});

									if (query.$or.length) {
										ContactModel.findOne(query, function (err, contact) {

											if (err) {
												console.log(err);
												return callback();
											}

											if (contact == null) {
												contact = new ContactModel(data);
											} else {
												console.log("Found / update");
												//console.log("old : " + contact);
												if (contact.zip)
													delete data.zip;
												if (contact.town)
													delete data.town;
												if (contact.societe && (contact.societe.name || contact.societe.id))
													delete data.societe;

												if (data.Tag)
													data.Tag = _.union(contact.Tag, data.Tag); // Fusion Tag

												contact = _.extend(contact, data);
											}

											//console.log(data);

											//console.log(row[10]);
											//console.log(contact.Tag);
											//console.log(societe.datec);

											contact.save(function (err, doc) {
												if (err)
													console.log(err);
												/*if (doc == null)
												 console.log("null");
												 else
												 console.log(doc);*/

												callback();
											});
										});
									} else {
										contact = new ContactModel(data);
										//console.log(contact.Tag);
										contact.save(function (err, doc) {
											if (err)
												console.log(err);
											/*if (doc == null)
											 console.log("null");
											 else
											 console.log(doc);*/

											callback();
										});
									}
								}
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

	app.param('contactId', contact.contact);
};


function Contact() {
}

Contact.prototype = {
	contact: function (req, res, next, id) {
		//TODO Check ACL here
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {code_client: id};

		//console.log(query);

		ContactModel.findOne(query, function (err, doc) {
			if (err) {
				console.log(err);
				return next(err);
			}

			req.contact = doc;
			next();
		});
	},
	create: function (req, res) {

		var contact = new ContactModel(req.body);
		contact.user_creat = req.user._id;

		contact.save(function (err, doc) {
			if (err) {
				console.log(err);
				return res.json(500, err);

			}

			res.json(200, contact);
		});
	},
	read: function (req, res) {
		//console.log(req.query.find);
		ContactModel.find(JSON.parse(req.query.find), req.query.field || "", function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);

			res.json(200, doc);
		});
	},
	showAll: function (req, res) {

		var query = {};

		if (req.query.Status !== "ALL")
			query = {"Status": req.query.Status};

		ContactModel.find(query, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(200, doc);
		});
	},
	showList: function (req, res) {

		//var query = {name: new RegExp(req.query.item, "i")};
		var sort = {};

		var query = {
			"$or": [
				{"lastname": new RegExp(req.query.item, "gi")},
				{"firstname": new RegExp(req.query.item, "gi")},
				{"societe.name": new RegExp(req.query.item, "gi")},
				{"Tag": new RegExp(req.query.item, "gi")},
				{"email": new RegExp(req.query.item, "gi")}
			]
		};

		if (req.query.limit)
			sort.limit = parseInt(req.query.limit);

		ContactModel.find(query, "firstname lastname societe.name Tag phone Status email phone_mobile newsletter sendEmailing sendSMS", sort, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(200, doc);
		});
	},
	findOne: function (req, res) {
		//console.log(req.contact);
		res.json(req.contact);
	},
	societe: function (req, res) {
		ContactModel.find({"societe.id": req.query.societe}, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(doc);
		});
	},
	update: function (req, res) {

		var contact = req.contact;
		contact = _.extend(contact, req.body);

		contact.save(function (err, doc) {

			if (err) {
				return console.log(err);
			}

			res.json(200, doc);
		});
	},
	delete: function (req, res) {

		var contact = req.contact;
		contact.remove(function (err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(contact);
			}
		});
	}
};
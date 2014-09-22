"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		async = require('async'),
		latex = require('../models/latex');

var DeliveryModel = mongoose.model('delivery');
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var ProductModel = mongoose.model('product');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

module.exports = function (app, passport, auth) {

	var object = new Object();
	var billing = new Billing();

	app.get('/api/delivery', auth.requiresLogin, object.read);
	app.get('/api/delivery/caFamily', auth.requiresLogin, object.caFamily);
	app.get('/api/delivery/pdf/:deliveryId', auth.requiresLogin, object.pdf);
	app.get('/api/delivery/fk_extrafields/select', auth.requiresLogin, object.select);

	// list for autocomplete
	app.post('/api/delivery/autocomplete', auth.requiresLogin, function (req, res) {
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
		DeliveryModel.find(query, {}, {limit: req.body.take}, function (err, docs) {
			if (err) {
				console.log("err : /api/delivery/autocomplete");
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

	// recupere la liste des courses pour verification
	app.get('/api/delivery/billing', auth.requiresLogin, billing.read/*, function (req, res) {
		async.parallel({
			course: function (cb) {
				billing.courses(req, "COURSE", cb);
			},
			messagerie: function (cb) {
				billing.courses(req, "MESSAGERIE", cb);
			},
			affretement: function (cb) {
				billing.courses(req, "AFFRETEMENT", cb);
			},
			allST: function (cb) {
				billing.allST(req, cb);
			}
		},
		function (err, results) {
			if (err)
				return console.log(err);

			res.json(200, results);
		});

	}*/);

	// Genere la facturation
	app.post('/api/delivery/billing', auth.requiresLogin, billing.create);

	app.get('/api/delivery/billing/ca', auth.requiresLogin, billing.familyCA);

	app.post('/api/delivery', auth.requiresLogin, object.create);
	app.get('/api/delivery/:deliveryId', auth.requiresLogin, object.show);
	app.post('/api/delivery/:deliveryId', auth.requiresLogin, object.create);
	app.put('/api/delivery/:deliveryId', auth.requiresLogin, object.update);
	app.del('/api/delivery/:deliveryId', auth.requiresLogin, object.destroy);
	app.param('deliveryId', object.delivery);

	//other routes..
};

function Object() {
}

Object.prototype = {
	delivery: function (req, res, next, id) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {ref: id};

		//console.log(query);

		DeliveryModel.findOne(query, "-latex")
				.populate("orders", "ref ref_client total_ht")
				.exec(function (err, doc) {
					if (err)
						return next(err);

					req.delivery = doc;

					//console.log(doc);
					next();
				});
	},
	read: function (req, res) {

		var query = {};

		if (req.query) {
			for (var i in req.query) {
				if (i === "query") {
					switch (req.query.query) {
						case "NOTPAID" :
							query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};
							break;
						default :
							break;
					}
				} else
					query[i] = req.query[i];
			}
		}

		DeliveryModel.find(query, "-history -files -latex", function (err, doc) {
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
		res.json(req.delivery);
	},
	create: function (req, res) {
		var delivery = {};
		if (req.query.clone) {
			delivery = req.delivery.toObject();
			delete delivery._id;
			delete delivery.__v;
			delete delivery.ref;
			delete delivery.createdAt;
			delete delivery.updatedAt;
			delivery.Status = "DRAFT";
			delivery.notes = [];
			delivery.latex = {};
			delivery.datec = new Date();

			delivery = new DeliveryModel(delivery);
		} else
			delivery = new DeliveryModel(req.body);

		delivery.author = {};
		delivery.author.id = req.user._id;
		delivery.author.name = req.user.name;

		if (delivery.entity == null)
			delivery.entity = req.user.entity;

		//console.log(delivery);
		delivery.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(delivery);
		});
	},
	update: function (req, res) {
		var delivery = req.delivery;
		//console.log(req.body);
		delivery = _.extend(delivery, req.body);

		delivery.save(function (err, doc) {
			if (err)
				console.log(err);

			//console.log(doc);
			res.json(doc);
		});
	},
	destroy: function (req, res) {
		var delivery = req.delivery;
		delivery.remove(function (err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(delivery);
			}
		});
	},
	select: function (req, res) {
		ExtrafieldModel.findById('extrafields:BonLivraison', function (err, doc) {
			if (err) {
				console.log(err);
				return;
			}
			var result = [];
			if (doc.fields[req.query.field].dict)
				return DictModel.findOne({_id: doc.fields[req.query.field].dict}, function (err, docs) {

					if (docs) {
						for (var i in docs.values) {
							if (docs.values[i].enable) {
								var val = {};
								val.id = i;
								if (docs.values[i].label)
									val.label = docs.values[i].label;
								else
									val.label = req.i18n.t("delivery:" + i);
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
					val.label = req.i18n.t("deliveries:" + doc.fields[req.query.field].values[i].label);
					result.push(val);
				}
			}
			doc.fields[req.query.field].values = result;

			res.json(doc.fields[req.query.field]);
		});
	},
	pdf: function (req, res) {
		// Generation de la livraison PDF et download

		var fk_livraison;
		ExtrafieldModel.findById('extrafields:BonLivraison', function (err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			fk_livraison = doc;
		});

		var cond_reglement_code = {};
		DictModel.findOne({_id: "dict:fk_payment_term"}, function (err, docs) {
			cond_reglement_code = docs;
		});

		var mode_reglement_code = {};
		DictModel.findOne({_id: "dict:fk_paiement"}, function (err, docs) {
			mode_reglement_code = docs;
		});

		latex.loadModel("delivery.tex", function (err, tex) {

			var doc = req.delivery;

			if (doc.Status === "DRAFT") {
				res.type('html');
				return res.send(500, "Impossible de générer le PDF, le bon livraison n'est pas validé");
			}

			SocieteModel.findOne({_id: doc.client.id}, function (err, societe) {

				// replacement des variables
				tex = tex.replace(/--NUM--/g, doc.ref);
				tex = tex.replace(/--DESTINATAIRE--/g, "\\textbf{\\large " + doc.client.name + "} \\\\" + doc.address + "\\\\ \\textsc{" + doc.zip + " " + doc.town + "}");
				tex = tex.replace(/--CODECLIENT--/g, societe.code_client);
				tex = tex.replace(/--TITLE--/g, doc.title);
				tex = tex.replace(/--REFCLIENT--/g, doc.ref_client);
				tex = tex.replace(/--DATEC--/g, dateFormat(doc.datec, "dd/mm/yyyy"));
				tex = tex.replace(/--DATEECH--/g, dateFormat(doc.dater, "dd/mm/yyyy"));

				tex = tex.replace(/--REGLEMENT--/g, cond_reglement_code.values[doc.cond_reglement_code].label);

				tex = tex.replace(/--PAID--/g, mode_reglement_code.values[doc.mode_reglement_code].label);

				switch (doc.mode_reglement_code) {
					case "VIR" :
						tex = tex.replace(/--BK--/g, "\\\\ --IBAN--");
						break;

					case "CHQ" :
						tex = tex.replace(/--BK--/g, "A l'ordre de --ENTITY--");
						break;

					default :
						tex = tex.replace(/--BK--/g, "");
				}
				//tex = tex.replace(/--NOTE--/g, doc.desc.replace(/\n/g, "\\\\"));
				tex = tex.replace(/--NOTE--/g, "");

				//console.log(doc);

				var tab_latex = "";
				for (var i = 0; i < doc.lines.length; i++) {
					tab_latex += doc.lines[i].product.name.substring(0, 11).replace(/_/g, "\\_") + "&\\specialcell[t]{\\textbf{" + doc.lines[i].product.label + "}\\\\" + doc.lines[i].description.replace(/\n/g, "\\\\").replace(/%/gi, "\\%").replace(/&/gi, "\\&") + "\\\\}&" + doc.lines[i].no_package + "&" + latex.number(doc.lines[i].qty, 3) + (doc.lines[i].units ? " " + doc.lines[i].units : " kg") + "\\tabularnewline\n";
				}
				//console.log(products)
				//console.log(tab_latex);
				//return;

				tex = tex.replace("--TABULAR--", tab_latex);

				var tab_latex = "";
				tab_latex += "Total HT &" + latex.price(doc.total_ht) + "\\tabularnewline\n";
				for (var i = 0; i < doc.total_tva.length; i++) {
					tab_latex += "Total TVA " + doc.total_tva[i].tva_tx + "\\% &" + latex.price(doc.total_tva[i].total) + "\\tabularnewline\n";
				}
				tab_latex += "\\vhline\n";
				tab_latex += "Total TTC &" + latex.price(doc.total_ttc) + "\\tabularnewline\n";
				//Payé & --PAYE--\\ 
				tex = tex.replace("--TOTAL--", tab_latex);

				tex = tex.replace(/--APAYER--/g, latex.price(doc.total_ttc));

				latex.headfoot(doc.entity, tex, function (tex) {

					tex = tex.replace(/undefined/g, "");

					doc.latex.data = new Buffer(tex);
					doc.latex.createdAt = new Date();
					doc.latex.title = "Livraison - " + doc.ref;

					doc.save(function (err) {
						if (err) {
							console.log("Error while trying to save this document");
							res.send(403, "Error while trying to save this document");
						}

						latex.compileDoc(doc._id, doc.latex, function (result) {
							if (result.errors.length) {
								//console.log(pdf);
								return res.send(500, result.errors);
							}
							return latex.getPDF(result.compiledDocId, function (err, pdfPath) {
								res.type('application/pdf');
								//res.attachment(doc.ref + ".pdf"); // for douwnloading
								res.sendfile(pdfPath);
							});
						});
					});
				});
			});
		});
	},
	caFamily: function (req, res) {

		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), parseInt(d.getMonth() - 1), 1);
		var dateEnd = new Date(d.getFullYear(), d.getMonth(), 1);

		var ca = {};

		async.parallel({
			caFamily: function (cb) {
				DeliveryModel.aggregate([
					{$match: {Status: {'$ne': 'DRAFT'}, entity: req.user.entity, datec: {'$gte': dateStart, '$lt': dateEnd}}},
					{$unwind: "$lines"},
					{$project: {_id: 0, lines: 1}},
					{$group: {_id: "$lines.product.name", total_ht: {"$sum": "$lines.total_ht"}}}
				], function (err, doc) {
					if (err) {
						return cb(err);
					}

					//console.log(doc);
					cb(null, doc);
				});
			}
			/*familles: function(cb) {
			 CoursesModel.aggregate([
			 {$match: {Status: {'$ne': 'REFUSED'}, total_ht: {'$gt': 0}, date_enlevement: {'$gte': dateStart, '$lt': dateEnd}}},
			 {$project: {_id: 0, type: 1, total_ht: 1}},
			 {$group: {_id: "$type", sum: {"$sum": "$total_ht"}}}
			 ], function(err, doc) {
			 if (doc.length == 0)
			 return cb(0);
			 
			 //console.log(doc);
			 cb(null, doc);
			 });
			 }*/
		}, function (err, results) {
			if (err)
				return console.log(err);

			//console.log(results);
			async.each(results.caFamily, function (product, callback) {
				//console.log(product);
				ProductModel.findOne({ref: product._id}, function (err, doc) {
					if (!doc)
						console.log(product);

					product.caFamily = doc.caFamily;

					if (typeof ca[doc.caFamily] === "undefined")
						ca[doc.caFamily] = 0;

					ca[doc.caFamily] += product.total_ht;
					//console.log(ca);

					callback();
				});

			}, function (err) {

				var result = [];
				for (var i in ca) {
					result.push({
						family: i,
						total_ht: ca[i]
					});
				}

				//console.log(results);

				res.json(200, result);
			});
		});
	}
};

/**
 * Calcul des donnees de facturation
 */

function Billing() {
}

Billing.prototype = {
	read: function (req, res) {
		
		var result = {
			GroupBL : {},
			GroupOrder: {}
		};
		
		var project = {};
		var fields = req.query.fields.split(" ");
		for (var i in fields) {
			project[fields[i].trim()] = 1;
		}
		
		DeliveryModel.aggregate([
			{$match:{Status: "SEND",entity: req.query.entity, datec: {$lte:new Date(req.query.dateEnd)}}},
			{$project: project}
		])
				.unwind('lines')
				
				//.populate("orders", "ref ref_client total_ht")
				.exec(function (err, docs) {
					if (err)
						return console.log(err);

					//console.log(docs);
					result.GroupBL = docs
					res.json(result);
				});
	},
	create: function (req, res) {
		var dateStart = new Date(req.query.year, req.query.month, 1);
		var dateEnd = new Date(req.query.year, parseInt(req.query.month) + 1, 1);

		async.parallel({
			transports: function (cb) {
				CoursesModel.find({Status: {$ne: 'REFUSED'}, type: {$ne: 'REGULIER'}, date_enlevement: {'$gte': dateStart, '$lt': dateEnd}}, "-latex", {sort: {datec: 1}}, function (err, doc) {
					for (var i in doc) {
						doc[i].client.name = doc[i].client.cptBilling.name;
						doc[i].client.id = doc[i].client.cptBilling.id;
					}

					//console.log(doc);

					cb(err, doc);
				});
			},
			stock: function (cb) {
				StockModel.aggregate([
					{'$match': {$or: [{datec: {$lt: dateEnd, $gte: dateStart}}, {"product.billingMode": "MONTH"}]}},
					{'$project': {product: 1, client: 1, qty: 1}},
					{'$group': {_id: {product: '$product', client: '$client'}, total: {$sum: '$qty'}}}
				], function (err, doc) {
					//console.log(doc);

					cb(err, doc);
				});
			},
			ST: function (cb) {
				//console.log(dateStart);
				//console.log(dateEnd);
				CoursesModel.aggregate([
					{'$match': {Status: {'$ne': 'REFUSED'}, total_soustraitant: {'$gt': 0}, date_enlevement: {'$gte': dateStart, '$lt': dateEnd}}},
					{'$group': {
							_id: {
								fournisseur: "$fournisseur",
								type: "$type",
								client: "$client"
							},
							order_id: {'$addToSet': {
									id: "$_id",
									name: "$ref"
								}
							},
							chargesExt: {'$sum': "$chargesExt"},
							total_soustraitant: {'$sum': "$total_soustraitant"}
						}
					}], function (err, doc) {

					//console.log(doc);
					cb(err, doc);
				});
			},
			COURSE: function (cb) {
				ProductModel.findOne({ref: "COURSE"}, function (err, product) {
					if (err)
						console.log(err);

					cb(err, product);
				});
			},
			AFFRETEMENT: function (cb) {
				ProductModel.findOne({ref: "AFFRETEMENT"}, function (err, product) {
					if (err)
						console.log(err);

					cb(err, product);
				});
			},
			MESSAGERIE: function (cb) {
				ProductModel.findOne({ref: "MESSAGERIE"}, function (err, product) {
					if (err)
						console.log(err);

					cb(err, product);
				});
			}
		},
		function (err, results) {
			if (err)
				return console.log(err);

			var clients = [];

			for (var i in results.transports) {
				clients.push(results.transports[i].client.id.toString());
			}

			for (var i in results.stock) {
				clients.push(results.stock[i]._id.client.id.toString());
			}

			// Recupere la liste des clients
			clients = array.unique(clients);

			//console.log(clients);

			var factures = {};
			// Met a jour la liste des factures
			async.each(clients, function (clientId, callback) {
				SocieteModel.findOne({_id: clientId}, function (err, societe) {

					FactureModel.findOne({'title.ref': "EE" + req.query.year + (parseInt(req.query.month) + 1), 'client.id': clientId}, function (err, facture) {
						if (err)
							return callback(err);

						if (facture == null)
							facture = new FactureModel({
								title: {
									ref: "EE" + req.query.year + (parseInt(req.query.month) + 1),
									autoGenerated: true
								},
								client: {
									id: clientId
								},
								type: 'INVOICE_AUTO'
							});

						if (societe == null)
							console.log("Error : pas de societe pour le clientId : " + clientId);

						facture.client.name = societe.name;
						facture.price_level = societe.price_level;
						facture.mode_reglement_code = societe.mode_reglement;
						facture.cond_reglement_code = societe.cond_reglement;
						facture.commercial_id = societe.commercial_id;
						var date = new Date();
						facture.datec = new Date(date.getFullYear(), date.getMonth(), 0);

						facture.entity = req.query.entity;

						facture.address = societe.address;
						facture.zip = societe.zip;
						facture.town = societe.town;

						facture.lines = [];

						factures[clientId] = facture;

						callback();
					});
				});

			}, function (err) {
				if (err)
					return console.log(err);

				//lignes de factures de transports
				async.each(results.transports, function (course, callback) {
					//console.log(course);

					var line = {
						description: (course.from.name || "") + " " + course.from.zip + " " + course.from.town + "\n" + (course.to.name || "") + " " + course.to.zip + " " + course.to.town,
						pu_ht: course.total_ht,
						total_ht: course.total_ht,
						qty: 1,
						group: course.type
					};

					if (course.type == "MESSAGERIE") {
						line.description = course.to.name + " " + course.to.zip + " " + course.to.town + "\n";
						line.description += "Nombre de colis : " + course.nbPalette + " / Poids : " + course.poids + "kg";


						line.tva_tx = 20;
						line.total_tva = course.total_ht * line.tva_tx / 100;
						line.product = {};
						line.product.id = results[course.type]._id;
						line.product.label = "Messagerie (Bordereau " + course.bordereau + " du " + dateFormat(course.datec, "dd/mm/yyyy") + ")";
						line.product.name = course.type;
						line.product.template = "/partials/lines/classic.html";
					} else {
						line.tva_tx = results[course.type].tva_tx;
						line.total_tva = course.total_ht * line.tva_tx / 100;
						line.product = {};
						line.product.id = results[course.type]._id;
						line.product.label = results[course.type].label + " du " + dateFormat(course.date_enlevement, "dd/mm/yyyy") + " au " + dateFormat(course.date_livraison, "dd/mm/yyyy");
						line.product.name = course.type;
						line.product.template = "/partials/lines/classic.html";
						if (course.ref_client)
							line.description += "\n Ref. client : " + course.ref_client;
					}

					factures[course.client.id].lines.push(line);
					callback();
				}, function (err) {
					//lignes de factures de stocks
					async.each(results.stock, function (mouvStock, callback) {
						//console.log(mouvStock);

						ProductModel.findOne({_id: mouvStock._id.product.id}, function (err, product) {
							if (err)
								console.log(err);

							var priceIdx = product.price.map(function (e) {
								return e.price_level;
							}).indexOf(factures[mouvStock._id.client.id].price_level);

							if (priceIdx < 0) {
								console.log("Erreur aucun tarif trouve " + mouvStock._id.product.id + " " + factures[mouvStock._id.client.id].price_level);
								return callback();
							}

							var line = {
								pu_ht: product.price[priceIdx].pu_ht,
								qty: mouvStock.total,
								total_ht: product.price[priceIdx].pu_ht * mouvStock.total,
								group: "STOCK"
							};

							//line.description = course.to.name + " " + course.to.zip + " " + course.to.town;

							line.tva_tx = 20;
							line.total_tva = line.total_ht * line.tva_tx / 100;
							line.product = {};
							line.product.id = mouvStock._id.product.id;
							line.product.label = product.label;
							line.product.name = mouvStock._id.product.name;
							line.product.template = "/partials/lines/classic.html";

							//console.log(line);

							factures[mouvStock._id.client.id].lines.push(line);
							callback();
						});
					}, function (err) {
						// save factures
						async.each(clients, function (clientId, callback) {
							factures[clientId].save(function (err, facture) {
								factures[clientId] = facture;
								callback();
							});
						}, function (err) {
							res.json(200, {});
						});
					});
				});
			});

			//console.log(results.ST);
			var supplierFactures = {};
			async.eachSeries(results.ST, function (BillSupplier, callback) {
				for (var i in BillSupplier.order_id) {
					BillSupplier.order_id[i].url = "#!/module/europexpress/transport_edit.html/";
				}

				var supplierId = BillSupplier._id.fournisseur.id.toString();

				SupplierFactureModel.findOne({'title.ref': "EE" + req.query.year + req.query.month, 'supplier.id': supplierId}, function (err, facture) {
					if (err)
						return callback(err);

					if (supplierFactures[supplierId] == null) {

						if (facture == null)
							facture = new SupplierFactureModel({
								title: {
									ref: "EE" + req.query.year + req.query.month,
									autoGenerated: true
								},
								supplier: {
									id: supplierId
								},
								type: 'INVOICE_AUTO'
							});

						var date = new Date();
						facture.datec = new Date(date.getFullYear(), date.getMonth(), 0);

						facture.entity = req.query.entity;

						facture.lines = [];
					} else {
						facture = supplierFactures[supplierId];
					}

					facture.supplier.name = BillSupplier._id.fournisseur.name;



					var product = {};
					var line = {};
					switch (BillSupplier._id.type) {
						case "REGULIER" :
							switch (BillSupplier._id.client.id.toString()) {
								case "524b218a2d8a265d6600073a" :
									//PROXIDIS
									product = {
										"id": "53a17f2f5ec617390dbb111c",
										"label": "Sous-traitance Proxidis",
										"name": "ST_PROX"
									};

									break;
								case "524b218a2d8a265d66000486":
									//GEFCO
									product = {
										"id": "53bbdb3880d64eb74a810db5",
										"label": "Sous-traitance Gefco",
										"name": "ST_GEFCO"
									};
									break;
								default:
									product = {
										"id": "53bbda3f80d64eb74a810c61",
										"label": "Sous-traitance regulier",
										"name": "ST_REGULIER"
									};
							}

							line = {
								qty: 1,
								tva_tx: 20,
								pu_ht: BillSupplier.total_soustraitant,
								product_type: "SERVICE",
								product: product,
								description: BillSupplier._id.client.name,
								total_ht: BillSupplier.total_soustraitant + BillSupplier.chargesExt,
								total_tva: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 0.20,
								total_ttc: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 1.20
							};

							facture.lines.push(line);

							break;
						case "COURSE" :
							product = {
								"id": "53a17e805ec617390dbb1116",
								"label": "Sous-traitance courses",
								"name": "ST_COURSE"
							};

							line = {
								qty: 1,
								tva_tx: 20,
								pu_ht: BillSupplier.total_soustraitant,
								product_type: "SERVICE",
								product: product,
								description: BillSupplier._id.client.name,
								total_ht: BillSupplier.total_soustraitant + BillSupplier.chargesExt,
								total_tva: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 0.20,
								total_ttc: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 1.20
							};

							facture.lines.push(line);

							break;
						case "AFFRETEMENT" :
							product = {
								"id": "53a17ef15ec617390dbb111a",
								"label": "Sous-traitance Affretement",
								"name": "ST_AFFRET"
							};

							line = {
								qty: 1,
								tva_tx: 20,
								pu_ht: BillSupplier.total_soustraitant,
								product_type: "SERVICE",
								product: product,
								description: BillSupplier._id.client.name,
								total_ht: BillSupplier.total_soustraitant + BillSupplier.chargesExt,
								total_tva: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 0.20,
								total_ttc: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 1.20
							};

							facture.lines.push(line);

							break;
						case "MESSAGERIE" :
							product = {
								"id": "53a17f515ec617390dbb111e",
								"label": "Sous-traitance Messagerie",
								"name": "ST_MESS"
							};

							line = {
								qty: 1,
								tva_tx: 20,
								pu_ht: BillSupplier.total_soustraitant,
								product_type: "SERVICE",
								product: product,
								description: BillSupplier._id.client.name,
								total_ht: BillSupplier.total_soustraitant + BillSupplier.chargesExt,
								total_tva: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 0.20,
								total_ttc: (BillSupplier.total_soustraitant + BillSupplier.chargesExt) * 1.20
							};

							facture.lines.push(line);

							break;
						default :

					}

					supplierFactures[supplierId] = facture;

					callback();

					//console.log(supplierFactures);
				});
			}, function (err) {
				var factures = [];

				for (var i in supplierFactures) {
					factures.push(supplierFactures[i]);
				}

				// save SupplierFactures
				factures.forEach(function (facture) {
					facture.save(function (err, doc) {
						console.log(facture);
					});
				});
			});

		});
	},
	courses: function (req, type, cb) {
		var dateStart = new Date(req.body.year, req.body.month, 1);
		var dateEnd = new Date(req.body.year, parseInt(req.body.month) + 1, 1);
		var fk_status = this.fk_extrafields.fields.statusCourses;

		CoursesModel.find({type: type, Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart, '$lt': dateEnd}}, "client fournisseur total_ht total_soustraitant type ref Status date_enlevement", function (err, doc) {
			for (var i in doc) {
				var status = {};

				status.id = doc[i].Status;
				if (fk_status.values[status.id]) {
					status.name = fk_status.values[status.id].label;
					status.css = fk_status.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}
				doc[i].client.name = doc[i].client.cptBilling.name;
				doc[i].client.id = doc[i].client.cptBilling.id;

				doc[i].Status = {};
				doc[i].Status = status;
			}

			cb(err, doc);
		});
	},
	allST: function (req, cb) {
		var dateStart = new Date(req.body.year, req.body.month, 1);
		var dateEnd = new Date(req.body.year, parseInt(req.body.month) + 1, 1);
		var fk_status = this.fk_extrafields.fields.statusCourses;

		CoursesModel.find({Status: {'$ne': 'REFUSED'}, total_soustraitant: {'$gt': 0}, date_enlevement: {'$gte': dateStart, '$lt': dateEnd}}, "client fournisseur total_ht total_soustraitant type ref Status date_enlevement chargesExt", function (err, doc) {
			for (var i in doc) {
				var status = {};

				status.id = doc[i].Status;
				if (fk_status.values[status.id]) {
					status.name = fk_status.values[status.id].label;
					status.css = fk_status.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}

				doc[i].Status = {};
				doc[i].Status = status;
			}

			cb(err, doc);
		});
	},
	familyCA: function (req, res) {
		var result = [];
		var dateStart = new Date();
		dateStart.setHours(0, 0, 0, 0);
		dateStart.setMonth(0);
		dateStart.setDate(1);

		var family = ["MESSAGERIE", "AFFRETEMENT", "COURSE", "REGULIER"];
		async.parallel({
			cafamily: function (cb) {
				var result = {};
				//init CA

				for (var i = 0; i < family.length; i++) {
					result[family[i]] = [];
					for (var m = 0; m < 12; m++)
						result[family[i]].push(0);
				}

				/*
				 * Error $month operator with GMT !!!
				 * See https://jira.mongodb.org/browse/SERVER-6310
				 * 
				 * 
				 CoursesModel.aggregate([
				 {$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
				 {$project: {total_ht: 1, type: 1, date_enlevement: 1}},
				 {$group: {
				 _id: {
				 type: "$type",
				 month: {$month: "$date_enlevement"}
				 },
				 total_ht: {$sum: "$total_ht"},
				 marge: {$sum: "$commission"}
				 }
				 }
				 ], function(err, docs) {
				 if (err)
				 console.log(err);
				 
				 console.log(docs);
				 
				 for (var i = 0; i < docs.length; i++) {
				 result[docs[i]._id.type][docs[i]._id.month - 1] = docs[i].total_ht;
				 }
				 
				 
				 console.log(result);
				 
				 cb(null, result);
				 });
				 */

				CoursesModel.find({Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}},
				{total_ht: 1, type: 1, date_enlevement: 1}, function (err, docs) {
					if (err)
						console.log(err);

					//console.log(docs);

					for (var i = 0; i < docs.length; i++) {

						result[docs[i].type][docs[i].date_enlevement.getMonth()] += docs[i].total_ht;
					}


					//console.log(result);

					cb(null, result);
				});

			},
			caMonth: function (cb) {
				var result = {};
				result.total = [];
				result.sum = [];
				for (var m = 0; m < 12; m++)
					result.total.push(0);

				/*CoursesModel.aggregate([
				 {$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
				 {$project: {total_ht: 1, date_enlevement: 1}},
				 {$group: {
				 _id: {
				 $month: "$date_enlevement"
				 },
				 total_ht: {$sum: "$total_ht"}}
				 }
				 ], function(err, docs) {*/
				CoursesModel.find({Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}},
				{total_ht: 1, date_enlevement: 1},
				function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						result.total[docs[i].date_enlevement.getMonth()] += docs[i].total_ht;
					}

					//apply sum on ca
					for (var i = 0; i < 12; i++)
						if (i == 0)
							result.sum[i] = result.total[i];
						else
							result.sum[i] = result.total[i] + result.sum[i - 1];

					cb(null, result);
				});
			},
			caCumul: function (cb) {
				var result = [];
				for (var m = 0; m < 12; m++)
					result.push(0);

				/*CoursesModel.aggregate([
				 {$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
				 {$project: {total_ht: 1, date_enlevement: 1}},
				 {$group: {
				 _id: {
				 $month: "$date_enlevement"
				 },
				 total_ht: {$sum: "$total_ht"}
				 }
				 }*/
				CoursesModel.find({Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}},
				{total_ht: 1, date_enlevement: 1},
				function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						result[docs[i].date_enlevement.getMonth()] += docs[i].total_ht;
					}

					cb(null, result);
				});
			}, caTotalfamily: function (cb) {
				var result = [];

				CoursesModel.aggregate([
					{$match: {Status: {'$ne': 'REFUSED'}, date_enlevement: {'$gte': dateStart}}},
					{$project: {total_ht: 1, type: 1, date_enlevement: 1}}, {$group: {_id: "$type",
							total_ht: {$sum: "$total_ht"}
						}
					}
				], function (err, docs) {
					for (var i = 0; i < docs.length; i++) {
						result.push({
							name: docs[i]._id, y: docs[i].total_ht
						});
					}

					cb(null, result);
				});
			}
		},
		function (err, results) {
			var result = [];
			if (err)
				return console.log(err);

			for (var i in results.cafamily)
				result.push({
					type: 'column',
					name: i, data: results.cafamily[i]
				});

			result.push({
				type: 'spline',
				name: 'CA mensuel N',
				yAxis: 1,
				data: results.caMonth.total,
				marker: {
					lineWidth: 2,
					fillColor: '#4572A7'
				}
			});

			/*result.push({
			 type: 'spline',
			 name: 'CA cumulé',
			 data: results.caMonth.sum,
			 marker: {
			 lineWidth: 2,
			 fillColor: 'white'
			 }
			 });*/

			result.push({
				type: 'spline',
				name: 'CA mensuel N-1',
				yAxis: 1,
				data: [226181, 219052, 225464, 126920, 207904, 223189, 246774, 213849, 221774, 239235, 215774, 235522],
				marker: {
					lineWidth: 2,
					fillColor: '#4572A7'
				}
			});

			result.push({
				type: 'pie',
				name: 'Total par famille', data: results.caTotalfamily,
				center: [80, 40],
				size: 100,
				showInLegend: false,
				dataLabels: {
					enabled: false
				}
			});

			res.json(result);
			/*res.json(
			 [{
			 type: 'column',
			 name: 'Jane',
			 data: [3, 2, 1, 3, 4]
			 }, {
			 type: 'column',
			 name: 'John',
			 data: [2, 3, 5, 7, 6]
			 }, {
			 type: 'column',
			 name: 'Joe',
			 data: [4, 3, 3, 9, 0]
			 }, {
			 type: 'spline',
			 name: 'Average',
			 data: [3, 2.67, 3, 6.33, 3.33],
			 marker: {
			 lineWidth: 2,
			 fillColor: 'white'
			 }
			 }, {
			 type: 'pie',
			 name: 'Total family',
			 data: [{
			 name: 'Jane',
			 y: 13,
			 }, {
			 name: 'John',
			 y: 23,
			 }, {
			 name: 'Joe',
			 y: 19,
			 }],
			 center: [100, 40],
			 size: 100,
			 showInLegend: false,
			 dataLabels: {
			 enabled: false 			 }
			 }]
			 );*/
		});
	}
};
"use strict";

var mongoose = require('mongoose'),
		timestamps = require('mongoose-timestamp'),
		fs = require('fs'),
		csv = require('csv'),
		xml2js = require('xml2js'),
		dateFormat = require('dateformat'),
		_ = require('lodash');


var SeqModel = mongoose.model('Sequence');
var OrderModel = mongoose.model('commande');
var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var EntityModel = mongoose.model('entity');
var Dict = require('../controllers/dict');

/**
 * Schema du planning de prod
 */

var planningSchema = new mongoose.Schema({
	jobTicket: {type: String},
	order: {
		name: String,
		id: String,
		ref_client: String
	},
	description: String,
	notes: String,
	datec: {type: Date, default: Date.now},
	societe: {
		id: {type: mongoose.Schema.Types.ObjectId, ref: 'Societe'},
		name: String
	},
	qtyPages: {type: Number, default: 1},
	qty: {type: Number, default: 1},
	author: {
		id: {type: String, ref: 'User'},
		name: String
	},
	date_livraison: {type: Date},
	Status: String,
	step: String,
	entity: String,
	history: [{
			tms: {type: Date, default: Date.now},
			Status: String,
			step: String
		}]
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});
planningSchema.plugin(timestamps);

/**
 * Pre-save hook
 */
planningSchema.pre('save', function (next) {

	var self = this;
	if (this.isNew && this.jobTicket == "") {
		SeqModel.inc("JT", function (seq) {
			//console.log(seq);
			EntityModel.findOne({_id: self.entity}, "cptRef", function (err, entity) {
				if (err)
					console.log(err);

				if (entity && entity.cptRef)
					self.jobTicket = "JT" + entity.cptRef + seq;
				else
					self.jobTicket = "JT" + seq;
				next();
			});
		});
		//return next();
	} else
		next();
});

var planningStatusList = {};
Dict.extrafield({extrafieldName: 'Chaumeil'}, function (err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	if (doc)
		planningStatusList = doc.fields;
	else
		console.log('Dict is not loaded');
});

planningSchema.virtual('status')
		.get(function () {
			var res = {};

			var status = this.Status;

			if (status && planningStatusList.planningStatus.values[status] && planningStatusList.planningStatus.values[status].label) {
				res.id = status;
				res.name = planningStatusList.planningStatus.values[status].label;
				res.css = planningStatusList.planningStatus.values[status].cssClass;
			} else {
				res.id = status;
				res.name = status;
				res.css = "";
			}

			return res;

		});

var PlanningModel = mongoose.model('chaumeil_planning', planningSchema, 'chaumeil_planning');

var otisSchema = new mongoose.Schema({
	numAffaire: {type: String},
	centreCout: String,
	datec: {type: Date, default: Date.now}
});
otisSchema.plugin(timestamps);

var OtisModel = mongoose.model('chaumeil_otis', otisSchema, 'chaumeil_otis');

var Dict = require('../controllers/dict');

module.exports = function (app, passport, auth) {

	var planning = new Planning();

	Dict.extrafield({extrafieldName: 'Chaumeil'}, function (err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		planning.fk_extrafields = doc;
	});

	app.get('/api/chaumeil/planning', auth.requiresLogin, planning.read);
	app.get('/api/chaumeil/planning/:planningId', auth.requiresLogin, planning.show);
	app.post('/api/chaumeil/planning', auth.requiresLogin, planning.create);
	app.put('/api/chaumeil/planning/:planningId', auth.requiresLogin, planning.update);

	app.del('/api/chaumeil/planning', auth.requiresLogin, planning.del);

	app.param('planningId', planning.planningId);

	/*
	 app.post('/api/chaumeil/planning/order/autocomplete', auth.requiresLogin, function (req, res) {
	 //console.dir(req.body);
	 PlanningModel.aggregate([{'$group': {_id: '$order'}}, {'$project': {'order': 1}}, {'$match': {'_id.name': new RegExp(req.body.filter.filters[0].value, "i")}}, {'$limit': parseInt(req.body.take)}], function (err, docs) {
	 // {limit: req.body.take}
	 if (err) {
	 console.log("err : /api/chaumeil/planning/order/autocomplete");
	 console.log(err);
	 return;
	 }
	 
	 var result = [];
	 
	 if (docs !== null)
	 for (var i in docs) {
	 //console.log(docs[i]);
	 result[i] = {};
	 result[i].name = docs[i]._id.name;
	 result[i].id = docs[i]._id.id;
	 result[i].ref_client = docs[i]._id.ref_client;
	 }
	 
	 return res.send(200, result);
	 });
	 });*/

	/*app.post('/api/chaumeil/planning/societe/autocomplete', auth.requiresLogin, function (req, res) {
	 //console.dir(req.body);
	 PlanningModel.aggregate([{'$group': {_id: '$societe'}}, {'$project': {'societe': 1}}, {'$match': {'_id.name': new RegExp(req.body.filter.filters[0].value, "i")}}, {'$limit': parseInt(req.body.take)}], function (err, docs) {
	 // {limit: req.body.take}
	 if (err) {
	 console.log("err : /api/chaumeil/planning/societe/autocomplete");
	 console.log(err);
	 return;
	 }
	 
	 var result = [];
	 
	 if (docs !== null)
	 for (var i in docs) {
	 //console.log(docs[i]);
	 result[i] = {};
	 result[i].name = docs[i]._id.name;
	 result[i].id = docs[i]._id.id;
	 }
	 
	 return res.send(200, result);
	 });
	 });*/

	app.post('/api/chaumeil/planning/import'/*, ensureAuthenticated*/, function (req, res) {
		if (req.files) {
			var filename = req.files.filedata.path;
			if (fs.existsSync(filename)) {

				var parser = new xml2js.Parser({explicitArray: false});
				fs.readFile(filename, function (err, data) {
					var xml = data.toString();
					//var xml = req.rawBody;

					//console.log(xml);

					parser.parseString(xml, function (err, result) {
						var docs = [];

						for (var i = 0; i < result.rows.row.length; i++) {
							var doc = result.rows.row[i];

							var datec = doc.cell[1].split("/");
							var dateliv = doc.cell[10].split("/");
							//console.log(new Date(datec[2], datec[1]-1, datec[0]));

							var job = new PlanningModel({
								jobTicket: doc.$.id,
								order: {
									name: doc.cell[2],
									id: null
								},
								description: doc.cell[4],
								societe: {
									id: null,
									name: doc.cell[3]
								},
								qtyPages: 1,
								qty: 1,
								author: {
									id: null,
									name: "import"
								},
								Status: "",
								step: "",
								entity: "clermont",
								notes: "",
								history: []
							});

							if (datec[2])
								job.datec = new Date(datec[2], datec[1] - 1, datec[0]).toISOString();

							if (dateliv[2])
								job.date_livraison = new Date(dateliv[2], dateliv[1] - 1, dateliv[0]).toISOString();

							var status = doc.cell[13].split(":");
							//console.log(status[0]);

							//"NEW","ENCOURS","BAT","WAITING_PROD","WAITING_COMM","ACC","EXP","LIV","CANCELED"

							switch (status[0]) {
								case "ACCUEIL" :
									job.Status = "ACC";
									break;
								case "EN COURS" :
									job.Status = "ENCOURS";
									break;
								case "LIVRE EXPEDIE" :
									job.Status = "LIV";
									break;
								default :
									job.Status = "NEW";
							}

							// "Pre-Press", "Infographie", "NexPress", "Plans", "N&B", "Couleur", "Table a plat", "Finition", "Expedition"
							var step = doc.cell[5];
							switch (step) {
								case "NEXPRESS":
									job.step = "NexPress";
									break;
								case "NOIR ET BLANC":
									job.step = "N&B";
									break;
								case "TABLE A PLAT":
									job.step = "Table a plat";
									break;
								case "PLANS" :
									job.step = "Plans";
									break;
								case "PRE-PRESSE":
									job.step = "Pre-Press";
									break;
								case "PLASTIFICATION":
									job.step = "Finition";
									break;
								case "COULEUR":
									job.step = "Couleur";
									break;
								case "INFOGRAPHIE":
									job.step = "Infographie";
									break;
							}
							job.save(function (err, doc) {
								if (err)
									console.log(err);
							});

							docs.push(job);
						}
						res.send(200, {ok: docs.length});
					});
				});
			}
		}
	});

	app.post('/api/chaumeil/otis/import', /*ensureAuthenticated,*/ function (req, res) {

		if (req.files) {
			var filename = req.files.filedata.path;
			if (fs.existsSync(filename)) {

				var tab = [];

				csv()
						.from.path(filename, {delimiter: ';', escape: '"'})
						.transform(function (row, index, callback) {
							//console.log(tab);
							//console.log(row);

							//console.log(row[0]);

							//return;

							OtisModel.findOne({numAffaire: row[0]}, function (err, doc) {
								if (err) {
									console.log(err);
									return callback();
								}

								if (doc == null)
									doc = new OtisModel();

								doc.numAffaire = row[0];
								doc.centreCout = row[4];


								//console.log(row[10]);
								//console.log(societe)
								//console.log(societe.datec);

								doc.save(function (err, doc) {
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

	app.post('/api/chaumeil/otis/autocomplete', auth.requiresLogin, function (req, res) {
		console.dir(req.body.filter);

		if (req.body.filter == null)
			return res.send(200, {});

		var query = {};

		query[req.body.field] = new RegExp(req.body.filter.filters[0].value, "i");

		//console.log(query);
		OtisModel.find(query, {}, {limit: req.body.take}, function (err, docs) {
			if (err) {
				console.log("err : /api/chaumeil/otis/autocomplete");
				console.log(err);
				return;
			}

			return res.send(200, docs);
		});
	});

	app.get('/api/chaumeil/otis/assistantes', auth.requiresLogin, function (req, res) {
		var assistantes = [
			{
				id: 1, entite: "IDF", cm: 495, firstname: "Maité", lastname: "PASTEL", address: "110 / 114 rue Victor Hugo", zip: "92686", town: "LEVALLOIS PERRET Cedex", email: "maite.pastel@fr.otis.com"
			}, {
				id: 2, entite: "IDF", cm: 495, firstname: "Nathalie", lastname: "PINCON", address: "110 / 114 rue Victor Hugo", zip: "92686", town: "LEVALLOIS PERRET Cedex", email: "nathalie.pincon@fr.otis.com"
			}, {
				id: 3, entite: "IDF", cm: 496, firstname: "Monique", lastname: "DUGAS", address: "110 / 114 rue Victor Hugo", zip: "92686", town: "LEVALLOIS PERRET Cedex", email: "monique.dugas@fr.otis.com"
			}, {
				id: 4, entite: "NORD", cm: 501, firstname: "Céline", lastname: "BEUNES", address: "340/4 Avenue de la Marne - Parc Europe", zip: "59700", town: "MARCQ EN BAROEUL", email: "celine.beunes@fr.otis.com"
			}, {
				id: 5, entite: "NORD", cm: 501, firstname: "Nadine", lastname: "COISNE", address: "340/4 Avenue de la Marne - Parc Europe", zip: "59700", town: "MARCQ EN BAROEUL", email: "nadine.coisne@fr.otis.com"
			}, {
				id: 6, entite: "NORD", cm: 501, firstname: "Patricia", lastname: "LECOMTE", address: "7 rue Gustave Eiffel", zip: "76230", town: "BOIS GUILLAUME", email: "patricia.lecomte@fr.otis.com"
			}, {
				id: 7, entite: "NORD", cm: 501, firstname: "Karine", lastname: "DARVOGNE", address: "1 bis rue Maurice Hollande", zip: "51100", town: "REIMS", email: "karine.darvogne@fr.otis.com"
			}, {
				id: 8, entite: "NORD", cm: 501, firstname: "Véronique", lastname: "LORENTZ-ZINK", address: "Parc des Forges – Bat. M1 \n34, Rue Jacobi Netter", zip: "67200", town: "STRASBOURG", email: "veronique.lorentz@fr.otis.com"
			}, {
				id: 9, entite: "SUD", cm: 502, firstname: "Nathalie", lastname: "OCCHIPINTI", address: "141 avenue du Prado - Bat B", zip: "13008", town: "MARSEILLE", email: "nathalie.occhipinti@fr.otis.com"
			}, {
				id: 10, entite: "SUD", cm: 502, firstname: "Valérie", lastname: "ROUDIER-NEGREL", address: "141 avenue du Prado - Bat B", zip: "13008", town: "MARSEILLE", email: "valerie.roudier@fr.otis.com"
			}, {
				id: 11, entite: "SUD", cm: 502, firstname: "Claire", lastname: "BUSCA", address: "22 rue Jean Monnet - BP 90258", zip: "31242", town: "L'UNION", email: "claire.busca@fr.otis.com"
			}, {
				id: 12, entite: "SUD", cm: 502, firstname: "Patricia", lastname: "PYFFEROEN", address: "164 rue M. Le Boucher - ZAC de Tournezy", zip: "34070", town: "MONTPELLIER", email: "patricia.pyfferoen@fr.otis.com"
			}, {
				id: 13, entite: "EST", cm: 503, firstname: "Haiet", lastname: "GHOUATI", address: "3 rue Claude Chappe - Parc Aff. Télébase BP 65", zip: "69771", town: "SAINT DIDIER AU MONT D'OR Cedex", email: "haiet.ghouati@fr.otis.com"
			}, {
				id: 14, entite: "EST", cm: 503, firstname: "Maud", lastname: "JOURNET", address: "5 rue de Maupertuis - ZAC les Ruires", zip: "38320", town: "EYBENS", email: "maud.journet@fr.otis.com"
			}, {
				id: 15, entite: "EST", cm: 503, firstname: "Patricia", lastname: "PEZERAT-ADAMINI", address: "24 rue Jean-Baptiste Colbert", zip: "10600", town: "LA CHAPELLE SAINT LUC", email: "patricia.pezeratadamini@fr.otis.com"
			}, {
				id: 16, entite: "EST", cm: 503, firstname: "Nathalie", lastname: "LAMAS", address: "3 rue Claude Chappe - Parc Aff. Télébase BP 65", zip: "69771", town: "SAINT DIDIER AU MONT D'OR Cedex", email: "nathalie.lamas@fr.otis.com"
			}, {
				id: 17, entite: "OUEST", cm: 504, firstname: "Ariane", lastname: "DORMEVAL", address: "24 rue Felix Eboué - CP 2023", zip: "44406", town: "REZE", email: "ariane.dormeval@fr.otis.com"
			}, {
				id: 18, entite: "OUEST", cm: 504, firstname: "Séverine", lastname: "BROCHARD", address: "2 rue des  Mesliers - BP 74165", zip: "35514", town: "CESSON SEVIGNE", email: "severinne.brochard@fr.otis.com"
			}, {
				id: 19, entite: "OUEST", cm: 504, firstname: "Marina", lastname: "PORTO", address: "200 rue des Cassines", zip: "45560", town: "SAINT DENIS EN VAL", email: "marina.porto@fr.otis.com"
			}, {
				id: 20, entite: "OUEST", cm: 504, firstname: "Nicole", lastname: "BATBEDAT", address: "270 avenue Jean Mermoz", zip: "33327", town: "EYSINES Cedex", email: "nicole.batbedat@fr.otis.com"
			}, {
				id: 21, entite: "SUD", cm: 502, firstname: "Fabienne", lastname: "PROUST", address: "Nice la Plaine 1 - Av Emmanuel Pontremoli", zip: "06200", town: "NICE", email: "fabienne.proust@fr.otis.com"
			}
		];

		var result = [];
		for (var i in assistantes) {
			if (assistantes[i].cm == req.query.centreCout)
				result.push(assistantes[i]);
		}

		res.json(200, result);
	});

	app.get('/api/chaumeil/otis/selectFiles', auth.requiresLogin, function (req, res) {
		var selectFiles = {};

		selectFiles.PVFeuPortePaliere = [
			//SELECOM
			{
				filename: "SELCOM PF30 CLD 41C.pdf",
				directory: "SELECOM",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13520&CodeFichier=85021&TypeNav=Librairies"
			},
			{
				filename: "SELCOM PF30 CLD 4P 2400.pdf",
				directory: "SELECOM",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13520&CodeFichier=85020&TypeNav=Librairies"
			},
			//PRIMA
			{
				filename: "PRIMA 900R TLD E120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85011&TypeNav=Librairies"
			},
			{
				filename: "PRIMA CLD E120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85012&TypeNav=Librairies"
			},
			{
				filename: "PRIMA TLD E120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85013&TypeNav=Librairies"
			},
			{
				filename: "PRIMA-S CLD SF E120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85014&TypeNav=Librairies"
			},
			{
				filename: "PRIMA-S CLD SF EI120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85016&TypeNav=Librairies"
			},
			{
				filename: "PRIMA-S CLD SF EI30.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85015&TypeNav=Librairies"
			},
			{
				filename: "PRIMA-S TLD SF E120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85017&TypeNav=Librairies"
			},
			{
				filename: "PRIMA-S TLD SF EI120.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85019&TypeNav=Librairies"
			},
			{
				filename: "PRIMA-S TLD SF EI30.pdf",
				directory: "PRIMA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13514&CodeFichier=85018&TypeNav=Librairies"
			},
			//SENCIA
			{
				filename: "SENCIA.pdf",
				directory: "SENCIA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13519&CodeFichier=85022&TypeNav=Librairies"
			},
			//TECHNA
			{
				filename: "TECHNA CLD E120.pdf",
				directory: "TECHNA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13515&CodeFichier=85025&TypeNav=Librairies"
			},
			{
				filename: "TECHNA CLD2 E120.pdf",
				directory: "TECHNA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13515&CodeFichier=85023&TypeNav=Librairies"
			},
			{
				filename: "TECHNA CLD2 EI60.pdf",
				directory: "TECHNA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13515&CodeFichier=85024&TypeNav=Librairies"
			},
			{
				filename: "TECHNA GLASS CLD EW30-E60.pdf",
				directory: "TECHNA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13515&CodeFichier=85026&TypeNav=Librairies"
			},
			{
				filename: "TECHNA TLD E120.pdf",
				directory: "TECHNA",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13515&CodeFichier=85027&TypeNav=Librairies"
			},
			//TECHNA 2
			{
				filename: "TECHNA2 CLD E120.pdf",
				directory: "TECHNA 2",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13516&CodeFichier=85028&TypeNav=Librairies"
			},
			{
				filename: "TECHNA2 CLD EI120.pdf",
				directory: "TECHNA 2",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13516&CodeFichier=85030&TypeNav=Librairies"
			},
			{
				filename: "TECHNA2 CLD EI60.pdf",
				directory: "TECHNA 2",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13516&CodeFichier=85029&TypeNav=Librairies"
			},
			{
				filename: "TECHNA2 TLD E120.pdf",
				directory: "TECHNA 2",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13516&CodeFichier=85031&TypeNav=Librairies"
			}

		];

		selectFiles.PVFeuSolCabine = [
			{
				filename: "PV PASTILLE.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13517&CodeFichier=86628&TypeNav=Librairies"
			},
			{
				filename: "PV PIERRE DE SYNTHESE.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13517&CodeFichier=85033&TypeNav=Librairies"
			},
			{
				filename: "PV RUBBER.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13517&CodeFichier=86629&TypeNav=Librairies"
			},
			{
				filename: "PV SOL PARQUET.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13517&CodeFichier=85035&TypeNav=Librairies"
			},
			{
				filename: "PV TARALAY.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13517&CodeFichier=85036&TypeNav=Librairies"
			},
			{
				filename: "Sol_Alu-honeycomb-stone_Certificate_0987-MED-079.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13517&CodeFichier=85037&TypeNav=Librairies"
			},
			{
				filename: "Décaissé de 4mm - Pas de PV",
				url: ""
			},
			{
				filename: "Décaissé de 5mm - Pas de PV",
				url: ""
			},
			{
				filename: "Décaissé de 22mm - Pas de PV",
				url: ""
			},
			{
				filename: "Décaissé de 30mm - Pas de PV",
				url: ""
			}
		];

		selectFiles.PVFeuParoisCabine = [
			{
				filename: "PV SKINPLATE.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13518&CodeFichier=85009&TypeNav=Librairies"
			},
			{
				filename: "PV STRATIFIE.pdf",
				url: "https://btp.chaumeil-repro.fr/ipc/librairies/fichierDetails.asp?CodeLibrairie=13518&CodeFichier=85010&TypeNav=Librairies"
			},
			{
				filename: "Inox - Pas de PV",
				url: ""
			},
			{
				filename: "Vitrée - Pas de PV",
				url: ""
			},
			{
				filename: "Habillage local - Pas de PV",
				url: ""
			}
		];

		res.json(200, selectFiles);
	});

	app.get('/api/chaumeil/otis/latex/:id', auth.requiresLogin, function (req, res) {
		var blId = req.query.bl;

		var latex = require('../controllers/latex');
		if (req.params.id) {
			latex.loadModel("otis.tex", function (err, tex) {

				OrderModel.findOne({_id: req.params.id}, function (err, doc) {
					//SocieteModel.findOne({_id: doc.fournisseur.id}, function(err, societe) {
					//	if (societe == null)
					//		return res.send(403, "Le sous-traitant n'a pas ete trouve");

					//console.log(doc);

					// replacement des variables
					tex = tex.replace(/--REFERENCE--/g, doc.optional.projet);
					var text = "\\textbf{" + doc.bl[blId].name + "} \\\\ ";
					if (doc.bl[0].contact)
						text += doc.bl[blId].contact + "\\\\";
					text += " \\hspace{0.5cm} " + doc.bl[blId].address + "\\\\ \\textsc{" + doc.bl[blId].zip + " " + doc.bl[blId].town + "}";
					tex = tex.replace(/--DESTINATAIRE--/g, text);
					tex = tex.replace(/--NUMAFFAIRE--/g, doc.optional.numAffaire);
					//tex = tex.replace(/--TOTO--/g, req.user.firstname + " " + req.user.lastname);
					tex = tex.replace(/--DATEC--/g, dateFormat(doc.datec, "dd/mm/yyyy"));
					tex = tex.replace(/--PAGE--/g, doc.bl[blId].products[0].qty);
					tex = tex.replace(/--CD--/g, doc.bl[blId].products[1].qty);

					//tex = tex.replace(/--MONTANT--/g, doc.total_soustraitant);
					//tex = tex.replace(/--CHARGESEXT--/g, doc.chargesExt);
					//tex = tex.replace(/--ZONEDEPART--/g, doc.from.zip + " " + doc.from.town + " " + doc.from.country_id);
					//tex = tex.replace(/--ZONEARRIVE--/g, doc.to.zip + " " + doc.to.town + " " + doc.to.country_id);
					//console.log(doc);

					//latex.headfoot(req.user.entity, tex, function(tex) {

					var docLatex = {};
					docLatex.data = new Buffer(tex);
					docLatex.createdAt = new Date();
					docLatex.title = "OTIS " + doc.ref_client;

					//doc.save(function(err) {
					//	if (err) {
					//		console.save("Error while trying to save this document");
					//		res.send(403, "Error while trying to save this document");
					//	}

					latex.compileDoc(doc._id, docLatex, function (result) {
						if (result.errors.length) { 			 	 				//console.log(pdf);
							return res.send(500, result.errors);
						}

						latex.getPDF(result.compiledDocId, function (err, pdfPath) {
							//console.log(pdfPath);
							res.type('application/pdf');
							//res.attachment(id + ".pdf"); // for douwnloading
							res.sendfile(pdfPath);
						});

						//res.send(200, result.compiledDocURI);
					});
					//});
					//});
				});
			});
			//});
		} else
			res.send(403, "Not Found");
	});

	app.get('/api/chaumeil/otis/classeur/:id', auth.requiresLogin, function (req, res) {
		var blId = req.query.bl;

		var latex = require('../controllers/latex');
		if (req.params.id) {
			latex.loadModel("classeur_otis.tex", function (err, tex) {

				OrderModel.findOne({_id: req.params.id}, function (err, doc) {
					//SocieteModel.findOne({_id: doc.fournisseur.id}, function(err, societe) {
					//	if (societe == null)
					//		return res.send(403, "Le sous-traitant n'a pas ete trouve");

					// replacement des variables
					tex = tex.replace(/--REFERENCE--/g, doc.optional.projet);
					var text = "\\textbf{" + doc.bl[blId].name + "} \\\\ ";
					if (doc.bl[blId].contact)
						text += doc.bl[blId].contact + "\\\\";
					text += " \\hspace{0.5cm} " + doc.bl[blId].address + "\\\\ \\textsc{" + doc.bl[blId].zip + " " + doc.bl[blId].town + "}";
					tex = tex.replace(/--DESTINATAIRE--/g, text);
					tex = tex.replace(/--NUMAFFAIRE--/g, doc.optional.numAffaire);
					//tex = tex.replace(/--TOTO--/g, req.user.firstname + " " + req.user.lastname);
					tex = tex.replace(/--DATEC--/g, dateFormat(doc.datec, "dd/mm/yyyy"));
					tex = tex.replace(/--PAGE--/g, doc.bl[blId].products[0].qty);
					tex = tex.replace(/--CD--/g, doc.bl[blId].products[1].qty);

					var annexe = "";

					for (var i = 0; i < doc.files.length; i++) {
						if (doc.files[i].originalFilename.indexOf("annex") === 0) {
							annexe += "\\item[] " + doc.files[i].originalFilename.substr(doc.files[i].originalFilename.indexOf("___") + 3).replace(/_/g, "\\_") + "\\n";
						}
					}

					tex = tex.replace(/--ANNEXES--/g, annexe);

					//tex = tex.replace(/--MONTANT--/g, doc.total_soustraitant);
					//tex = tex.replace(/--CHARGESEXT--/g, doc.chargesExt);
					//tex = tex.replace(/--ZONEDEPART--/g, doc.from.zip + " " + doc.from.town + " " + doc.from.country_id);
					//tex = tex.replace(/--ZONEARRIVE--/g, doc.to.zip + " " + doc.to.town + " " + doc.to.country_id);
					//console.log(doc);

					//latex.headfoot(req.user.entity, tex, function(tex) {

					var docLatex = {};
					docLatex.data = new Buffer(tex);
					docLatex.createdAt = new Date();
					docLatex.title = "OTIS " + doc.ref_client;

					//doc.save(function(err) {
					//	if (err) {
					//		console.save("Error while trying to save this document");
					//		res.send(403, "Error while trying to save this document");
					//	}

					latex.compileDoc(doc._id, docLatex, function (result) {
						if (result.errors.length) { 			 	 				//console.log(pdf);
							return res.send(500, result.errors);
						}

						latex.getPDF(result.compiledDocId, function (err, pdfPath) {
							//console.log(pdfPath);
							res.type('application/pdf');
							res.attachment(doc.ref + "_classeur_destinataire" + (parseInt(blId) + 1) + ".pdf"); // for douwnloading
							res.sendfile(pdfPath);
						});

						//res.send(200, result.compiledDocURI);
					});
					//});
					//});
				});
			});
			//});
		} else
			res.send(403, "Not Found");
	});

	app.get('/api/chaumeil/otis/bordereau/:id', auth.requiresLogin, function (req, res) {
		var blId = req.query.bl;

		var latex = require('../controllers/latex');
		if (req.params.id) {
			latex.loadModel("bordereau_otis.tex", function (err, tex) {

				OrderModel.findOne({_id: req.params.id}, function (err, doc) {
					//SocieteModel.findOne({_id: doc.fournisseur.id}, function(err, societe) {
					//	if (societe == null)
					//		return res.send(403, "Le sous-traitant n'a pas ete trouve");

					//console.log(doc);

					// replacement des variables
					tex = tex.replace(/--REFERENCE--/g, doc.optional.projet);
					var text = "\\textbf{" + doc.bl[blId].name + "} \\\\ ";
					if (doc.bl[blId].contact)
						text += doc.bl[blId].contact + "\\\\";
					text += " \\hspace{0.5cm} " + doc.bl[blId].address + "\\\\ \\textsc{" + doc.bl[blId].zip + " " + doc.bl[blId].town + "}";
					tex = tex.replace(/--DESTINATAIRE--/g, text);
					tex = tex.replace(/--NUMAFFAIRE--/g, doc.optional.DOE);
					//tex = tex.replace(/--TOTO--/g, req.user.firstname + " " + req.user.lastname);
					tex = tex.replace(/--DATEC--/g, dateFormat(doc.datec, "dd/mm/yyyy"));
					tex = tex.replace(/--PAGE--/g, doc.bl[blId].products[0].qty);
					tex = tex.replace(/--CD--/g, doc.bl[blId].products[1].qty);
					//tex = tex.replace(/--MONTANT--/g, doc.total_soustraitant);
					//tex = tex.replace(/--CHARGESEXT--/g, doc.chargesExt);
					//tex = tex.replace(/--ZONEDEPART--/g, doc.from.zip + " " + doc.from.town + " " + doc.from.country_id);
					//tex = tex.replace(/--ZONEARRIVE--/g, doc.to.zip + " " + doc.to.town + " " + doc.to.country_id);
					//console.log(doc);

					//latex.headfoot(req.user.entity, tex, function(tex) {

					var docLatex = {};
					docLatex.data = new Buffer(tex);
					docLatex.createdAt = new Date();
					docLatex.title = "OTIS " + doc.ref_client;

					//doc.save(function(err) {
					//	if (err) {
					//		console.save("Error while trying to save this document");
					//		res.send(403, "Error while trying to save this document");
					//	}

					latex.compileDoc(doc._id, docLatex, function (result) {
						if (result.errors.length) { 			 	 				//console.log(pdf);
							return res.send(500, result.errors);
						}

						latex.getPDF(result.compiledDocId, function (err, pdfPath) {
							//console.log(pdfPath);
							res.type('application/pdf');
							res.attachment(doc.ref + "_bordereau_destinataire" + (parseInt(blId) + 1) + ".pdf"); // for douwnloading
							res.sendfile(pdfPath);
						});

						//res.send(200, result.compiledDocURI);
					});
					//});
					//});
				});
			});
			//});
		} else
			res.send(403, "Not Found");
	});

	app.get('/api/chaumeil/entity', function (req, res) {
		var list_cp = {
			"01": "Lyon",
			"02": "Colombes",
			"07": "Lyon",
			"08": "Ivry",
			"10": "Ivry",
			"14": "Colombes",
			"21": "Lyon",
			"22": "Colombes",
			"25": "Ivry",
			"26": "Lyon",
			"27": "Colombes",
			"29": "Colombes",
			"35": "Colombes",
			"38": "Lyon",
			"39": "Ivry",
			"42": "Lyon",
			"50": "Colombes",
			"51": "Ivry",
			"52": "Ivry",
			"54": "Ivry",
			"55": "Ivry",
			"56": "Colombes",
			"57": "Ivry",
			"58": "Lyon",
			"59": "Colombes",
			"60": "Colombes",
			"61": "Colombes",
			"62": "Colombes",
			"67": "Ivry",
			"68": "Ivry",
			"69": "Lyon",
			"70": "Ivry",
			"71": "Lyon",
			"73": "Lyon",
			"74": "Lyon",
			"75": {
				"Colombes": ["75001", "75002", "75008", "75009", "75010", "75016", "75017", "75018", "75019"],
				"Ivry": ["75003", "75004", "75005", "75006", "75007", "75011", "75012", "75013", "75014", "75015", "75020"]
			},
			"76": "Colombes",
			"77": "Ivry",
			"78": "Colombes",
			"80": "Colombes",
			"88": "Ivry",
			"89": "Lyon",
			"90": "Ivry",
			"91": "Ivry",
			"92": {
				"Colombes": ["92600", "92270", "92110", "92700", "92400", "92250", "92230", "92300", "92190", "92000", "92200", "92800", "92500", "92210", "92150", "92390", "92100", "92340", "92370", "92380", "92430", "92190", "92310", "92420", "92410"],
				"Ivry": ["92130", "92170", "92240", "92120", "92220", "92330", "92140", "92320", "92260", "92160", "92350", "92290"]
			},
			"93": {
				"Colombes": ["93800", "93450", "93300", "93600", "93150", "93000", "93350", "93470", "93120", "93700", "93440", "93190", "93500", "93320", "93380", "93200", "93400", "93270", "93240", "93290", "93410", "93420", "93430"],
				"Ivry": ["93260", "93170", "93100", "93310", "93230", "93130", "93140", "93390", "93370", "93110", "93250", "93360", "93330", "93340", "93220", "93460", "93160"]
			},
			"94": "Ivry",
			"95": "Colombes"
		};

		SocieteModel.find({entity: "ALL", name: {$ne: "Accueil"}}, {}, {limit: 10000}, function (err, societes) {
			if (societes && societes.length) {
				console.log("Count : " + societes.length);
				societes.forEach(function (societe) {
					societe.zip = societe.zip.trim();

					if (list_cp[societe.zip.substr(0, 2)]) {
						//console.log("1");
						// code postal found
						if (typeof list_cp[societe.zip.substr(0, 2)] === 'object') {
							// est dans le 75
							//console.log("75");
							for (var i in list_cp[societe.zip.substr(0, 2)]) {
								if (list_cp[societe.zip.substr(0, 2)][i].indexOf(societe.zip) > -1) {
									societe.entity = i.toLowerCase();
									console.log("found");
								}
							}
							//console.log(this.mail_object.to[1].address);
						} else {
							//console.log("france");
							// reste de la france
							societe.entity = list_cp[societe.zip.substr(0, 2)];
						}

						societe.save(function (err, doc) {
							console.log("save");
						});
					}
				});
				res.send(200, "Found " + societes.length);
			} else {
				res.send(200, "Not Found");
			}
		});
	});

	app.get('/api/chaumeil/dsf', function (req, res) {
		var Connection = require('tedious').Connection;

		var configDB = {
			userName: 'SA',
			password: 'SQLPWD',
			server: 'dsf1',
			options: {
				database: "DSF2008",
				instanceName: "DSF2008"
			}
		};

		var connection = new Connection(configDB);

		connection.on('connect', function (err) {
			if (err) {
				console.log(err);
				return;
			}

			var query = "";
			//query = "SELECT " + keysearch;
			//query += " FROM dbo." + table;
			//query += " WHERE " + key + "='" + value.Id + "'";

			//query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE Table_Type='BASE TABLE'";
			//query = " select *  from information_schema.columns where table_name = 'Orders'  order by ordinal_position";
			//query = "exec sp_help Orders";
			//query = "SELECT * from dbo.OrderViewEntries WHERE OrderId = 132"
			//query = "SELECT * from dbo.ManagementInformationSystems";// WHERE OrderId = 132";
			//query = "UPDATE dbo.OrderViewEntries SET IsLocked = 0 WHERE OrderId = 132"
			query = "UPDATE dbo.orders SET orderstatusid=163 WHERE OrderId = 132";

			console.log(query);

			var Request = require('tedious').Request;
			var request = new Request(query, function (err, rowCount) {
				if (err) {
					console.log("sql: ", err);
				} else {
					//console.log(rowCount + ' rows');
				}

				connection.close();
			});

			request.on('row', function (columns) {
				//console.log(columns);
				columns.forEach(function (column) {
					//if (column.value === null) {
					//	console.log('NULL');
					//} else {
					//console.log(query);
					console.log(column.metadata.colName + " : " + column.value);
					//cb(column.value);
					//}
				});
			});

			request.on('done', function (rowCount, more) {
				console.log(rowCount + ' rows returned');
			});

			// In SQL Server 2000 you may need: connection.execSqlBatch(request);
			connection.execSql(request);

		});

		connection.on('end', function (err) {
			if (err) {
				console.log(err);
				return;
			}
			//callback();
			res.send("closed");
		});
	});

	app.post('/api/chaumeil/import/cvp_client/:entity', /*ensureAuthenticated,*/ function (req, res) {

		req.connection.setTimeout(300000);

		var conv = [
			"code_client",
			"name1",
			"name",
			"address",
			"address1",
			'zip',
			"town",
			false,
			"phone",
			"fax",
			"phone_mobile",
			false,
			"contact_email",
			"lastname",
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			"mode_reglement", //Mode de reglement ?
			"rib.bank",
			"rib.etab",
			"rib.guichet",
			"rib.compte",
			"rib.cle",
			"notes",
			"code_compta",
			"idprof6", // TVA intra
			false,
			false,
			"segmentation",
			"commercial_id",
			false,
			false,
			false,
			false,
			"groupDelivery", // regroupement de BL A = Aucun une facture par BL , C = une facture par client, F = une Facture par commande 
			false,
			"groupOrder", // regroupement de commande A = Aucun, C = une facture par client
			false,
			"blocked", //Compte bloque
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			"datec",
			false,
			"soldeOut", // situation comptable
			false,
			false,
			"feeBilling", // frais de facturation
			"en_compte", // Toujours / Jamais
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			"NOUVEAU",
			false,
			false,
			false,
			false,
			false,
			false,
			"idprof3",
			"idprof1",
			"idprof2",
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			"dateLastStatus",
			false,
			"typent_id"
		];

		var conv_id = {
			clermont: {
				typent_id: {
					"N": "TE_ETABL",
					"O": "TE_PUBLIC"
				},
				en_compte: {
					"T": true,
					"J": false
				},
				segmentation: {
					"": "",
					"1.": "ARCHITECTE",
					"10.": "SERIGRAPHE",
					"11.": "REPROGRAPHE",
					"15.": "ADMINISTRATION",
					"16.": "ASSOCIATION",
					"17.": "EDITEUR",
					"18.": "AGENCE IMMOBILIERE",
					"19.": "MAIRIE",
					"2.": "MAITRE D'OUVRAGE",
					"20.": "UNIVERSITE",
					"21.": "AVOCATS ET CABINETS JURIDIQUES",
					"22.": "LABORATOIRES",
					"23.": "HOTELLERIE RESTAURATION",
					"24.": "INDUSTRIES",
					"25.": "FORMATION",
					"26.": "COMMERCES",
					"27.": "PARTICULIER",
					"28.": "TOURISME ET LOISIRS",
					"29.": "TRANSPORTEURS",
					"3.": "GEOMETRE",
					"30.": "CULTURE",
					"31.": "BANQUES ASSURANCES",
					"32.": "SANTE",
					"33.": "PRESTATAIRE DE SERVICE",
					"34.": "CG63",
					"35.": "GFC RA AUVERGNE",
					"36.": "LA POSTE",
					"37.": "ZODIAK",
					"38.": "VILLE DE CLERMONT",
					"39.": "INRAP IMAGERIE",
					"4.": "BUREAU D'ETUDE PRIVE",
					"40.": "INRAP",
					"41.": "SNCF",
					"42.": "LEON GROSSE",
					"43.": "GDF SUEZ",
					"44.": "LIMAGRAIN",
					"45.": "EDF",
					"46.": "EDF LOT4 NANTES",
					"47.": "EDF LOT8 BRIVE",
					"5.": "BUREAU D'ETUDE INDUSTRIE",
					"50.": "EIFFAGE CONSTRUCTION",
					"51.": "EIFFAGE ENERGIE",
					"52.": "EIFFAGE CONCESSIONS",
					"53.": "EIFFAGE CONSTRUCT METALLIQUE",
					"54.": "EIFFAGE TRAVAUX PUBLICS",
					"55.": "EIFFAGE URBALAD",
					"6.": "BUREAU D'ETUDE ADMINISTRATION",
					"60.": "HORS MARCHE UGAP",
					"7.": "ENTREPRISE BTP",
					"70.": "VINCI",
					"71.": "VINCI FILIALE",
					"8.": "AGENCE COM GRAPHISTE",
					"80.": "BOUYGUES",
					"9.": "IMPRIMEUR"
				},
				commercial_id: {
					"": {},
					"1": {
						id: "user:marc",
						name: "Marc NOINSKI"
					},
					"10": {
						id: "user:david",
						name: "David MARQUILLIE"
					},
					"12": {
						id: "user:davidg",
						name: "David GRELICHE"
					},
					"14": {
						id: "user:amelie",
						name: "Amelie REBOURS"
					},
					"18": {},
					"2": {
						id: "user:davidc",
						name: "David CLERMONTOIS"
					},
					"3": {
						id: "user:celine",
						name: "Celine LACQUIT"
					},
					"4": {
						id: "user:lionel",
						name: "Lionel CHAUMEIL"
					},
					"5": {
						id: "user:virginie",
						name: "Virginie KALSRON"
					},
					"6": {},
					"7": {},
					"9": {}
				},
				mode_reglement: {
					"": {reglt: "CHQ", cond: "RECEP"},
					"1": {reglt: "LIQ", cond: "RECEP"},
					"2": {
						reglt: "CHQ",
						cond: "RECEP"
					},
					"3": {
						reglt: "CHQ",
						cond: "30D"
					},
					"4": {
						reglt: "VIR",
						cond: "30D"
					},
					"5": {
						reglt: "TRA",
						cond: "30D"
					},
					"6": {
						reglt: "CHQ",
						cond: "60D"
					},
					"7": {
						reglt: "VIR",
						cond: "60D"
					},
					"8": {
						reglt: "TRA",
						cond: "60D"
					},
					"9": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"10": {
						reglt: "VIR",
						cond: "60D10"
					},
					"11": {
						reglt: "TRA",
						cond: "60D10"
					},
					"12": {
						reglt: "CHQ",
						cond: "60D15"
					},
					"13": {
						reglt: "VIR",
						cond: "60D15"
					},
					"14": {
						reglt: "TRA",
						cond: "60D15"
					},
					"15": {
						reglt: "CHQ",
						cond: "90D"
					},
					"16": {
						reglt: "VIR",
						cond: "90D"
					},
					"17": {
						reglt: "TRA",
						cond: "90D"
					},
					"18": {
						reglt: "CHQ",
						cond: "60DENDMONTH"
					},
					"19": {
						reglt: "TRA",
						cond: "90D10"
					},
					"20": {
						reglt: "TRA",
						cond: "90D15"
					},
					"21": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"22": {
						reglt: "TRA",
						cond: "RECEP"
					},
					"23": {
						reglt: "CHQ",
						cond: "45DENDMONTH"
					},
					"24": {
						reglt: "CHQ",
						cond: "60D5"
					},
					"25": {
						reglt: "CHQ",
						cond: "30DENDMONTH"
					},
					"26": {
						reglt: "VIR",
						cond: "45D"
					},
					"27": {
						reglt: "VIR",
						cond: "30D10"
					},
					"28": {
						reglt: "TRA",
						cond: "90D20"
					},
					"29": {
						reglt: "VIR",
						cond: "30DENDMONTH"
					},
					"30": {
						reglt: "VIR",
						cond: "90D20"
					},
					"31": {
						reglt: "CHQ",
						cond: "30D10"
					},
					"32": {
						reglt: "VIR",
						cond: "90D10"
					},
					"33": {
						reglt: "TRA",
						cond: "90DENDMONTH"
					},
					"34": {
						reglt: "CB",
						cond: "RECEP"
					},
					"35": {
						reglt: "TRA",
						cond: "60DENDMONTH"
					},
					"36": {
						reglt: "TRA",
						cond: "60D10"
					},
					"37": {
						reglt: "CHQ",
						cond: "45D"
					},
					"38": {
						reglt: "VIR",
						cond: "60DENDMONTH"
					},
					"39": {
						reglt: "TRA",
						cond: "60D20"
					},
					"40": {
						reglt: "TRA",
						cond: "30D10"
					},
					"41": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"42": {
						reglt: "TRA",
						cond: "30DENDMONTH"
					},
					"43": {
						reglt: "CR",
						cond: "RECEP"
					},
					"44": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"45": {
						reglt: "CHQ",
						cond: "30D15"
					},
					"46": {
						reglt: "VIR",
						cond: "60D15"
					},
					"47": {
						reglt: "VIR",
						cond: "90D10"
					},
					"48": {
						reglt: "TRA",
						cond: "60D15"
					},
					"49": {
						reglt: "TRA",
						cond: "90D10"
					},
					"50": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"51": {
						reglt: "VIR",
						cond: "30D10"
					},
					"52": {
						reglt: "VIR",
						cond: "RECEP"
					},
					"53": {
						reglt: "CHQ",
						cond: "90D5"
					},
					"54": {
						reglt: "VIR",
						cond: "90DENDMONTH"
					},
					"55": {
						reglt: "VIR",
						cond: "RECEP"
					},
					"56": {
						reglt: "CHQ",
						cond: "90DENDMONTH"
					},
					"57": {
						reglt: "PRE",
						cond: "30D"
					},
					"58": {
						reglt: "PRE",
						cond: "60D10"
					},
					"59": {
						reglt: "PRE",
						cond: "60D"
					},
					"60": {
						reglt: "CHQ",
						cond: "30D15"
					},
					"61": {
						reglt: "VIR",
						cond: "30D5"
					},
					"62": {
						reglt: "VIR",
						cond: "60D10"
					},
					"63": {
						reglt: "VIR",
						cond: "30D25"
					},
					"64": {
						reglt: "CHQ",
						cond: "10DENDMONTH"
					},
					"65": {
						reglt: "CHQ",
						cond: "90D20"
					},
					"66": {
						reglt: "TRA",
						cond: "45DENDMONTH"
					},
					"67": {
						reglt: "TRA",
						cond: "45D"
					},
					"68": {
						reglt: "TRA",
						cond: "30D15"
					},
					"69": {
						reglt: "VIR",
						cond: "45DENDMONTH"
					},
					"70": {
						reglt: "CHQ",
						cond: "40D"
					},
					"71": {
						reglt: "VIR",
						cond: "30D15"
					},
					"72": {
						reglt: "VIR",
						cond: "10D"
					},
					"73": {
						reglt: "VIR",
						cond: "30D15"
					},
					"74": {
						reglt: "CHQ",
						cond: "8D"
					},
					"75": {
						reglt: "CHQ",
						cond: "20D"
					},
					"DON": {
						reglt: "LIQ",
						cond: "RECEP"
					}
				}
			},
			colombes: {
				typent_id: {
					"N": "TE_ETABL",
					"O": "TE_PUBLIC"
				},
				en_compte: {
					"T": true,
					"J": false
				},
				segmentation: {
					"": "",
					"1.": "ARCHITECTE",
					"10.": "SERIGRAPHE",
					"11.": "REPROGRAPHE",
					"15.": "ADMINISTRATION",
					"16.": "ASSOCIATION",
					"17.": "EDITEUR",
					"18.": "AGENCE IMMOBILIERE",
					"19.": "MAIRIE",
					"2.": "MAITRE D'OUVRAGE",
					"20.": "UNIVERSITE",
					"21.": "AVOCATS ET CABINETS JURIDIQUES",
					"22.": "LABORATOIRES",
					"23.": "HOTELLERIE RESTAURATION",
					"24.": "INDUSTRIES",
					"25.": "FORMATION",
					"26.": "COMMERCES",
					"27.": "PARTICULIER",
					"28.": "TOURISME ET LOISIRS",
					"29.": "TRANSPORTEURS",
					"3.": "GEOMETRE",
					"30.": "CULTURE",
					"31.": "BANQUES ASSURANCES",
					"32.": "SANTE",
					"33.": "PRESTATAIRE DE SERVICE",
					"34.": "GROUPE FAYAT",
					"35.": "GFC RA AUVERGNE",
					"4.": "BUREAU D'ETUDE PRIVE",
					"40.": "AREVa",
					"41.": "SNCF",
					"42.": "LEON GROSSE",
					"43.": "GDF SUEZ",
					"45.": "EDF LOT1 IDF",
					"46.": "EDF LOT6 BASSE NORMANDIE",
					"47.": "EDF LOT7 LILLE",
					"5.": "BUREAU D'ETUDE INDUSTRIE",
					"50.": "EIFFAGE CONSTRUCTION",
					"51.": "EIFFAGE ENERGIE",
					"52.": "EIFFAGE CONCESSIONS",
					"53.": "EIFFAGE CONSTRUCT METALLIQUE",
					"54.": "EIFFAGE TRAVAUX PUBLICS",
					"55.": "EIFFAGE URBALAD",
					"6.": "BUREAU D'ETUDE ADMINISTRATION",
					"7.": "ENTREPRISE BTP",
					"70.": "VINCI",
					"71.": "VINCI FILIALE",
					"72.": "VINCI ARENA",
					"73.": "VEOLIA",
					"75.": "VILLE DE PARIS",
					"76.": "DEPARTEMENT DE PARIS",
					"8.": "AGENCE COM GRAPHISTE",
					"80.": "BOUYGUES",
					"9.": "IMPRIMEUR"
				},
				commercial_id: {
					"": {},
					"14": {
						id: "user:brunom",
						name: "Bruno MEZENCE"
					},
					"18": {},
					"20": {
						id: "user:sylvain",
						name: "Sylvain ROUX"
					},
					"21": {
						id: "user:patrick",
						name: "Patrick GORE"
					},
					"22": {
						id: "user:karim",
						name: "Karim BOUKERROU"
					},
					"23": {
						id: "user:olivierc",
						name: "Olivier CHARRAS"
					},
					"24": {
						id: "user:mickael",
						name: "Mickaël MARTINS"
					},
					"3": {
						id: "user:nathalie",
						name: "Nathalie BATTE"
					},
					"6": {
						id: "user:fadia",
						name: "Fadia MEDJAHEDI"
					}
				},
				mode_reglement: {
					"": {reglt: "CHQ", cond: "RECEP"},
					"1": {reglt: "LIQ", cond: "RECEP"},
					"2": {
						reglt: "CHQ",
						cond: "RECEP"
					},
					"3": {
						reglt: "CHQ",
						cond: "30D"
					},
					"4": {
						reglt: "VIR",
						cond: "30D"
					},
					"5": {
						reglt: "TRA",
						cond: "30D"
					},
					"6": {
						reglt: "CHQ",
						cond: "60D"
					},
					"7": {
						reglt: "VIR",
						cond: "60D"
					},
					"8": {
						reglt: "TRA",
						cond: "60D"
					},
					"9": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"10": {
						reglt: "VIR",
						cond: "60D10"
					},
					"11": {
						reglt: "TRA",
						cond: "60D10"
					},
					"12": {
						reglt: "CHQ",
						cond: "60D15"
					},
					"13": {
						reglt: "VIR",
						cond: "60D15"
					},
					"14": {
						reglt: "TRA",
						cond: "60D15"
					},
					"15": {
						reglt: "CHQ",
						cond: "90D"
					},
					"16": {
						reglt: "VIR",
						cond: "90D"
					},
					"17": {
						reglt: "TRA",
						cond: "90D"
					},
					"18": {
						reglt: "CHQ",
						cond: "60DENDMONTH"
					},
					"19": {
						reglt: "TRA",
						cond: "90D10"
					},
					"20": {
						reglt: "TRA",
						cond: "90D15"
					},
					"21": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"22": {
						reglt: "TRA",
						cond: "RECEP"
					},
					"23": {
						reglt: "CHQ",
						cond: "45DENDMONTH"
					},
					"24": {
						reglt: "CHQ",
						cond: "60D5"
					},
					"25": {
						reglt: "CHQ",
						cond: "30DENDMONTH"
					},
					"26": {
						reglt: "VIR",
						cond: "45D"
					},
					"27": {
						reglt: "VIR",
						cond: "30D10"
					},
					"28": {
						reglt: "TRA",
						cond: "90D20"
					},
					"29": {
						reglt: "VIR",
						cond: "30DENDMONTH"
					},
					"30": {
						reglt: "VIR",
						cond: "90D20"
					},
					"31": {
						reglt: "CHQ",
						cond: "30D10"
					},
					"32": {
						reglt: "VIR",
						cond: "90D10"
					},
					"33": {
						reglt: "TRA",
						cond: "90DENDMONTH"
					},
					"34": {
						reglt: "CB",
						cond: "RECEP"
					},
					"35": {
						reglt: "TRA",
						cond: "60DENDMONTH"
					},
					"36": {
						reglt: "TRA",
						cond: "60D10"
					},
					"37": {
						reglt: "CHQ",
						cond: "45D"
					},
					"38": {
						reglt: "VIR",
						cond: "60DENDMONTH"
					},
					"39": {
						reglt: "TRA",
						cond: "60D20"
					},
					"40": {
						reglt: "TRA",
						cond: "30D10"
					},
					"41": {
						reglt: "CHQ",
						cond: "90D15"
					},
					"42": {
						reglt: "TRA",
						cond: "90D20"
					},
					"43": {
						reglt: "CR",
						cond: "RECEP"
					},
					"44": {
						reglt: "VIR",
						cond: "60D10"
					},
					"45": {
						reglt: "CHQ",
						cond: "60D20"
					},
					"46": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"47": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"48": {
						reglt: "TRA",
						cond: "90D10"
					},
					"49": {
						reglt: "VIR",
						cond: "30D05"
					},
					"50": {
						reglt: "CHQ",
						cond: "90D20"
					},
					"51": {
						reglt: "CHQ",
						cond: "90DENDMONTH"
					},
					"52": {
						reglt: "CHQ",
						cond: "30D10"
					},
					"53": {
						reglt: "VIR",
						cond: "30D10"
					},
					"54": {
						reglt: "CHQ",
						cond: "60D20"
					},
					"55": {
						reglt: "VIR",
						cond: "60D20"
					},
					"56": {
						reglt: "VIR",
						cond: "120D"
					},
					"57": {
						reglt: "VIR",
						cond: "150D"
					},
					"58": {
						reglt: "VIR",
						cond: "180D"
					},
					"59": {
						reglt: "VIR",
						cond: "210D"
					},
					"60": {
						reglt: "VIR",
						cond: "240D"
					},
					"61": {
						reglt: "VIR",
						cond: "270D"
					},
					"62": {
						reglt: "VIR",
						cond: "300D"
					},
					"63": {
						reglt: "VIR",
						cond: "330D"
					},
					"64": {
						reglt: "VIR",
						cond: "360D"
					},
					"65": {
						reglt: "CHQ",
						cond: "30D15"
					},
					"66": {
						reglt: "VIR",
						cond: "70DENDMONTH"
					},
					"67": {
						reglt: "VIR",
						cond: "45DENDMONTH"
					},
					"68": {
						reglt: "TRA",
						cond: "45DENDMONTH"
					}
				}
			},
			ivry: {
				typent_id: {
					"N": "TE_ETABL",
					"O": "TE_PUBLIC"
				},
				en_compte: {
					"T": true,
					"J": false
				},
				segmentation: {
					"": "",
					"1.": "ARCHITECTE",
					"10.": "SERIGRAPHE",
					"11.": "REPROGRAPHE",
					"15.": "ADMINISTRATION",
					"16.": "ASSOCIATION",
					"17.": "EDITEUR",
					"18.": "AGENCE IMMOBILIERE",
					"19.": "MAIRIE",
					"2.": "MAITRE D'OUVRAGE",
					"20.": "UNIVERSITE",
					"21.": "AVOCATS ET CABINETS JURIDIQUES",
					"22.": "LABORATOIRES",
					"23.": "HOTELLERIE RESTAURATION",
					"24.": "INDUSTRIES",
					"25.": "FORMATION",
					"26.": "COMMERCES",
					"27.": "PARTICULIER",
					"28.": "TOURISME ET LOISIRS",
					"29.": "TRANSPORTEURS",
					"3.": "GEOMETRE",
					"30.": "CULTURE",
					"31.": "BANQUES ASSURANCES",
					"32.": "SANTE",
					"33.": "PRESTATAIRE DE SERVICE",
					"34.": "GROUPE FAYAT",
					"35.": "SPIE BATIGNOLLES",
					"37.": "MDH",
					"38.": "3F",
					"39.": "3F hm",
					"4.": "BUREAU D'ETUDE PRIVE",
					"40.": "AREVA",
					"41.": "SNCF",
					"42.": "LEON GROSSE",
					"43.": "GDF SUEZ",
					"45.": "EDF LOT1 IDF",
					"5.": "BUREAU D'ETUDE INDUSTRIE",
					"50.": "EIFFAGE CONSTRUCTION",
					"51.": "EIFFAGE ENERGIE",
					"52.": "EIFFAGE CONCESSIONS",
					"53.": "EIFFAGE CONSTRUCT METALLIQUE",
					"54.": "EIFFAGE TRAVAUX PUBLICS",
					"55.": "EIFFAGE URBALAD",
					"6.": "BUREAU D'ETUDE ADMINISTRATION",
					"7.": "ENTREPRISE BTP",
					"70.": "VINCI",
					"71.": "VINCI FILIALE",
					"72.": "VINCI ARENA",
					"75.": "VILLE DE PARIS",
					"76.": "DEPARTEMENT DE PARIS",
					"8.": "AGENCE COM GRAPHISTE",
					"80.": "BOUYGUES",
					"9.": "IMPRIMEUR"
				},
				commercial_id: {
					"": {},
					"1": {
						id: "user:sylvaind",
						name: "Sylvain DEBIEVRE"
					},
					"18": {},
					"19": {
						id: "user:oliviers",
						name: "Olivier STEFANI"
					},
					"2": {},
					"20": {
						id: "user:davy",
						name: "Davy MERCIER"
					},
					"21": {
						id: "user:maha",
						name: "Maha MAKHLOUF"
					},
					"3": {
						id: "user:nathalieg",
						name: "Nathalie GANDOIN"
					},
					"4": {
						id: "user:marianne",
						name: "Marianne LILLE"
					},
					"5": {
						id: "user:fabrice",
						name: "Fabrice UZAN"
					}
				},
				mode_reglement: {
					"": {reglt: "CHQ", cond: "RECEP"},
					"1": {reglt: "LIQ", cond: "RECEP"},
					"2": {
						reglt: "CHQ",
						cond: "RECEP"
					},
					"3": {
						reglt: "CHQ",
						cond: "30D"
					},
					"4": {
						reglt: "VIR",
						cond: "30D"
					},
					"5": {
						reglt: "TRA",
						cond: "30D"
					},
					"6": {
						reglt: "CHQ",
						cond: "60D"
					},
					"7": {
						reglt: "VIR",
						cond: "60D"
					},
					"8": {
						reglt: "TRA",
						cond: "60D"
					},
					"9": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"10": {
						reglt: "VIR",
						cond: "60D10"
					},
					"11": {
						reglt: "TRA",
						cond: "60D10"
					},
					"12": {
						reglt: "CHQ",
						cond: "60D15"
					},
					"13": {
						reglt: "VIR",
						cond: "60D15"
					},
					"14": {
						reglt: "TRA",
						cond: "60D15"
					},
					"15": {
						reglt: "CHQ",
						cond: "90D"
					},
					"16": {
						reglt: "VIR",
						cond: "90D"
					},
					"17": {
						reglt: "TRA",
						cond: "90D"
					},
					"18": {
						reglt: "CHQ",
						cond: "60DENDMONTH"
					},
					"19": {
						reglt: "TRA",
						cond: "90D10"
					},
					"20": {
						reglt: "TRA",
						cond: "90D15"
					},
					"21": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"22": {
						reglt: "TRA",
						cond: "RECEP"
					},
					"23": {
						reglt: "CHQ",
						cond: "45DENDMONTH"
					},
					"24": {
						reglt: "CHQ",
						cond: "60D5"
					},
					"25": {
						reglt: "CHQ",
						cond: "30DENDMONTH"
					},
					"26": {
						reglt: "VIR",
						cond: "45D"
					},
					"27": {
						reglt: "VIR",
						cond: "30D10"
					},
					"28": {
						reglt: "TRA",
						cond: "90D20"
					},
					"29": {
						reglt: "VIR",
						cond: "30DENDMONTH"
					},
					"30": {
						reglt: "VIR",
						cond: "90D20"
					},
					"31": {
						reglt: "CHQ",
						cond: "30D10"
					},
					"32": {
						reglt: "VIR",
						cond: "90D10"
					},
					"33": {
						reglt: "TRA",
						cond: "90DENDMONTH"
					},
					"34": {
						reglt: "CB",
						cond: "RECEP"
					},
					"35": {
						reglt: "TRA",
						cond: "60DENDMONTH"
					},
					"36": {
						reglt: "TRA",
						cond: "60D10"
					},
					"37": {
						reglt: "CHQ",
						cond: "45D"
					},
					"38": {
						reglt: "VIR",
						cond: "60DENDMONTH"
					},
					"39": {
						reglt: "TRA",
						cond: "60D20"
					},
					"40": {
						reglt: "TRA",
						cond: "30D10"
					},
					"41": {
						reglt: "CHQ",
						cond: "90D15"
					},
					"42": {
						reglt: "TRA",
						cond: "90D20"
					},
					"43": {
						reglt: "CR",
						cond: "RECEP"
					},
					"44": {
						reglt: "VIR",
						cond: "60D10"
					},
					"45": {
						reglt: "CHQ",
						cond: "60D20"
					},
					"46": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"47": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"48": {
						reglt: "TRA",
						cond: "90D10"
					},
					"49": {
						reglt: "VIR",
						cond: "30D05"
					},
					"50": {
						reglt: "CHQ",
						cond: "90D20"
					},
					"51": {
						reglt: "CHQ",
						cond: "90DENDMONTH"
					},
					"52": {
						reglt: "CHQ",
						cond: "30D10"
					},
					"53": {
						reglt: "VIR",
						cond: "30D10"
					},
					"54": {
						reglt: "CHQ",
						cond: "60D20"
					},
					"55": {
						reglt: "VIR",
						cond: "60D15"
					},
					"65": {
						reglt: "CHQ",
						cond: "30D15"
					},
					"66": {
						reglt: "VIR",
						cond: "70DENDMONTH"
					},
					"67": {
						reglt: "TRA",
						cond: "60DENDMONTH"
					},
					"68": {
						reglt: "VIR",
						cond: "45DENDMONTH"
					}
				}
			},
			lyon: {
				typent_id: {
					"N": "TE_ETABL",
					"O": "TE_PUBLIC"
				},
				en_compte: {
					"T": true,
					"J": false
				},
				segmentation: {
					"": "",
					"0": "",
					"1.": "ARCHITECTE",
					"10.": "SERIGRAPHE",
					"11.": "REPROGRAPHE",
					"15.": "ADMINISTRATION",
					"16.": "ASSOCIATION",
					"17.": "EDITEUR",
					"18.": "AGENCE IMMOBILIERE",
					"19.": "MAIRIE",
					"2.": "MAITRE D'OUVRAGE",
					"20.": "UNIVERSITE",
					"21.": "AVOCATS ET CABINETS JURIDIQUES",
					"22.": "LABORATOIRES",
					"23.": "HOTELLERIE RESTAURATION",
					"24.": "INDUSTRIES",
					"25.": "FORMATION",
					"26.": "COMMERCES",
					"27.": "PARTICULIER",
					"28.": "TOURISME ET LOISIRS",
					"29.": "TRANSPORTEURS",
					"3.": "GEOMETRE",
					"30.": "CULTURE",
					"31.": "BANQUES ASSURANCES",
					"32.": "SANTE",
					"33.": "PRESTATAIRE DE SERVICE",
					"34.": "GROUPE FAYAT",
					"35.": "GFC RA AUVERGNE",
					"36.": "GCC CH SANTHONAY",
					"37.": "LAGRANGE",
					"38.": "VILLE DE LYON",
					"39.": "VILLE DE LYON ACCORD CADRE",
					"4.": "BUREAU D'ETUDE PRIVE",
					"40.": "AREVA",
					"41.": "SNCF",
					"42.": "LEON GROSSE",
					"43.": "GDF SUEZ",
					"44.": "SOUS TRAITANT GFC TOUR INCITY",
					"45.": "EDF LOT2 GD LYON",
					"46.": "GFC TOUR INCITY",
					"47.": "GFC TOUR INCITY SOUS TRAITANT",
					"5.": "BUREAU D'ETUDE INDUSTRIE",
					"50.": "EIFFAGE CONSTRUCTION",
					"51.": "EIFFAGE ENERGIE",
					"52.": "EIFFAGE CONCESSIONS",
					"53.": "EIFFAGE CONSTRUCT METALLIQUE",
					"54.": "EIFFAGE TRAVAUX PUBLICS",
					"55.": "EIFFAGE URBALAD",
					"6.": "BUREAU D'ETUDE ADMINISTRATION",
					"7.": "ENTREPRISE BTP",
					"70.": "VINCI",
					"71.": "VINCI FILIALE",
					"72.": "VINCI ARENA",
					"75.": "VILLE DE PARIS",
					"76.": "DEPARTEMENT DE PARIS",
					"8.": "AGENCE COM GRAPHISTE",
					"80.": "BOUYGUES",
					"9.": "IMPRIMEUR"
				},
				commercial_id: {
					"": {},
					"10": {
						id: "user:marlene",
						name: "Marlene VIVERT"
					},
					"18": {},
					"19": {
						id: "user:loic",
						name: "Loïc VESTIDELLO"
					},
					"2": {
						id: "user:romain",
						name: "Romain PIERROTTET"
					},
					"20": {
						id: "user:cyril",
						name: "Cyril CARPENTIER"
					},
					"21": {
						id: "user:rosa",
						name: "Rosa PEREIRA"
					},
					"22": {
						id: "user:warda",
						name: "Warda M'SALLAK"
					},
					"3": {
						id: "user:ludovic",
						name: "Ludovic MUGNIER"
					}
				},
				mode_reglement: {
					"": {reglt: "CHQ", cond: "RECEP"},
					"1": {reglt: "LIQ", cond: "RECEP"},
					"2": {
						reglt: "CHQ",
						cond: "RECEP"
					},
					"3": {
						reglt: "CHQ",
						cond: "30D"
					},
					"4": {
						reglt: "VIR",
						cond: "30D"
					},
					"5": {
						reglt: "TRA",
						cond: "30D"
					},
					"6": {
						reglt: "CHQ",
						cond: "60D"
					},
					"7": {
						reglt: "VIR",
						cond: "60D"
					},
					"8": {
						reglt: "TRA",
						cond: "60D"
					},
					"9": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"10": {
						reglt: "VIR",
						cond: "60D10"
					},
					"11": {
						reglt: "TRA",
						cond: "60D10"
					},
					"12": {
						reglt: "CHQ",
						cond: "60D15"
					},
					"13": {
						reglt: "VIR",
						cond: "60D15"
					},
					"14": {
						reglt: "TRA",
						cond: "60D15"
					},
					"15": {
						reglt: "CHQ",
						cond: "90D"
					},
					"16": {
						reglt: "VIR",
						cond: "90D"
					},
					"17": {
						reglt: "TRA",
						cond: "90D"
					},
					"18": {
						reglt: "CHQ",
						cond: "60DENDMONTH"
					},
					"19": {
						reglt: "TRA",
						cond: "90D10"
					},
					"20": {
						reglt: "TRA",
						cond: "90D15"
					},
					"21": {
						reglt: "CHQ",
						cond: "90D10"
					},
					"22": {
						reglt: "TRA",
						cond: "RECEP"
					},
					"23": {
						reglt: "CHQ",
						cond: "45DENDMONTH"
					},
					"24": {
						reglt: "CHQ",
						cond: "60D5"
					},
					"25": {
						reglt: "CHQ",
						cond: "30DENDMONTH"
					},
					"26": {
						reglt: "VIR",
						cond: "45D"
					},
					"27": {
						reglt: "VIR",
						cond: "30D10"
					},
					"28": {
						reglt: "TRA",
						cond: "90D20"
					},
					"29": {
						reglt: "VIR",
						cond: "30DENDMONTH"
					},
					"30": {
						reglt: "VIR",
						cond: "90D20"
					},
					"31": {
						reglt: "CHQ",
						cond: "30D10"
					},
					"32": {
						reglt: "VIR",
						cond: "90D10"
					},
					"33": {
						reglt: "TRA",
						cond: "90DENDMONTH"
					},
					"34": {
						reglt: "CB",
						cond: "RECEP"
					},
					"35": {
						reglt: "TRA",
						cond: "60DENDMONTH"
					},
					"36": {
						reglt: "TRA",
						cond: "60D10"
					},
					"37": {
						reglt: "CHQ",
						cond: "45D"
					},
					"38": {
						reglt: "VIR",
						cond: "60DENDMONTH"
					},
					"39": {
						reglt: "TRA",
						cond: "60D20"
					},
					"40": {
						reglt: "TRA",
						cond: "30D10"
					},
					"41": {
						reglt: "CHQ",
						cond: "90D15"
					},
					"42": {
						reglt: "TRA",
						cond: "90D20"
					},
					"43": {
						reglt: "CR",
						cond: "RECEP"
					},
					"44": {
						reglt: "VIR",
						cond: "30D10"
					},
					"45": {
						reglt: "CHQ",
						cond: "60D20"
					},
					"46": {
						reglt: "CHQ",
						cond: "60D15"
					},
					"47": {
						reglt: "CHQ",
						cond: "60D10"
					},
					"48": {
						reglt: "TRA",
						cond: "90D10"
					},
					"49": {
						reglt: "VIR",
						cond: "30D15"
					},
					"50": {
						reglt: "CHQ",
						cond: "90D15"
					},
					"51": {
						reglt: "VIR",
						cond: "45D15"
					},
					"52": {
						reglt: "VIR",
						cond: "60D10"
					},
					"53": {
						reglt: "VIR",
						cond: "45DENDMONTH"
					},
					"54": {
						reglt: "TRA",
						cond: "45DENDMONTH"
					},
					"55": {
						reglt: "VIR",
						cond: "30D15"
					}
				}
			}
		};

		var is_Array = [
			"segmentation"
		];

		var convertRow = function (row, index, cb) {
			var societe = {};
			//societe.typent_id = "TE_PUBLIC";
			societe.country_id = "FR";
			societe.fournisseur = "NO";
			societe.remise_client = 0;

			for (var i = 0; i < row.length; i++) {
				if (conv[i] === false)
					continue;

				if (conv[i] != "effectif_id" && typeof conv_id[req.params.entity][conv[i]] !== 'undefined') {

					if (conv[i] == "civilite" && conv_id[req.params.entity][conv[i]][row[i]] === undefined)
						row[i] = "";

					if (conv_id[req.params.entity][conv[i]][row[i]] === undefined) {
						console.log("error : unknown " + conv[i] + "->" + row[i] + " ligne " + index);
						for (var j = 0; j < row.length; j++)
							if (conv[j] != false)
								console.log(conv[j] + "->" + row[j])
						//return;
					}

					row[i] = conv_id[req.params.entity][conv[i]][row[i]];
				}

				switch (conv[i]) {
					case "code_client":
						switch (req.params.entity) {
							case "clermont":
								societe[conv[i]] = row[i] + "CF";
								societe.entity = "clermont";
								break;
							case "lyon":
								societe[conv[i]] = row[i] + "LY";
								societe.entity = "lyon";
								break;
							case "ivry":
								societe[conv[i]] = row[i] + "IV";
								societe.entity = "ivry";
								break;
							case "colombes":
								societe[conv[i]] = row[i] + "CO";
								societe.entity = "colombes";
								break;
						}
						break;
					case "name1":
						if (row[i])
							societe.name = row[i];
						break;
					case "name":
						if (row[i])
							if (societe.name)
								societe.name += " " + row[i];
							else
								societe.name = row[i];
						break;
					case "address1":
						if (row[i])
							societe.address += "\n" + row[i];
						break;
					case "BP":
						if (row[i]) {
							societe.address += "\n" + row[i].substr(0, row[i].indexOf(','));
						}
						break;
					case "segmentation" :
						if (row[i]) {
							if (typeof societe.segmentation != "array")
								;
							societe.segmentation = [];

							var seg = row[i].split(',');
							for (var j = 0; j < seg.length; j++) {
								seg[j] = seg[j].replace(/\./g, "");
								seg[j] = seg[j].trim();

								societe[conv[i]].push({text: seg[j]});
							}
						}
						break;
					case "notes":
						if (row[i]) {
							if (typeof societe.notes != "array")
								societe.notes = [];

							societe[conv[i]].push({
								author: {
									name: "Inconnu"
								},
								datec: new Date(0),
								note: row[i]
							});
						}

						break;
					case "capital" :
						if (row[i])
							societe[conv[i]] = parseInt(row[i].substr(0, row[i].indexOf(' ')));
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
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "idprof1":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "idprof3":
						if (row[i])
							societe[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "effectif_id":
						societe[conv[i]] = "EF0";

						for (var idx in conv_id[conv[i]]) {
							if (parseInt(idx) <= parseInt(row[i]))
								societe[conv[i]] = conv_id[conv[i]][idx];
						}
						break;
					case "groupDelivery" :
						if (row[i]) {
							if (row[i] == "C") {
								societe.groupOrder = true;
								societe.groupDelivery = true;
							}
							if (row[i] == "F") {
								societe.groupDelivery = true;
								societe.groupOrder = false;
							}
						}
						break;
					case "groupOrder" :
						if (row[i]) {
							if (row[i] == "C") {
								societe.groupOrder = true;
							}
						}

						break;
					case "datec":
						if (row[i]) {
							var dateHour = row[i].split(' ');
							var date = dateHour[0].split('/');

							//console.log(date);
							//console.log(row[i] + ":" + new Date(date[1] + '/' + date[0] + '/' + date[2] + " " + dateHour[1]));
							societe[conv[i]] = new Date(date[1] + '/' + date[0] + '/' + date[2] + " " + dateHour[1]);
						}
						break;
					case "soldeOut" :
						if (row[i]) {
							row[i] = row[i].replace(",", ".");
							societe[conv[i]] = parseFloat(row[i]);
						}
						break;
					case "feeBilling" :
						if (row[i]) {
							societe[conv[i]] = true;
						}
						break;
					case "rib.bank":
						if (row[i]) {
							societe.iban = {
								bank: row[i],
								iban: "FR76" + row[i + 1] + row[i + 2] + row[i + 3] + row[i + 4]
							};
						}
						break;
					case "mode_reglement":
						if (row[i]) {
							societe.mode_reglement = row[i].reglt;
							societe.cond_reglement = row[i].cond;
						}
						break;
					case "NOUVEAU":
						if (row[i] == 'O')
							societe.Status = "ST_CINF3";
						else {
							societe.Status = "ST_CFID"; // Fidele = Ancien Client
						}
						break;
					case "dateLastStatus" :
						if (row[i]) {
							var dateHour = row[i].split(' ');
							var date = dateHour[0].split('/');

							//console.log(date);
							//console.log(row[i] + ":" + new Date(date[1] + '/' + date[0] + '/' + date[2] + " " + dateHour[1]));
							societe[conv[i]] = new Date(date[1] + '/' + date[0] + '/' + date[2] + " " + dateHour[1]);
						} else
							societe[conv[i]] = new Date();
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

								for (var i = 0; i < tab.length; i++)
									//if (conv[i] !== false)
									console.log(i + ". " + tab[i] + "->" + conv[i]);

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

								if (!data.code_client) // Pas de SIRET
									return callback();

								var query;
								//console.log(data.idprof2);


								if (data.idprof2)
									query = {$or: [{code_client: data.code_client}, {idprof2: data.idprof2}]};
								else
									query = {code_client: data.code_client};


								SocieteModel.findOne(query, function (err, societe) {
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

									//console.log(data);
									societe = _.extend(societe, data);

									//console.log(row[10]);
									//console.log(societe);
									//console.log(societe.datec);
									//callback();
									//return;

									if (!alreadyImport)
										return societe.save(function (err, doc) {
											if (err)
												console.log("societe : " + JSON.stringify(err));

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
											contact.Status = "ST_ENABLE";

											//console.log(data);
											//if (data.contact_phone)
											//	contact.phone = data.contact_phone;
											//if (data.contact_fax)
											//	contact.fax = data.contact_fax;
											if (data.contact_email)
												contact.email = data.contact_email;

											//console.log(contact);

											if (!contact.lastname)
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

	app.post('/api/chaumeil/import/cvp_address/:entity', /*ensureAuthenticated,*/ function (req, res) {
		req.connection.setTimeout(600000);

		var conv = [
			"code_client",
			false,
			"name",
			"civilite",
			"interloc",
			"address",
			"address1",
			'zip',
			"town",
			false,
			"phone",
			"fax",
			"phone_mobile",
			"email",
			false,
			false,
			false,
			false,
			false
		];

		var conv_id = {
			civilite: {
				"": "NO",
				"MME": "MME",
				"MLLE": "MLE",
				"M.": "MR",
				"MONSIEUR": "MR",
				"MADAME": "MME",
				"COLONEL": "COLONEL",
				"DOCTEUR": "DR",
				"GENERAL": "GENERAL",
				"PROFESSEUR": "PROF"
			}
		};

		var is_Array = [
			"tag"
		];

		var convertRow = function (tab, row, index, cb) {
			var contact = {
				Status: "ST_ENABLE",
				tag: []
			};
			contact.country_id = "FR";

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
					case "code_client":
						switch (req.params.entity) {
							case "clermont":
								contact[conv[i]] = row[i] + "CF";
								contact.entity = "clermont";
								break;
							case "lyon":
								contact[conv[i]] = row[i] + "LY";
								contact.entity = "lyon";
								break;
							case "ivry":
								contact[conv[i]] = row[i] + "IV";
								contact.entity = "ivry";
								break;
							case "colombes":
								contact[conv[i]] = row[i] + "CO";
								contact.entity = "colombes";
								break;
						}
						break;
					case "name" :
						contact.lastname = row[i];
						var name = row[i].split(" ");
						contact.lastname = name[0];

						if (name[1]) {
							contact.firstname = name[1];
							for (var j = 2; j < name.length; j++)
								contact.firstname += " " + name[j];
						}

						break;
					case "interloc" :
						if (row[i]) {
							contact.lastname = row[i];
							var name = row[i].split(" ");
							contact.lastname = name[0];

							if (name[1]) {
								contact.firstname = name[1];
								for (var j = 2; j < name.length; j++)
									contact.firstname += " " + name[j];
							}
						}
						break;
					case "address1":
						if (row[i])
							contact.address += "\n" + row[i];
						break;
					case "phone":
						if (row[i])
							contact[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "fax":
						if (row[i])
							contact[conv[i]] = row[i].replace(/ /g, "");
						break;
					default :
						if (row[i])
							contact[conv[i]] = row[i];
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

								for (var i = 0; i < tab.length; i++)
									//if (conv[i] !== false)
									console.log(i + ". " + tab[i] + "->" + conv[i]);

								return callback();
							}
							//console.log(tab);
							//console.log(row);

							//console.log(row[0]);

							//return;

							convertRow(tab, row, index, function (data) {

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
										} else
											contact = _.extend(contact, data);

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

	app.post('/api/chaumeil/import/cvp_contact/:entity', /*ensureAuthenticated,*/ function (req, res) {
		req.connection.setTimeout(300000);

		var conv = [
			"code_client",
			false,
			"civilite",
			"name",
			"poste",
			"phone",
			"fax",
			"phone_mobile",
			"email",
			false,
			false
		];

		var conv_id = {
			civilite: {
				"": "NO",
				"MME": "MME",
				"MLLE": "MLE",
				"M.": "MR",
				"MONSIEUR": "MR",
				"MADAME": "MME",
				"COLONEL": "COLONEL",
				"DOCTEUR": "DR",
				"GENERAL": "GENERAL",
				"PROFESSEUR": "PROF"
			}
		};

		var is_Array = [
			"tag"
		];

		var convertRow = function (tab, row, index, cb) {
			var contact = {
				Status: "ST_ENABLE",
				tag: []
			};
			contact.country_id = "FR";

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
					case "code_client":
						switch (req.params.entity) {
							case "clermont":
								contact[conv[i]] = row[i] + "CF";
								contact.entity = "clermont";
								break;
							case "lyon":
								contact[conv[i]] = row[i] + "LY";
								contact.entity = "lyon";
								break;
							case "ivry":
								contact[conv[i]] = row[i] + "IV";
								contact.entity = "ivry";
								break;
							case "colombes":
								contact[conv[i]] = row[i] + "CO";
								contact.entity = "colombes";
								break;
						}
						break;
					case "name" :
						contact.lastname = row[i];
						var name = row[i].split(" ");
						contact.lastname = name[0];

						if (name[1]) {
							contact.firstname = name[1];
							for (var j = 2; j < name.length; j++)
								contact.firstname += " " + name[j];
						}

						break;
					case "interloc" :
						if (row[i]) {
							contact.lastname = row[i];
							var name = row[i].split(" ");
							contact.lastname = name[0];

							if (name[1]) {
								contact.firstname = name[1];
								for (var j = 2; j < name.length; j++)
									contact.firstname += " " + name[j];
							}
						}
						break;
					case "address1":
						if (row[i])
							contact.address += "\n" + row[i];
						break;
					case "phone":
						if (row[i])
							contact[conv[i]] = row[i].replace(/ /g, "");
						break;
					case "fax":
						if (row[i])
							contact[conv[i]] = row[i].replace(/ /g, "");
						break;
					default :
						if (row[i])
							contact[conv[i]] = row[i];
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

								for (var i = 0; i < tab.length; i++)
									//if (conv[i] !== false)
									console.log(i + ". " + tab[i] + "->" + conv[i]);

								return callback();
							}
							//console.log(tab);
							//console.log(row);

							//console.log(row[0]);

							//return;

							convertRow(tab, row, index, function (data) {

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
										} else
											contact = _.extend(contact, data);

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

	//other routes..
};

function Planning() {
}

Planning.prototype = {
	/*create: function (req, res) {
	 var self = this;
	 var obj = JSON.parse(req.body.models);
	 obj = obj[0];
	 
	 delete obj._id; //Just for create
	 
	 var doc = new PlanningModel(obj);
	 //console.log(obj);
	 doc.step = obj.step.id;
	 //obj.Status.id = obj['Status.id'];
	 doc.Status = obj.Status.id;
	 
	 if (typeof obj.order === 'string') {
	 doc.order = {};
	 doc.order.name = obj.order;
	 obj.order = doc.order;
	 } else {
	 doc.order = obj.order;
	 }
	 
	 
	 if (typeof obj.societe === 'string') {
	 //res.type('html');
	 //res.send(500, "La societe n'existe pas");
	 //return;
	 doc.societe = {};
	 doc.societe.name = obj.societe;
	 obj.societe = doc.societe;
	 } else
	 doc.societe = obj.societe;
	 
	 var history = {};
	 history.Status = doc.Status;
	 history.step = doc.step;
	 history.tms = new Date().toISOString();
	 doc.history.push(history);
	 
	 doc.save(function (err, doc) {
	 if (err) {
	 console.log(err);
	 return;
	 }
	 obj._id = doc._id;
	 obj.Status.css = self.fk_extrafields.fields.planningStatus.values[obj.Status.id].cssClass;
	 obj.Status.name = self.fk_extrafields.fields.planningStatus.values[obj.Status.id].label;
	 obj.jobTicket = doc.jobTicket;
	 
	 res.send(200, obj);
	 });
	 },
	 read: function (req, res) {
	 var typeStatus = this.fk_extrafields.fields.planningStatus;
	 var typeStep = this.fk_extrafields.fields.planningStep;
	 
	 //console.log(req.query);
	 console.log(req.query.$sort);
	 
	 var query = {};
	 if (!req.query.history)
	 query = {
	 Status: {"$nin": ["CANCELED", "LIV", "REJECTED", "EXP"]}
	 };
	 
	 //filter by entity
	 query.entity = req.user.entity;
	 
	 var sort = {};
	 if (req.query.$sort) {
	 
	 var asc = 1;
	 if (req.query.$sort[0].dir === 'desc')
	 asc = -1;
	 
	 switch (req.query.$sort[0].field) {
	 case "societe" :
	 sort = {sort: [{'societe.name': asc}]};
	 break;
	 default :
	 sort.sort = [];
	 sort.sort[0] = {};
	 sort.sort[0][req.query.$sort[0].field] = asc;
	 }
	 }
	 
	 PlanningModel.find(query, "", sort, function (err, doc) {
	 if (err) {
	 console.log(err);
	 res.send(500, doc);
	 return;
	 }
	 
	 for (var i in doc) {
	 
	 var Status = {};
	 
	 Status.id = doc[i].Status;
	 if (typeStatus.values[Status.id]) {
	 Status.name = typeStatus.values[Status.id].label;
	 Status.css = typeStatus.values[Status.id].cssClass;
	 } else { // Value not present in extrafield
	 Status.name = Status.id;
	 Status.css = "";
	 }
	 
	 var step = doc[i].step;
	 doc[i].step = {};
	 doc[i].step.id = step;
	 doc[i].step.name = step;
	 
	 doc[i].Status = {};
	 doc[i].Status = Status;
	 delete doc[i].history; // a verifier si bien supprimer du json retour
	 }
	 //console.log(doc);
	 res.send(200, doc);
	 });
	 },
	 update: function (req, res) {
	 var self = this;
	 var obj = JSON.parse(req.body.models);
	 obj = obj[0];
	 
	 PlanningModel.findOne({_id: obj._id}, function (err, doc) {
	 if (err) { // Error
	 res.type('html');
	 res.send(500, err.label);
	 return;
	 }
	 console.log(obj);
	 
	 if (typeof obj.order === 'string') {
	 doc.order = {};
	 doc.order.name = obj.order;
	 obj.order = doc.order;
	 } else {
	 doc.order = obj.order;
	 }
	 
	 if (typeof obj.societe === 'string') {
	 //res.type('html');
	 //res.send(500, "La societe n'existe pas");
	 //return;
	 doc.societe = {};
	 doc.societe.name = obj.societe;
	 obj.societe = doc.societe;
	 } else
	 doc.societe = obj.societe;
	 
	 doc.qty = obj.qty;
	 doc.qtyPages = obj.qtyPages;
	 doc.date_livraison = obj.date_livraison;
	 doc.jobTicket = obj.jobTicket;
	 doc.description = obj.description;
	 
	 var oldStep = doc.step;
	 
	 if (obj.step !== null)
	 doc.step = obj.step.id;
	 else {
	 doc.step = "";
	 obj.step = {};
	 obj.step.name = "";
	 obj.step.id = "";
	 }
	 
	 //obj.Status.id = obj['Status.id'];
	 
	 var history = {};
	 if (doc.Status !== obj.Status.id || oldStep !== doc.step) { // mise a jour des status => history
	 doc.Status = obj.Status.id;
	 history.Status = doc.Status;
	 history.step = doc.step;
	 history.tms = new Date().toISOString();
	 }
	 
	 doc.entity = obj.entity;
	 
	 doc.save(function (err, doc) {
	 if (err) {
	 console.log(err);
	 return;
	 }
	 if (history.tms)
	 PlanningModel.update({_id: doc._id}, {'$push': {'history': history}}, function (err, res) {
	 if (err)
	 console.log(err);
	 
	 });
	 
	 obj.Status.css = self.fk_extrafields.fields.planningStatus.values[obj.Status.id].cssClass;
	 obj.Status.name = self.fk_extrafields.fields.planningStatus.values[obj.Status.id].label;
	 
	 res.send(200, obj);
	 });
	 });
	 },
	 */
	planningId: function (req, res, next, id) {
		try {
			PlanningModel.findOne({_id: id}, function (err, doc) {
				if (err)
					return next(err);
				if (!doc)
					return next(new Error('Failed to load a planning production ' + id));

				req.planningProd = doc;
				next();
			});
		} catch (e) {
			return next(e.message);
		}
	},
	create: function (req, res) {
		var planningProd = new PlanningModel(req.body);
		planningProd.author = {};
		planningProd.author.id = req.user._id;
		planningProd.author.name = req.user.name;

		planningProd.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(planningProd);
		});
	},
	read: function (req, res) {
		try {
			var query = {};

			if (req.query.findDelivery)
				query.date_livraison = {$gte: req.query.findDelivery};

			if (req.query.findStatus)
				query.Status = req.query.findStatus;

			query.entity = req.user.entity;

			PlanningModel.find(query, {}, {sort: {"date_livraison": -1}}, function (err, doc) {
				if (err) {
					console.log(err);
					res.send(500);
				}

				res.json(doc);

			});
		} catch (e) {
			console.log(e.message);
			res.send(500);
		}
	},
	show: function (req, res) {
		res.json(req.planningProd);
	},
	update: function (req, res) {
		var planningProd = req.planningProd;
		planningProd = _.extend(planningProd, req.body);

		planningProd.save(function (err, doc) {

			if (err) {
				return console.log(err);
			}

			res.json(200, doc);
		});
	},
	del: function (req, res) {
		var obj = JSON.parse(req.body.models);

		//console.log(obj);
		if (obj.length)
			for (var i in obj) {
				PlanningModel.remove({_id: obj[i]._id}, function (err) {
					if (err)
						console.log(err);
				});
			}

		res.send(200, {});
	}
};
////"use strict";
//
//var mongoose = require('mongoose'),
//        fs = require('fs'),
//        csv = require('csv'),
//        _ = require('lodash'),
//        gridfs = require('../controllers/gridfs'),
//        config = require('../../config/config');
//
//var PlanningModel = mongoose.model('chaumeil_planning');
//var Dict = require('../controllers/dict');
//
//module.exports = function (app, passport, auth) {
//
//    var planning = new Planning();
//
//    Dict.extrafield({extrafieldName: 'Chaumeil'}, function (err, doc) {
//        if (err) {
//            console.log(err);
//            return;
//        }
//
//        planning.fk_extrafields = doc;
//    });
//
//    app.get('/api/chaumeil/planning', auth.requiresLogin, planning.read);
//    app.get('/api/chaumeil/planning/:planningId', auth.requiresLogin, planning.show);
//    app.post('/api/chaumeil/planning', auth.requiresLogin, planning.create);
//    app.put('/api/chaumeil/planning/:planningId', auth.requiresLogin, planning.update);
//    app.put('/api/chaumeil/:planningId/:field', auth.requiresLogin, planning.updateField);
//    
//    app.param('planningId', planning.planningId);
//    
//};
//
//function Planning() {
//}
//
//Planning.prototype = {
//    planningId: function (req, res, next, id) {
//        try{
//            PlanningModel.findOne({_id: id}, function (err, doc) {
//                if (err)
//                    return next(err);
//                if (!doc)
//                    return next(new Error('Failed to load a planning production ' + id));
//
//                req.planningProd = doc;
//                next();
//        });        
//        }catch(e){
//            return next(e.message);
//        }
//    },
//    create: function (req, res) {
//        var planningProd = new PlanningModel(req.body);
//        planningProd.author = {};
//        planningProd.author.id = req.user._id;
//        planningProd.author.name = req.user.name;                
//                            
//        planningProd.save(function (err, doc) {
//            if (err) {
//                return console.log(err);
//            }
//
//            res.json(planningProd);
//        });
//    },
//    read: function (req, res) {
//        try{
//            var query = {};
//        
//        if (req.query.findDelivery)
//            query.date_livraison = {$gte: req.query.findDelivery};
//        
//        if (req.query.findStatus)
//            query.Status = req.query.findStatus;
//        
//        query.entity = req.user.entity;
//            
//        PlanningModel.find(query,{}, {sort: {"date_livraison": -1}}, function(err, doc){
//            if(err) {
//                console.log(err);
//                res.send(500);
//            }
//            
//            res.json(doc);
//
//        });
//        }catch(e){
//            console.log(e.message);
//            res.send(500);
//        }
//    },
//    show: function (req, res) {
//        res.json(req.planningProd);
//    },
//    update: function (req, res) {
//        var planningProd = req.planningProd;
//        planningProd = _.extend(planningProd, req.body);
//        
//        planningProd.save(function(err, doc) {
//            
//            if (err) {
//                return console.log(err);
//            }
//            
//            res.json(200, doc);
//        });
//    },
//    updateField: function (req, res) {
//        if (req.body.value) {
//            var planningProd = req.planningProd;
//
//            planningProd[req.params.field] = req.body.value;
//
//            planningProd.save(function (err, doc) {
//                res.json(doc);
//            });
//        } else
//            res.send(500);
//    }
//};
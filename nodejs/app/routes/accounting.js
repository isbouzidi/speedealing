"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		dateFormat = require('dateformat'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config'),
		async = require('async');

var BillModel = mongoose.model('bill');
var SocieteModel = mongoose.model('societe');
var ProductModel = mongoose.model('product');

var Dict = require('../controllers/dict');

var tva_code_collec = {};
Dict.dict({dictName: "fk_tva", object: true}, function (err, docs) {
	for (var i = 0; i < docs.values.length; i++) {
		if (docs.values[i].pays_code === 'FR' && docs.values[i].enable)
			tva_code_collec[docs.values[i].value] = docs.values[i].code_compta_colle;
		//console.log(docs.values[i]);
	}
	//tva_code = docs;
});

var globalConst = {};
Dict.dict({dictName: "const", object: true}, function (err, doc) {
	globalConst = doc.values;
	//console.log(doc);
});

module.exports = function (app, passport, auth) {

	var object = new Object();

	app.get('/api/accounting', auth.requiresLogin, object.read);
	app.post('/api/accounting', auth.requiresLogin, object.create);
	app.get('/api/accounting/list', auth.requiresLogin, object.getAccountsList);

	//other routes..
};

var round = function (value, decimals) {
	var val=Number(Math.round(value + 'e' + (decimals+1)) + 'e-' + (decimals+1));
	return Number(Math.round(val + 'e' + (decimals)) + 'e-' + (decimals));
};

//var val = 650.1445;
//val=1.0445;
//console.log(round(val,2));
//console.log(Math.round(val*100)/100);

function Object() {
}

Object.prototype = {
	read: function (req, res) {
		var dateStart = new Date(req.query.year, parseInt(req.query.month, 10) - 1, 1);
		var dateEnd = new Date(req.query.year, parseInt(req.query.month, 10), 1);

		var query = {
			entity: req.query.entity,
			total_ttc: {$ne: 0},
			datec: {'$gte': dateStart, '$lt': dateEnd},
			Status: {$ne: "DRAFT"}
		};

		var result = [];

		BillModel.find(query, "ref title client datec total_ttc total_tva lines", {sort: {datec: 1}}, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			async.eachSeries(doc, function (bill, callback) {

				//console.log(bill);

				SocieteModel.findOne({_id: bill.client.id}, "code_compta name", function (err, societe) {
					//console.log(societe);

					// ligne client
					var line = {
						datec: bill.datec,
						journal: globalConst.SELLS_JOURNAL || "VT",
						compte: societe.code_compta,
						piece: parseInt(bill.ref.substr(7), 10),
						libelle: bill.ref + " " + societe.name,
						debit: 0,
						credit: 0,
						monnaie: "E"
					};

					if (bill.total_ttc > 0)
						line.debit = bill.total_ttc;
					else
						line.credit = Math.abs(bill.total_ttc);

					result.push(line);

					async.each(bill.lines, function (lineBill, cb) {

						//lignes produit
						ProductModel.findOne({_id: lineBill.product.id}, "", function (err, product) {
							if (err)
								return cb(err);

							var line = {};

							if (product == null)
								line = {
									datec: bill.datec,
									journal: globalConst.SELLS_JOURNAL || "VT",
									compte: null,
									piece: parseInt(bill.ref.substr(7), 10),
									libelle: bill.ref + ' ' + lineBill.product.name + ' (INCONNU)',
									debit: 0,
									credit: 0,
									monnaie: "E"
								};
							else
								line = {
									datec: bill.datec,
									journal: globalConst.SELLS_JOURNAL || "VT",
									compte: product.compta_sell,
									piece: parseInt(bill.ref.substr(7), 10),
									libelle: bill.ref + " " + societe.name,
									debit: 0,
									credit: 0,
									monnaie: "E"
								};

							line.credit = lineBill.total_ht;

							//console.log(line);
							result.push(line);
							cb();
						});
					}, function (err) {
						if (err)
							return callback(err);

						//lignes TVA
						for (var i = 0; i < bill.total_tva.length; i++) {
							//console.log(bill.total_tva[i]);
							if (!tva_code_collec[bill.total_tva[i].tva_tx])
								console.log("Compta TVA inconnu : " + bill.total_tva[i].tva_tx);

							var line = {
								datec: bill.datec,
								journal: globalConst.SELLS_JOURNAL || "VT",
								compte: tva_code_collec[bill.total_tva[i].tva_tx],
								piece: parseInt(bill.ref.substr(7), 10),
								libelle: bill.ref + " " + societe.name,
								debit: 0,
								credit: 0,
								monnaie: "E"
							};

							line.credit = bill.total_tva[i].total;

							result.push(line);
						}

						callback();
					});
				});
			}, function (err) {
				if (err)
					console.log(err);
				//console.log(doc);

				if (req.query.csv) {
					var tab_csv = {};
					for (var i = 0; i < result.length; i++) {
						if (tab_csv[result[i].piece] == null) {
							tab_csv[result[i].piece] = {};
						}

						if (tab_csv[result[i].piece][result[i].compte] == null) {
							tab_csv[result[i].piece][result[i].compte] = result[i];
						} else {
							tab_csv[result[i].piece][result[i].compte].debit += result[i].debit;
							tab_csv[result[i].piece][result[i].compte].credit += result[i].credit;
						}
					}


					var out = "";

					//entete
					out += "DTOPE;NUMJL;NUMCP;NPIEC;LIBEC;MTDEB;MTCRE;MONNAIE_IDENT\n";

					var debit = 0;
					var credit = 0;

					for (var i in tab_csv) {
						for (var j in tab_csv[i]) {
							out += dateFormat(tab_csv[i][j].datec, "dd/mm/yyyy");
							out += ";" + tab_csv[i][j].journal;
							out += ";" + tab_csv[i][j].compte;
							out += ";" + tab_csv[i][j].piece;
							out += ";" + tab_csv[i][j].libelle;
							out += ";" + round(tab_csv[i][j].debit, 2);
							out += ";" + round(tab_csv[i][j].credit, 2);
							out += ";" + tab_csv[i][j].monnaie;
							out += "\n";

							debit += round(tab_csv[i][j].debit, 2);
							credit += round(tab_csv[i][j].credit, 2);
						}
					}

					console.log("Debit : " + debit);
					console.log("Credit : " + credit);

					res.attachment('VTE_' + dateStart.getFullYear().toString() + "_" + (dateStart.getMonth() + 1).toString() + ".csv");
					res.send(200, out);

				} else
					res.json(200, result);
			});
		});
	},
	create: function (req, res) {
		var bill = {};
		if (req.query.clone) {
			bill = req.bill.toObject();
			delete bill._id;
			delete bill.__v;
			delete bill.ref;
			delete bill.createdAt;
			delete bill.updatedAt;
			bill.Status = "DRAFT";
			bill.notes = [];
			bill.latex = {};
			bill.datec = new Date();

			bill = new BillModel(bill);
		} else
			bill = new BillModel(req.body);

		bill.author = {};
		bill.author.id = req.user._id;
		bill.author.name = req.user.name;

		if (!bill.entity)
			bill.entity = req.user.entity;

		//console.log(bill);
		bill.save(function (err, doc) {
			if (err) {
				return console.log(err);
			}

			res.json(bill);
		});
	},
	getAccountsList: function (req, res) {
		var csv = "";

		//entete
		csv += "NUMCP;LIBCP\n";

		async.series([
			function (callback) {
				var out = "";

				SocieteModel.find({$or: [{code_compta: {$ne: null}}, {code_compta_fournisseur: {$ne: null}}]}, {name: 1, Status: 1, fournisseur: 1, code_compta: 1, code_compta_fournisseur: 1}, function (err, rows) {
					if (err)
						console.log(err);

					//console.log(rows);

					for (var i = 0; i < rows.length; i++) {
						if (rows[i].Status !== 'ST_NEVER' && rows[i].code_compta) {
							out += rows[i].code_compta;
							out += ";" + rows[i].name;
							out += "\n";
						}

						if (rows[i].fournisseur !== 'NO' && rows[i].code_compta_fournisseur && rows[i].code_compta != rows[i].code_compta_fournisseur) {
							out += rows[i].code_compta_fournisseur;
							out += ";" + rows[i].name;
							out += "\n";
						}
					}

					callback(null, out);


				});
			}, function (callback) {
				var out = "";

				/*ProductModel.find({$or: [{compta_buy: {$ne: null}}, {compta_sell: {$ne: null}}]}, {ref: 1, compta_buy: 1, compta_sell: 1}, function (err, rows) {
				 if (err)
				 console.log(err);
				 
				 //console.log(rows);
				 
				 for (var i = 0; i < rows.length; i++) {
				 if (rows[i].compta_sell) {
				 out += rows[i].compta_sell;
				 out += ";" + rows[i].ref;
				 out += "\n";
				 }
				 
				 if (rows[i].compta_buy && rows[i].compta_buy != rows[i].compta_sell) {
				 out += rows[i].compta_buy;
				 out += ";" + rows[i].ref;
				 out += "\n";
				 }
				 }*/

				callback(null, out);
				//});
			}
		], function (err, results) {

			for (var i = 0; i < results.length; i++)
				csv += results[i];

			res.attachment('CPTLIST.csv');
			res.send(200, csv);
		});
	}
};

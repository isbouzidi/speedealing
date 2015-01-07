"use strict";

var mongoose = require('mongoose'),
		_ = require('lodash'),
		async = require('async'),
		i18n = require("i18next"),
		config = require('../../config/config');

var Dict = require('../controllers/dict');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var OrderModel = mongoose.model('commande');
var FactureModel = mongoose.model('bill');
var TicketModel = mongoose.model('ticket');
var LeadModel = mongoose.model('lead');
var ReportModel = mongoose.model('report');
var EntityModel = mongoose.model('entity');
var TaskModel = mongoose.model('task');
var UserModel = mongoose.model('user');
var GroupModel = mongoose.model('userGroup');

var typeAction = {};
Dict.dict({dictName: "fk_actioncomm", object: true}, function (err, docs) {
	if (docs) {
		typeAction = docs;
	}
});

module.exports = function (app, passport, auth) {

	app.get('/api/stats/ByEntity', auth.requiresLogin, function (req, res) {

		var entity = req.query.entity;

		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), parseInt(d.getMonth() - 1), 1);
		var dateEnd = new Date(d.getFullYear(), d.getMonth(), 1);

		function verifyResult(err, docs, cb) {
			// convert docs in an array
			if (err)
				return cb(err);

			if (docs.length === 0)
				return cb(null, [{_id: dateStart.getMonth() + 1, count: 0}, {_id: dateStart.getMonth() + 2, count: 0}]);

			if (docs.length == 1) {
				var result = [];
				if (docs[0]._id == dateStart.getMonth() + 1)
					result = [docs[0], {_id: dateStart.getMonth() + 2, count: 0}];
				else
					result = [{_id: dateStart.getMonth() + 1, count: 0}, docs[0]];

				return cb(null, result);
			}

			return cb(null, docs);
		}

		async.parallel({
			newAccounts: function (cb) {
				SocieteModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateStart}, "commercial_id.name": {$ne: null}}},
					{$project: {_id: 1, month: {$month: "$createdAt"}}},
					{$group: {_id: "$month", count: {$sum: 1}}},
					{$sort: {_id: 1}}
				], function (err, docs) {
					verifyResult(err, docs, cb);
				});
			},
			newOrders: function (cb) {
				OrderModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateStart}, "Status": {$nin: ["DRAFT", "CANCELED"]}}},
					{$project: {_id: 1, month: {$month: "$createdAt"}}},
					{$group: {_id: "$month", count: {$sum: 1}}},
					{$sort: {_id: 1}}
				], function (err, docs) {
					verifyResult(err, docs, cb);
				});
			},
			newTickets: function (cb) {
				TicketModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateStart}}},
					{$project: {_id: 1, month: {$month: "$createdAt"}}},
					{$group: {_id: "$month", count: {$sum: 1}}},
					{$sort: {_id: 1}}
				], function (err, docs) {
					verifyResult(err, docs, cb);
				});
			},
			newTasks: function (cb) {
				TaskModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateStart}}},
					{$project: {_id: 1, month: {$month: "$createdAt"}}},
					{$group: {_id: "$month", count: {$sum: 1}}},
					{$sort: {_id: 1}}
				], function (err, docs) {
					verifyResult(err, docs, cb);
				});
			},
			newLeads: function (cb) {
				LeadModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateStart}}},
					{$project: {_id: 1, month: {$month: "$createdAt"}}},
					{$group: {_id: "$month", count: {$sum: 1}}},
					{$sort: {_id: 1}}
				], function (err, docs) {
					verifyResult(err, docs, cb);
				});
			},
			taskStats: function (cb) {
				var dateS = new Date(dateStart);
				dateS.setMonth(dateS.getMonth() + 1);

				//console.log(dateS);
				TaskModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateS}, "usertodo.name": {$exists: true}}},
					{$project: {_id: 1, user: "$usertodo.name", type: 1}},
					{$group: {_id: {user: "$user", type: "$type"}, count: {$sum: 1}}},
					{$sort: {"_id.user": 1}}
				], function (err, docs) {
					//console.log(docs);

					for (var i = 0; i < docs.length; i++) {
						docs[i]._id.type = i18n.t(typeAction.lang + ":" + typeAction.values[docs[i]._id.type].label);
						//console.log(docs[i]._id.type);
					}

					//console.log(docs);

					cb(err, docs);
				});
			},
			objectif: function (cb) {
				/**
				 * Calucl des objectifs et suivi
				 * 1ere version tres fige sur les rdv mais demandera a etre retravaille en fonction des besoins
				 * 
				 */

				var dateS = new Date(dateStart);
				dateS.setMonth(dateS.getMonth());

				var dateE = new Date(dateEnd);
				dateE.setMonth(dateE.getMonth() + 1);

				async.parallel({
					user: function (cbb) {

						GroupModel.find({_id: {$in: ["group:commerciaux", "group:responsable_agence"]}}, "_id name objectifs", function (err, groups) {
							var objectif_group = {};

							for (var i = 0; i < groups.length; i++)
								objectif_group[groups[i]._id] = groups[i].objectifs;

							UserModel.find({groupe: {$in: ["group:commerciaux", "group:responsable_agence"]}, entity: entity}, "_id firstname lastname groupe", function (err, users) {

								var objectif_user = {};

								for (var i = 0; i < users.length; i++) {
									if (objectif_group[users[i].groupe] && objectif_group[users[i].groupe].rdv) {
										objectif_user[users[i]._id] = {
											name: users[i].firstname + " " + users[i].lastname,
											_id: users[i]._id,
											objectif: objectif_group[users[i].groupe].rdv.value, // valeur de l'objectif
											realised: [], // realise m-1, m
											doing: [] // prevu / planifie m-1,m
										};

										objectif_user[users[i]._id].realised[dateS.getMonth() + 1] = 0;
										objectif_user[users[i]._id].realised[dateS.getMonth() + 2] = 0;

										objectif_user[users[i]._id].doing[dateS.getMonth() + 1] = 0;
										objectif_user[users[i]._id].doing[dateS.getMonth() + 2] = 0;

									}
								}

								//console.log(objectif_user);
								cbb(err, objectif_user);
							});
						});
					},
					realised: function (cbb) {

						//console.log(dateS);
						ReportModel.aggregate([
							{$match: {entity: entity, dateReport: {$gte: dateS, $lt: dateE}, "author.id": {$exists: true}, model: {$in: ["DISCOVERY", "CONTRACT", "PRE-SIGN"]}}},
							{$project: {_id: 1, user: "$author.id", dateReport: 1}},
							{$group: {_id: {user: "$user", month: {$month: "$dateReport"}}, count: {$sum: 1}}},
							{$sort: {"_id.month": 1, "_id.user": 1}}
						], function (err, docs) {
							//console.log(docs);

							/*for (var i = 0; i < docs.length; i++) {
							 docs[i]._id.type = i18n.t(typeAction.lang + ":" + typeAction.values[docs[i]._id.type].label);
							 //console.log(docs[i]._id.type);
							 }*/

							//console.log(docs);

							cbb(err, docs);
						});
					},
					doing: function (cbb) {

						//console.log(dateS);
						TaskModel.aggregate([
							{$match: {entity: entity, createdAt: {$gte: dateS, $lt: dateE}, "usertodo.id": {$exists: true}, type: {$in: ["AC_RDV", "AC_EAT", "AC_DEMO"]}}},
							{$project: {_id: 1, user: "$usertodo.id", createdAt: 1}},
							{$group: {_id: {user: "$user", month: {$month: "$createdAt"}}, count: {$sum: 1}}},
							{$sort: {"_id.month": 1, "_id.user": 1}}
						], function (err, docs) {
							//console.log(docs);

							/*for (var i = 0; i < docs.length; i++) {
							 docs[i]._id.type = i18n.t(typeAction.lang + ":" + typeAction.values[docs[i]._id.type].label);
							 //console.log(docs[i]._id.type);
							 }*/

							//console.log(docs);

							cbb(err, docs);
						});
					}
				}, function (err, results) {
					if (err)
						console.log(err);

					for (var i = 0; i < results.realised.length; i++)
						if (results.user[results.realised[i]._id.user])
							results.user[results.realised[i]._id.user].realised[results.realised[i]._id.month] += results.realised[i].count;


					for (var i = 0; i < results.doing.length; i++)
						if (results.user[results.doing[i]._id.user])
							results.user[results.doing[i]._id.user].doing[results.doing[i]._id.month] += results.doing[i].count;


					for (var i in results.user) {
						results.user[i].realised = results.user[i].realised.filter(function () {
							return true;
						});
						results.user[i].doing = results.user[i].doing.filter(function () {
							return true;
						});
					}

					var results = _.values(results.user);

					//console.log(results);

					cb(err, results);
				});
			},
			caStats: function (cb) {


				//console.log(dateStart);
				FactureModel.aggregate([
					{$match: {"commercial_id.id": {$ne: null}, datec: {$gte: dateStart, $lt: dateEnd}}},
					{$project: {datec: 1, commercial_id: 1, "client": "$client.name", total_ht: 1, }},
					{$group: {_id: {id: "$commercial_id.id", client: "$client", month: {$month: "$datec"}}, total_ht: {$sum: "$total_ht"}}},
					{$sort: {"_id.id": 1, "_id.month": 1, "_id.client": 1}}
				], function (err, docs) {
					//console.log(docs);

					//console.log(docs);

					cb(err, docs);
				});
			},
		}, function (err, results) {
			if (err)
				return console.log(err);


			//console.log(results);
			res.json(results);
		});
	});


	app.get('/api/stats/AllEntities', auth.requiresLogin, function (req, res) {

		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), parseInt(d.getMonth() - 1, 10), 1);
		var dateEnd = new Date(d.getFullYear(), d.getMonth(), 1);

		var entityList = [];

		function verifyResult(err, docs, cb) {
			// convert docs in an array
			if (err)
				return cb(err);

			var result = [];

			for (var i = 0; i < entityList.length; i++) {
				//console.log(entityList[i]);
				result.push({_id: {entity: entityList[i].id, month: dateStart.getMonth() + 1}, count: 0});
				result.push({_id: {entity: entityList[i].id, month: (dateStart.getMonth() + 1) % 12 + 1}, count: 0});
			}
			
			//console.log(result);

			for (var i = 0; i < docs.length; i++) {
				var idx = _.findIndex(result, {_id: docs[i]._id});
				if (idx === -1) {
					console.log("Error index stats.js : ");
					console.log(docs[i]._id);
				} else
					result[idx].count = docs[i].count;
			}

			return cb(null, result);
		}

		EntityModel.find(function (err, docs) {
			for (var i in docs) {
				var entity = {};

				entity.id = docs[i]._id;
				entity.name = docs[i]._id;
				entityList.push(entity);
			}

			async.parallel({
				sumSocietes: function (cb) {
					SocieteModel.aggregate([
						{$match: {entity: {$ne: 'ALL'}, updatedAt: {$gte: dateStart}, "commercial_id.name": {$ne: null}}},
						{$project: {_id: 1, month: {$month: "$updatedAt"}, entity: 1}},
						{$group: {_id: {entity: "$entity", month: "$month"}, count: {$sum: 1}}},
						{$sort: {"_id.entity": 1, "_id.month": 1}}
					], function (err, docs) {
						verifyResult(err, docs, cb);
					});
				},
				sumReports: function (cb) {
					ReportModel.aggregate([
						{$match: {createdAt: {$gte: dateStart}}},
						{$project: {_id: 1, month: {$month: "$createdAt"}, entity: 1}},
						{$group: {_id: {entity: "$entity", month: "$month"}, count: {$sum: 1}}},
						{$sort: {"_id.entity": 1, "_id.month": 1}}
					], function (err, docs) {
						verifyResult(err, docs, cb);
					});
				},
				sumLeads: function (cb) {
					LeadModel.aggregate([
						{$match: {createdAt: {$gte: dateStart}}},
						{$project: {_id: 1, month: {$month: "$createdAt"}, entity: 1}},
						{$group: {_id: {entity: "$entity", month: "$month"}, count: {$sum: 1}}},
						{$sort: {"_id.entity": 1, "_id.month": 1}}
					], function (err, docs) {
						verifyResult(err, docs, cb);
					});
				}
			}, function (err, results) {
				if (err)
					return console.log(err);

				//console.log(results);
				res.json(results);
			});
		});

	});

	//other routes..
};

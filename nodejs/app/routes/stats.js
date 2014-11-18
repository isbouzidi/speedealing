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
var TicketModel = mongoose.model('ticket');
var LeadModel = mongoose.model('lead');
var ReportModel = mongoose.model('report');
var EntityModel = mongoose.model('entity');
var TaskModel = mongoose.model('task');

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

			if (docs.length == 0)
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

					cb(err, docs);
				});
			}
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
		var dateStart = new Date(d.getFullYear(), parseInt(d.getMonth() - 1), 1);
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
				result.push({_id: {entity: entityList[i].id, month: dateStart.getMonth() + 2}, count: 0});
			}

			//console.log(docs);

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

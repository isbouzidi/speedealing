"use strict";

var mongoose = require('mongoose'),
		_ = require('lodash'),
		async = require('async'),
		config = require('../../config/config');

var Dict = require('../controllers/dict');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');
var OrderModel = mongoose.model('commande');
var TicketModel = mongoose.model('ticket');
var LeadModel = mongoose.model('lead');

module.exports = function (app, passport, auth) {

	app.get('/api/statsByEntity', auth.requiresLogin, function (req, res) {

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
				return cb(null, [{_id: dateStart.getMonth()+1, count: 0}, {_id: dateStart.getMonth() + 2, count: 0}]);

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
			newLeads: function (cb) {
				LeadModel.aggregate([
					{$match: {entity: entity, createdAt: {$gte: dateStart}}},
					{$project: {_id: 1, month: {$month: "$createdAt"}}},
					{$group: {_id: "$month", count: {$sum: 1}}},
					{$sort: {_id: 1}}
				], function (err, docs) {
					verifyResult(err, docs, cb);
				});
			}
			/*	newOrders: function (cb) {
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
			 }*/
		}, function (err, results) {
			if (err)
				return console.log(err);

			//console.log(results);
			res.json(results);
		});
	});


	app.get('/api/statsAllEntities', auth.requiresLogin, function (req, res) {
	});

	//other routes..
};

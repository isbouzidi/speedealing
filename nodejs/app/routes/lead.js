"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var ReportModel = mongoose.model('report');
var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');
var SocieteModel = mongoose.model('societe');
var LeadModel = mongoose.model('lead');

module.exports = function(app, passport, auth) {

	var lead = new Lead();

	app.get('/api/report/dict_fk/select', auth.requiresLogin, function(req, res) {

		DictModel.findById('dict:fk_prospectlevel', function(err, doc) {
			if (err) {
				return console.log(err);

			}

			var result = [];
			if (doc.values) {

				for (var i in doc.values) {
					if (doc.values[i].enable) {

						var val = {};
						val.id = i;
						val.label = doc.values[i].label;
						result.push(val);
					}
				}
			}

			res.json(result);
		});
	});

	app.get('/api/report/fk_extrafields/lead', auth.requiresLogin, lead.select);

	app.post('/api/lead', auth.requiresLogin, lead.create);
	app.get('/api/lead', auth.requiresLogin, lead.read);
};

function Lead() {
}

Lead.prototype = {
	read: function(req, res) {
		var query = {};
		
		console.log(req.query);
		
		if (req.query)
			query = req.query;

		LeadModel.find(query, function(err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			return res.json(200, doc);
		});

	},
	select: function(req, res) {

		ExtrafieldModel.findById('extrafields:Lead', function(err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			var result = [];
			if (doc.fields[req.query.field])
				for (var i in doc.fields[req.query.field].values) {
					if (doc.fields[req.query.field].values[i].enable) {
						var val = {};
						val.id = i;
						val.label = doc.fields[req.query.field].values[i].label;
						result.push(val);
					}
				}

			res.json(result);
		});
	},
	create: function(req, res) {

		var lead = new LeadModel(req.body);
		lead.save(function(err, doc) {
			if (err) {
				//return res.json(500, err);
				return console.log(err);
			}

			res.json(200, doc);
		});
	}
};
"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var ReportModel = mongoose.model('report');
var SocieteModel = mongoose.model('societe');
var LeadModel = mongoose.model('lead');

module.exports = function(app, passport, auth) {

	var lead = new Lead();

	app.get('/api/lead/dict/select', auth.requiresLogin, function(req, res) {

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

	app.get('/api/lead/:leadId', auth.requiresLogin, lead.show);
	app.post('/api/lead', auth.requiresLogin, lead.create);
	app.get('/api/lead', auth.requiresLogin, lead.read);

	app.param('leadId', lead.lead);
};

function Lead() {
}

Lead.prototype = {
	lead: function(req, res, next, id) {
		LeadModel.findOne({_id: id}, function(err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return next(new Error('Failed to load lead ' + id));

			req.lead = doc;
			next();
		});
	},
	read: function(req, res) {
                
		var query = req.query;
		var commercial = null;
		
		if (typeof(query.commercial) !== {}) {
			commercial = query.commercial;
			delete query['commercial'];
		}
                
		LeadModel.find(query, function(err, doc) {
			if (err) {
				console.log(err);
				return;
			}
			
			if (commercial) {
				for (var i = 0; i < doc.length; i++) {
					if (commercial !== doc[i].commercial_id.id) {
						doc.splice(i, 1);
						i--;
					}
				}
			}
			
			return res.json(200, doc);
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
	},
	show: function(req, res) {

		res.json(req.lead);
	}
};
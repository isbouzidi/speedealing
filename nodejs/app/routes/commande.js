"use strict";

var mongoose = require('mongoose');

var CommandeModel = mongoose.model('commande');
var ExtrafieldModel = mongoose.model('extrafields');

var dateFormat = require('dateformat');

module.exports = function(app, passport, auth) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Commande', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/commande/lines/list', auth.requiresLogin, function(req, res) {
		object.listLines(req, res);
		return;
	});

	app.get('/api/commande/BL/pdf', auth.requiresLogin, function(req, res) {
		object.genBlPDF(req, res);
		return;
	});

	//other routes..
};

function Object() {
}

Object.prototype = {
	listLines: function(req, res) {
		CommandeModel.findOne({_id: req.query.id}, "lines", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.send(200, doc.lines);
		});
	}
};

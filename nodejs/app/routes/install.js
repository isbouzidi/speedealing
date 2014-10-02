"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		dateFormat = require('dateformat'),
		async = require('async'),
		config = require('../../config/config');

var ZipCodeModel = mongoose.model('zipCode');

module.exports = function(app, passport, auth) {

	var object = new Object();

	app.get('/install/zipcode', auth.requiresLogin, object.installZipCode);


	//other routes..
};

function Object() {
}

Object.prototype = {
	installZipCode: function(req, res) {

		var file = config.root + '/config/install/zipcode.json';

		fs.readFile(file, 'utf8', function(err, data) {
			if (err) {
				console.log('Error: ' + err);
				return;
			}

			data = JSON.parse(data);

			var cpt = 0;
			async.each(data, function(zip, cb) {
				ZipCodeModel.findOne({insee: zip.insee}, function(err, doc) {
					if (err)
						return console.log(err);

					if (doc == null)
						doc = new ZipCodeModel(zip);

					//console.log(zip);

					doc = _.extend(doc, zip);

					doc.save(function(err, doc) {
						if (err)
							console.log(err);

						cb();
						cpt++;
					});
				});
			}, function(err) {
				console.log("total import : " + cpt);
				res.send(200);
			});
		});

		return;


		var query = {};

		if (req.query) {
			for (var i in req.query) {
				if (i == "query") {
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

		BillModel.find(query, "-history -files -latex", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);

			res.json(200, doc);
		});
	}
};
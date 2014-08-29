"use strict";

var mongoose = require('mongoose'),
		config = require('../../config/config');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

module.exports = function(app, passport, auth) {

	app.get('/api/dict', auth.requiresLogin, function(req, res) {
		var result = {
			values: []
		};

		DictModel.findOne({_id: "dict:" + req.query.dictName}, function(err, docs) {
			if (err)
				return console.log(err);

			if (docs) {
				for (var i in docs.values) {
					if (docs.values[i].enable) {
						var val = {};
						val.id = i;
						if (docs.values[i].label)
							val.label = docs.values[i].label;
						//else
						//	val.label = req.i18n.t("companies:" + i);
						result.values.push(val);
					}
				}
			}

			res.json(result);
		});
	});

	//other routes..
};

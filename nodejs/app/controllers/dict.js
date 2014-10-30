"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		timestamps = require('mongoose-timestamp'),
		_ = require('lodash'),
		i18n = require("i18next"),
		async = require("async");

var extrafieldSchema = new mongoose.Schema({
	_id: String,
	ico: String,
	langs: [String],
	lang: String,
	schemaMongoose: {
		name: String,
		plugins: [String],
		enabled: {type: Boolean, default: false},
		collection: String
	},
	fields: {type: mongoose.Schema.Types.Mixed},
	data: Buffer
});

var ExtrafieldModel = mongoose.model('extrafields', extrafieldSchema, 'ExtraFields');

var dictSchema = new mongoose.Schema({
	_id: String,
	lang: String,
	default: String,
	values: {type: mongoose.Schema.Types.Mixed}
});

dictSchema.plugin(timestamps);

var DictModel = mongoose.model('dict', dictSchema, 'Dict');


/* Public declaration methods. See definition for documentation. */
exports.dict = readDict;
exports.extrafield = readExtrafield;

function convertDict(params, doc, callback) {
	var result = {};

	if (params.object) // retourne le dict complet
		return callback(doc);

	if (doc) { // converti le dict en array
		var result = {
				_id: doc._id,
				values: []
		};
		
		if (doc.lang)
			result.lang = doc.lang;
		for (var i in doc.values) {
			if (doc.values[i].enable) {
				if (doc.values[i].pays_code && doc.values[i].pays_code != 'FR')
					continue;

				var val = doc.values[i];
				val.id = i;
				if (doc.lang)//(doc.values[i].label)
					val.label = i18n.t(doc.lang + ":" + doc.values[i].label);
				else
					val.label = doc.values[i].label;

				//else
				//	val.label = req.i18n.t("companies:" + i);
				result.values.push(val);
			}
		}
	} else {
		console.log('Dict is not loaded');
	}

	callback(result);
}


function readDict(params, callback) {

	if (typeof params.dictName == "string")
		DictModel.findOne({_id: params.dictName}, function (err, doc) {
			if (err)
				return callback(err);

			convertDict(params, doc, function (result) {
				callback(null, result);
			});

		});
	else
		DictModel.find({_id: {$in: params.dictName}}, function (err, docs) {
			if (err)
				return callback(err);

			var result = {};

			async.each(docs, function (dict, cb) {
				convertDict(params, dict, function (res) {
					//console.log(res);
					result[dict._id] = res;
					cb();
				});
			}, function (err) {
				//console.log(result);
				callback(null, result);
			});

		});
}

function readExtrafield(params, callback) {
	ExtrafieldModel.findById(params.extrafieldName, function (err, doc) {
		if (err)
			return callback(err);

		var result = [];
		if (params.field) {
			for (var i in doc.fields[params.field].values) {
				if (doc.fields[params.field].values[i].enable) {
					var val = {};
					val.id = i;
					val.label = i18n.t("bills:" + doc.fields[params.field].values[i].label);
					result.push(val);
				}
			}
			doc.fields[params.field].values = result;

			callback(err, doc.fields[params.field]);
		} else {
			callback(err, doc);
		}
	});
}

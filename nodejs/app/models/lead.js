"use strict";

/**
 * Module leads.
 */
var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp');

var ExtrafieldModel = mongoose.model('extrafields');
var DictModel = mongoose.model('dict');

/**
 * Lead Schema
 */
var leadSchema = new Schema({
	name: String,
	potential: String,
	dueDate: Date,
	societe: {
		id: {type: Schema.Types.ObjectId, ref: 'societe'},
		name: String
	},
	status: {type: String, default: 'NEG'},
	entity: String
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

leadSchema.plugin(timestamps);

var leadStatusList = {};

ExtrafieldModel.findById('extrafields:Lead', function(err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	leadStatusList = doc.fields.Status;
});

leadSchema.virtual('Status')
		.get(function() {
			var res_status = {};

			var status = this.status;

			if (status && leadStatusList.values[status] && leadStatusList.values[status].label) {
				res_status.id = status;
				res_status.name = leadStatusList.values[status].label;
				res_status.css = leadStatusList.values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

		});

var prospectLevelList = {};
DictModel.findOne({_id: "dict:fk_prospectlevel"}, function(err, docs) {
	prospectLevelList = docs;
});

leadSchema.virtual('potentialLevel')
		.get(function() {
			var prospectLevel = {};

			var level = this.potential;

			if (level && prospectLevelList.values[level] && prospectLevelList.values[level].cssClass) {
				prospectLevel.id = level;
				prospectLevel.name = i18n.t("companies:" + level);
				if (prospectLevelList.values[level].label)
					prospectLevel.name = prospectLevelList.values[level].label;
				prospectLevel.css = prospectLevelList.values[level].cssClass;
			} else { // By default
				prospectLevel.id = level;
				prospectLevel.name = level;
				prospectLevel.css = "";
			}

			return prospectLevel;
		});

mongoose.model('lead', leadSchema, 'Lead');


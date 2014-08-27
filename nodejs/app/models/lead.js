"use strict";

/**
 * Module leads.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamp');

var DictModel = mongoose.model('dict');

/**
 * Lead Schema
 */
var leadSchema = new Schema({
    name: String,
    potential: String,
    dueDate: Date,
    societe :{
        id: {type: Schema.Types.ObjectId, ref: 'societe'}, 
        name: String
    },
    status: {type: String, default: 'NEG'},
	entity: String
});

leadSchema.plugin(timestamps);

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


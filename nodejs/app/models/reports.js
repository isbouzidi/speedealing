"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
                config = require('../../config/config'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp');
		
/**
 * Report Schema
 */

var ReportSchema = new Schema({
        model: String,
	dateReport: Date,	
	societe: {
		_id: {type: Schema.Types.ObjectId},
		name: String
	},
	duration: Number,
	contacts:[{
            _id: Schema.Types.ObjectId,
            name: String,
            poste: String
            }],
	products:[String],
	actions:[{
            type: String,
            method: String,
            date: Date,
            realised : Boolean
	}],
	optional : Schema.Types.Mixed,
	comment: String,
	author:{
            _id: String,
            name: String
    }
});

ReportSchema.plugin(timestamps);

mongoose.model('report', ReportSchema, 'Reports');
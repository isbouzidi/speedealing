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
		id: Schema.Types.ObjectId,
		name: String
	},
	duration: Number,
	contacts: Schema.Types.Mixed,
	products:[String],
        actions : Schema.Types.Mixed,
        /*actions:[{
            type: {type: String},
            method: String,
            date: Date,
            realised : {type: Boolean}, default: false
	}],*/
	optional : Schema.Types.Mixed,
	comment: String,
	author:{
            id: String,
            name: String
    }
});

ReportSchema.plugin(timestamps);

mongoose.model('report', ReportSchema, 'Reports');
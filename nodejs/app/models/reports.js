"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
                config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp'),
		crypto = require('crypto'),
		authTypes = ['github', 'twitter', 'facebook', 'google'];

/**
 * Report Schema
 */

var ReportSchema = new Schema({
    
});

mongoose.model('report', ReportSchema, 'Reports');
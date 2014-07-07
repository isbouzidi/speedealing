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
 * Zip Code Schema
 */

var ZipCodeSchema = new Schema({
	_id: String,
        code: String, 
        insee: Number, 
        city: String, 
        region: Number,
        nameRegion: String,
        department: Number,
        nameDepartment: String,
        longitude: Number,
        latitude: Number,
        codex: String,
        metaphone: String
});


ZipCodeSchema.plugin(timestamps);

mongoose.model('zipCode', ZipCodeSchema, 'ZipCode');
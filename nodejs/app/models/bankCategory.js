"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    i18n = require("i18next"),
    timestamps = require('mongoose-timestamp'),
    Schema = mongoose.Schema;


/**
 * Bank Category Schema
 */
var bankCategorySchema = new Schema({
	name: String,
        description: String
});

mongoose.model('BankCategory', bankCategorySchema, 'BankCategory');

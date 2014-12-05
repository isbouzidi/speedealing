"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;

/**
 * Emailing Schema
 */
var mailingSchema = new Schema({
    title: String,
    description: String,
    transmitter: String,
    object: String,
    message: String,
    author: {
        id: {type: String, ref: 'User'},
        name: String
    },
    createAt: {type: Date, default: Date.now}
});

mongoose.model('Mailing', mailingSchema);
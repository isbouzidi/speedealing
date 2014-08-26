"use strict";

/**
 * Module leads.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamp');


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

mongoose.model('lead', leadSchema, 'Lead');


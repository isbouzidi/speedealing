"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');


/**
 * UserGroup Schema
 */
var userGroupSchema = new Schema({
	
	name: String,
	_id : String,
	members : [Number],
	databases : [Number],
	entity : String,
	_createdAt: {type: Date},
	updatedAt : Date,
        notes: String
});

userGroupSchema.plugin(timestamps);

mongoose.model('userGroup', userGroupSchema, 'UserGroup');

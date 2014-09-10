"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		//config = require('../../config/config'),
		//gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp');


/**
 * UserGroup Schema
 */
var userGroupSchema = new Schema({
	name: String,
	_id: String,
	members: [Number],
	databases: [Number],
	entity: String,
	_createdAt: {type: Date},
	updatedAt: Date,
	notes: String,
	rights: {
		type: Schema.Types.Mixed
	}
});

userGroupSchema.plugin(timestamps);

mongoose.model('userGroup', userGroupSchema, 'UserGroup');

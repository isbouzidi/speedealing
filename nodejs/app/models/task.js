/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');


/**
 * Article Schema
 */
var taskSchema = new Schema({
	name: String,
	societe: {id: Schema.Types.ObjectId, name: String},
	contact: {id: Schema.Types.ObjectId, name: String},
	percentage: {type: Number, default: 0},
	datec: {type: Date, default: Date.now}, // date de creation
	datep: Date, // date de debut
	datef: Date, // date de fin
	duration: Number,
	type: String,
	author: {id: String, name: String},
	usertodo: {id: String, name: String},
	userdone: {id: String, name: String},
	notes: [
		{
			author: {
				id: {type: String, ref: 'User'},
				name: String
			},
			datec: {type: Date, default: Date.now},
			note: String
		}
	],
	archived: Boolean
});

taskSchema.plugin(timestamps);

mongoose.model('task', taskSchema, 'Task');

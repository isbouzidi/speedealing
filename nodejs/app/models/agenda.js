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
var agendaSchema = new Schema({
	label: String,
	societe: {id: Schema.Types.ObjectId, name: String},
	contact: {id: Schema.Types.ObjectId, name: String},
	Status: Schema.Types.Mixed,
	percentage: Number,
	datec: Date,
	datep: Date,
	datef: Date,
	durationp: Number,
	type_code: Schema.Types.Mixed,
	author: {id: String, name: String},
	usertodo: {id: String, name: String},
	userdone: {id: String, name: String},
	notes: [{edit: Boolean, title: String, note: String}]
});

agendaSchema.plugin(timestamps);

mongoose.model('agenda', agendaSchema, 'Agenda');

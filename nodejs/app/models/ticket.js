"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');

/**
 * Ticket Schema
 */
var ticketSchema = new Schema({
	ref: String,
	name: {type: String, require: true}, //title
//	Status: {type: Schema.Types.Mixed, default: 'NEW'},
	affectedTo: [{id: String, name: String}],
	read: [String], // readed is in this array
	controlledBy: {id: {type: String}, name: String},
	datec: {type: Date, default: new Date()},
	percentage: {type: Number, default: 0},
	datef: Date,
	linked: [{//link internal object
			id: {type: String},
			name: String,
			title: String
		}],
	important: Boolean,
	model: {type: String, default: 'NONE'}, //Model of ticket
	task: String,
	comments: [{
			author: {id: String, name: String},
			note: String,
			title: String, //top of the bar
			datec: {type: Date, default: new Date()},
			icon: String
		}],
	callback: Date,
	recurrency: Number
});

ticketSchema.plugin(timestamps);

ticketSchema.plugin(gridfs.pluginGridFs, {root: 'Ticket'});

/**
 * Pre-save hook
 */
ticketSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.incCpt("T", function(seq) {
			//console.log(seq);
			self.ref = seq;
			next();
		});
	} else
		next();
});

mongoose.model('ticket', ticketSchema, 'Ticket');

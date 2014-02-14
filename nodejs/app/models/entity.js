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
var entitySchema = new Schema({
	name: String,
	address: String,
	zip: String,
	town: String,
	country_id: String,
	phone: String,
	email: String,
	url: String,
	idprof1: String,
	tva_assuj: Boolean,
	capital: Number,
	typent_id: String,
	effectif_id: String,
	forme_juridique_code: String,
	datec: Date,
	logo: String,
	_id: String,
	currency: String,
	fiscal_month_start: Number

});

mongoose.model('entity', entitySchema, 'Mysoc');

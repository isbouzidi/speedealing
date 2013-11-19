/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema;


/**
 * Article Schema
 */
var contactSchema = new Schema({
	ref: String,
	name: {type: String, require: true},
	firstname: String,
	lastname: String,
	poste: String,
	societe: {id: {type: Schema.Types.ObjectId, ref: 'Societe'}, name: String},
	Status: Schema.Types.Mixed,
	address: String,
	zip: String,
	town: String,
	country_id: String,
	state_id: String,
	DefaultLang: String,
	phone: String,
	phone_perso: String,
	phone_mobile: String,
	fax: String,
	email: String,
	civilite: String,
	Tag: [String],
	notes: String,
	entity: String,
	birthday: Date,
	datec: {type: Date},
	user_creat: String,
	user_modif: String,
	gps: [Number]
});

mongoose.model('contact', contactSchema, 'Contact');

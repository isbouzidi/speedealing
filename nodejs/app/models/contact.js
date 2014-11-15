"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		_ = require('lodash'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
var EntityModel = mongoose.model('entity');

var Dict = require('../controllers/dict');

//  Getters and Setters
/*var getTags = function(tags) {
 console.log("joiiiiin");
 return tags.join(',');
 };*/

var setTags = function (tags) {
	var result = [];
	for (var i = 0; i < tags.length; i++)
		if (typeof tags[i] == "object" && tags[i].text)
			result.push(tags[i].text.trim());
		else
			result.push(tags[i].trim());

	result = _.uniq(result);

	//console.log(result);
	return result;
};


/**
 * Contact Schema
 */
var contactSchema = new Schema({
	ref: String,
	firstname: {type: String, trim: true},
	lastname: {type: String, uppercase: true, trim: true},
	poste: String,
	societe: {id: {type: Schema.Types.ObjectId, ref: 'Societe'}, name: String},
	Status: {type: String, default: "ST_ENABLE"},
	address: String,
	zip: String,
	town: String,
	country_id: String,
	state_id: String,
	DefaultLang: String,
	phone: String, // pro
	phone_perso: String,
	phone_mobile: String, // pro
	fax: String, // pro
	email: {type: String, lowercase: true, trim: true},
	emails: [{
			type: {type: String, default: "pro"},
			address: String
		}],
	civilite: String, // DICT
	Tag: {type: [], set: setTags},
	soncas: [String],
	hobbies: [String],
	tag: [{
			text: String
		}],
	notes: String,
	entity: {type: String, lowercase: true, trim: true},
	sex: {type: String, default: "H"},
	newsletter: Boolean,
	sendEmailing: {type: Boolean, default: true},
	sendSMS: {type: Boolean, default: true},
	birthday: Date,
	datec: {type: Date},
	user_creat: String,
	user_modif: String,
	oldId: String // only use for migration
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

contactSchema.plugin(timestamps);

var segmentationList = {};
Dict.dict({dictName: "fk_segmentation"}, function (err, docs) {
	if (docs) {
		segmentationList = docs.values;
	}
});

var tab_attractivity = {
	effectif_id: {
		"EF0": 1,
		"EF1-5": 1,
		"EF6-10": 1,
		"EF11-50": 1,
		"EF51-100": 1,
		"EF101-250": 2,
		"EF251-500": 2,
		"EF501-1000": 3,
		"EF1001-5000": 5,
		"EF5000+": 5
	},
	typent_id: {
		//"TE_PUBLIC": 3,
		"TE_ETABL": 3,
		"TE_SIEGE": 5
	},
	familyProduct: {
		"Externalisation": 5,
		"Imp Num": 4,
		"Repro/plan": 2,
		"Signalétique": 5,
		"Numérisation": 5,
		"Créa, Pao": 2,
		"Dupli cd/dvd": 4
	},
	segmentation: segmentationList,
	poste: {
		"PDG": 5,
		"DG": 4,
		"DET": 4,
		"DIR IMMO": 4,
		"DirCO": 2,
		"Dir COM": 3,
		"DirMktg": 3
	}
};

contactSchema.virtual('name')
		.get(function () {
			return this.firstname + " " + this.lastname;
		});

var contactStatusList = {};
Dict.dict({dictName: "fk_contact_status", object: true}, function (err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	contactStatusList = doc;
});

contactSchema.virtual('status')
		.get(function () {
			var res_status = {};

			var status = this.Status;

			if (status && contactStatusList.values[status] && contactStatusList.values[status].label) {
				//console.log(this);
				res_status.id = status;
				//this.status.name = i18n.t("intervention." + statusList.values[status].label);
				res_status.name = contactStatusList.values[status].label;
				res_status.css = contactStatusList.values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

		});

contactSchema.virtual('attractivity')
		.get(function () {
			var attractivity = 0;

			for (var i in tab_attractivity) {
				if (this[i]) {
					if (tab_attractivity[i][this[i].text])
						attractivity += tab_attractivity[i][this[i].text];

					else if (tab_attractivity[i][this[i]])
						attractivity += tab_attractivity[i][this[i]];
				}
			}

			return attractivity;
		});

contactSchema.virtual('fullAddress').get(function () {

	return this.address + ', ' + this.zip + ' ' + this.town;

});

mongoose.model('contact', contactSchema, 'Contact');
"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
var DictModel = mongoose.model('dict');
var ExtrafieldModel = mongoose.model('extrafields');
var EntityModel = mongoose.model('entity');

//  Getters and Setters
/*var getTags = function(tags) {
	console.log("joiiiiin");
	return tags.join(',');
};*/

var setTags = function(tags) {
	var result = [];
	for (var i = 0; i < tags.length; i++)
		result.push(tags[i].text);
	console.log(result);
	//return tags.split(',');
	return result;
};

/**
 * Article Schema
 */
var societeSchema = new Schema({
	ref: String,
	name: {type: String, require: true},
	code_client: {type: String, unique: true},
	code_fournisseur: String,
	barCode: String,
	Status: {type: Schema.Types.Mixed, default: 'ST_NEVER'},
	dateLastStatus: {type: Date, default: Date.now},
	blocked: Boolean, // Compte bloque
	address: String,
	zip: String,
	town: String,
	country_id: {type: String, default: 'FR'},
	state_id: Number,
	phone: String,
	fax: String,
	email: String,
	url: String,
	typent_id: {type: String, default: 'TE_UNKNOWN'},
	effectif_id: {type: String, default: 'EF0'},
	capital: {type: Number, default: 0},
	VATIsUsed: {type: Boolean, default: true},
	forme_juridique_code: String,
	commercial_id: {id: {type: String}, name: String},
	cptBilling: {id: {type: Schema.Types.ObjectId}, name: String},
	price_level: {type: String, default: 'BASE', uppercase: true, trim: true},
	prospectlevel: {type: String, default: 'PL_NONE'},
	brand: [String],
	yearCreated: Number,
	cond_reglement: {type: String, default: 'RECEP'},
	mode_reglement: {type: String, default: 'CHQ'},
	en_compte: Boolean,
	groupOrder: Boolean, // 1 bill for many order
	groupDelivery: Boolean, // 1 bill for many delivery
	zonegeo: String,
	Tag: {type: [], set: setTags},
	segmentation: [{
			text: String
		}],
	familyProduct: [{
			text: String
		}],
	notes: [{
			author: {
				id: {type: String, ref: 'User'},
				name: String
			},
			datec: Date,
			note: String
		}],
	public_notes: String,
	code_compta: String,
	code_compta_fournisseur: String,
	user_creat: String,
	user_modif: String,
	remise_client: Number,
	entity: {type: String, default: "ALL"},
	fournisseur: {type: String, default: 'NO'},
	gps: [Number],
	contractID: String,
	UGAP_Ref_Client: String,
	datec: Date,
	idprof1: String, // SIREN
	idprof2: {type: String}, // SIRET
	idprof3: String, // NAF
	idprof4: String,
	idprof5: String,
	idprof6: String, // TVA Intra
	iban: {
		bank: String,
		id: String, //FR76........
		swift: String, //BIC / SWIFT
	},
	checklist: mongoose.Schema.Types.Mixed,
	annualCA: [{
			year: Number,
			amount: Number
		}],
	annualEBE: [{
			year: Number,
			amount: Number
		}],
	risk: {type: String, default: 'NO'},
	kompass_id: String, // Kompass
	ha_id: String, // hors antenne
	soldeOut: Number, // Situation comptable
	optional: mongoose.Schema.Types.Mixed
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

societeSchema.plugin(timestamps);

societeSchema.plugin(gridfs.pluginGridFs, {root: "Societe"});

societeSchema.pre('save', function(next) {
	var self = this;

	if (this.code_client === null && this.entity !== "ALL" && this.Status !== 'ST_NEVER') {

		SeqModel.incNumber("C", 6, function(seq) {
			self.barCode = "C" + seq;

			//console.log(seq);
			EntityModel.findOne({_id: self.entity}, "cptRef", function(err, entity) {
				if (err)
					console.log(err);

				if (entity && entity.cptRef)
					self.code_client = entity.cptRef + "-" + seq;
				else
					self.code_client = "C" + seq;
				next();
			});
		});
	} else
		next();
});

var statusList = {};
DictModel.findOne({_id: "dict:fk_stcomm"}, function(err, docs) {
	statusList = docs;
});

var prospectLevelList = {};
DictModel.findOne({_id: "dict:fk_prospectlevel"}, function(err, docs) {
	prospectLevelList = docs;
});

var segmentationList = {};
DictModel.findOne({_id: "dict:fk_segmentation"}, function(err, docs) {
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

societeSchema.virtual('attractivity')
		.get(function() {
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

societeSchema.virtual('status')
		.get(function() {
			var res_status = {};

			var status = this.Status;

			if (status && statusList.values[status].label) {
				//console.log(this);
				res_status.id = status;
				//this.status.name = i18n.t("intervention." + statusList.values[status].label);
				res_status.name = statusList.values[status].label;
				res_status.css = statusList.values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

		});

societeSchema.virtual('prospectLevel')
		.get(function() {
			var prospectLevel = {};

			var level = this.prospectlevel;

			if (level && prospectLevelList.values[level] && prospectLevelList.values[level].cssClass) {
				prospectLevel.id = level;
				prospectLevel.name = i18n.t("companies:" + level);
				if (prospectLevelList.values[level].label)
					prospectLevel.name = prospectLevelList.values[level].label;
				prospectLevel.css = prospectLevelList.values[level].cssClass;
			} else { // By default
				prospectLevel.id = level;
				prospectLevel.name = level;
				prospectLevel.css = "";
			}

			return prospectLevel;
		});

mongoose.model('societe', societeSchema, 'Societe');

/**
 * Contact Schema
 */
var contactSchema = new Schema({
	ref: String,
	firstname: String,
	lastname: {type: String, uppercase: true},
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
	email: String,
	emails: [{
			type: {type: String, default: "pro"},
			address: String
		}],
	civilite: String, // DICT
	Tag: [String],
	tag: [{
			text: String
		}],
	notes: String,
	entity: String,
	sex: {type: String, default: "H"},
	birthday: Date,
	datec: {type: Date},
	user_creat: String,
	user_modif: String
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

contactSchema.plugin(timestamps);

contactSchema.virtual('name')
		.get(function() {
			return this.firstname + " " + this.lastname;
		});

var contactStatusList = {};
ExtrafieldModel.findById('extrafields:Contact', function(err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	contactStatusList = doc.fields.Status;
});

contactSchema.virtual('status')
		.get(function() {
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
		.get(function() {
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

contactSchema.virtual('fullAddress').get(function() {

	return this.address + ', ' + this.zip + ', ' + this.town;

});

mongoose.model('contact', contactSchema, 'Contact');
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

/**
 * Article Schema
 */
var societeSchema = new Schema({
	ref: String,
	name: {type: String, required: true},
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
	Tag: [String],
	segmentation: [{
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
	idprof2: {type: String, unique: true}, // SIRET
	idprof3: String, // NAF
	idprof4: String,
	idprof5: String,
	idprof6: String, // TVA Intra
	iban: {
		bank: String,
		id: String //FR76........
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

	if (this.code_client == null && this.entity !== "ALL" && this.Status !== 'ST_NEVER') {

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

			if (level && prospectLevelList.values[level].cssClass) {
				prospectLevel.id = level;
//		prospectLevel.name = i18n.t("companies:" + level);
				prospectLevel.name = i18n.t("companies:" + level);
				//this.prospectLevel.name = prospectLevelList.values[level].label;
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
	lastname: String,
	poste: String,
	societe: {id: {type: Schema.Types.ObjectId, ref: 'Societe'}, name: String},
	Status: {type: String, default: "ST_NEVER"},
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

			if (status && contactStatusList.values[status].label) {
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

mongoose.model('contact', contactSchema, 'Contact');
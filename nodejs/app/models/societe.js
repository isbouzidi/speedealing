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
var DictModel = mongoose.model('dict');

/**
 * Article Schema
 */
var societeSchema = new Schema({
	ref: String,
	name: {type: String, require: true},
	code_client: String,
	code_fournisseur: String,
	barCode: String,
	Status: {type: Schema.Types.Mixed, default: 'ST_NEVER'},
	status: {type: Schema.Types.Mixed, virtual: true},
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
	civilite_id: {type: String, default: 'NO'},
	price_level: {type: String, default: 'base'},
	prospectlevel: {type: String, default: 'PL_NONE'},
	prospectLevel: {type: Schema.Types.Mixed, virtual: true},
	cond_reglement: String,
	mode_reglement: String,
	zonegeo: String,
	Tag: [String],
	notes: String,
	public_notes: String,
	code_compta: String,
	code_compta_fournisseur: String,
	user_creat: String,
	user_modif: String,
	remise_client: String,
	entity: String,
	fournisseur: {type: String, default: 'NO'},
	gps: [Number],
	contractID: String,
	UGAP_Ref_Client: String,
	datec: Date
});

societeSchema.plugin(timestamps);

societeSchema.plugin(gridfs.pluginGridFs, {root: "Societe"});

societeSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.incBarCode("C", 5, function(seq) {
			self.barCode = seq;
			next();
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




/**
 * Methods
 */
societeSchema.methods.setStatus = function(status, i18n) {
	this.status = {};

	if (statusList.values[status].label) {
		this.status.id = status;
		//this.status.name = i18n.t("intervention." + statusList.values[status].label);
		this.status.name = statusList.values[status].label;
		this.status.css = statusList.values[status].cssClass;
	} else { // By default
		this.status.id = status;
		this.status.name = status;
		this.status.css = "";
	}
};

societeSchema.methods.setProspectLevel = function(level, i18n) {
	this.prospectLevel = {};

	if (prospectLevelList.values[level].cssClass) {
		this.prospectLevel.id = level;
		this.prospectLevel.name = i18n.t("companies:" + level);
		//this.prospectLevel.name = prospectLevelList.values[level].label;
		this.prospectLevel.css = prospectLevelList.values[level].cssClass;
	} else { // By default
		this.prospectLevel.id = level;
		this.prospectLevel.name = level;
		this.prospectLevel.css = "";
	}
};

mongoose.model('societe', societeSchema, 'Societe');

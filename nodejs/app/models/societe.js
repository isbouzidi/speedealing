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
var EntityModel = mongoose.model('entity');

/**
 * Article Schema
 */
var societeSchema = new Schema({
	ref: String,
	name: {type: String, require: true},
	code_client: String,
	code_fournisseur: String,
	barCode: String,
	Status: {type: Schema.Types.Mixed, default: 'ST_PFROI'},
	//status: {type: mongoose.VirtualType},
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
	price_level: {type: String, default: 'BASE', uppercase: true, trim: true},
	prospectlevel: {type: String, default: 'PL_NONE'},
	//prospectLevel: {type: Schema.Types.Mixed, virtual: true},
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
	datec: Date,
	idporf1: String,
	idprof2: {type: String, require: true, unique: true}, // SIRET
	idprof3: String,
	idprof4: String,
	idprof5: String,
	idprof6: String
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

societeSchema.plugin(timestamps);

societeSchema.plugin(gridfs.pluginGridFs, {root: "Societe"});

societeSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew && this.code_client == null) {
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

	if (statusList.values[status].label) {
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

	if (prospectLevelList.values[level].cssClass) {
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

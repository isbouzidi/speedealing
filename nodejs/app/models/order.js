"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		gridfs = require('../controllers/gridfs'),
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
var DictModel = mongoose.model('dict');
var EntityModel = mongoose.model('entity');

/**
 * Article Schema
 */
var orderSchema = new Schema({
	ref: {type: String},
	Status: {type: Schema.Types.Mixed, default: 'DRAFT'},
	cond_reglement_code: {type: String, default: 'RECEP'},
	mode_reglement_code: {type: String, default: 'TIP'},
	availability_code: {type: String, default: 'AV_NOW'},
	demand_reason_code: {type: String, default: 'SRC_CAMP_EMAIL'},
	client: {id: {type: Schema.Types.ObjectId, ref: 'societe'}, name: String},
	contact: {
		id: {type: Schema.Types.ObjectId, ref: 'contact'},
		name: String,
		phone: String,
		email: String,
	},
	ref_client: {type: String},
	datec: {type: Date},
	date_livraison: Date,
	notes: [{
			title: String,
			note: String,
			public: {
				type: Boolean,
				default: false
			},
			edit: {
				type: Boolean,
				default: false
			}
		}],
	total_ht: {type: Number, default: 0},
	total_tva: {type: Number, default: 0},
	total_ttc: {type: Number, default: 0},
	shipping: {
		total_ht: {type: Number, default: 0},
		tva_tx: {type: Number, default: 0},
		total_tva: {type: Number, default: 0},
		total_ttc: {type: Number, default: 0}
	},
	author: {id: String, name: String},
	entity: String,
	modelpdf: String,
	linked_objects: [{id: Schema.Types.ObjectId, name: String}],
	bills: [Schema.Types.ObjectId],
	groups: [Schema.Types.Mixed],
	optional: Schema.Types.Mixed,
	billing: {
		name: String,
		contact: String,
		address: String,
		zip: String,
		town: String,
		country: String,
		paiment: {
			id: String, // CHQ, ESP, CB, MONEY, CPT(en compte)
			label: String
		},
		mode: {type: String, default: "BILL"} // TICKET or BILL
	},
	bl: [{
			label: String,
			name: String,
			contact: String,
			address: String,
			zip: String,
			town: String,
			products: [{
					id: Schema.Types.ObjectId,
					name: String,
					qty: {type: Number, default: 0}
				}],
			shipping: {
				id: String,
				label: String,
				address: Boolean,
				total_ht: {type: Number, default: 0}
			}
		}],
	lines: [{
			pu: {type: Number, default: 0},
			qty: {type: Number, default: 0},
			tva_tx: {type: Number, default: 0},
			price_base_type: String,
			group: String,
			title: String,
			pu_ht: {type: Number, default: 0},
			description: String,
			product_type: String,
			product: {
				id: {type: Schema.Types.ObjectId, ref: "product"},
				name: String
			},
			total_tva: {type: Number, default: 0},
			total_ttc: {type: Number, default: 0},
			total_ht_without_discount: {type: Number, default: 0},
			total_ttc_without_discount: {type: Number, default: 0},
			total_vat_without_discount: {type: Number, default: 0},
			total_ht: {type: Number, default: 0},
			pu_ttc: {type: Number, default: 0},
			pu_tva: {type: Number, default: 0}
		}],
	history: [{date: Date, author: {id: String, name: String}, Status: Schema.Types.Mixed}],
	latex: {
		title: String,
		createdAt: {type: Date},
		data: Buffer
	}
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

orderSchema.plugin(timestamps);

orderSchema.plugin(gridfs.pluginGridFs, {root: 'Commande'});

/**
 * Pre-save hook
 */
orderSchema.pre('save', function(next) {
	this.total_ht = 0;
	this.total_tva = 0;
	this.total_ttc = 0;

	for (var i = 0; i < this.lines.length; i++) {
		//console.log(object.lines[i].total_ht);
		this.total_ht += this.lines[i].total_ht;
		this.total_tva += this.lines[i].total_tva;
		this.total_ttc += this.lines[i].total_ttc;
	}

	// Shipping
	this.total_ht += this.shipping.total_ht;
	this.total_tva += this.shipping.total_tva;
	this.total_ttc += this.shipping.total_ttc;

	// Round
	this.total_ht = Math.round(this.total_ht * 100) / 100;
	this.total_tva = Math.round(this.total_tva * 100) / 100;
	this.total_ttc = Math.round(this.total_ttc * 100) / 100;
	
	var self = this;
	if (this.isNew && this.ref == null) {
		SeqModel.inc("CO", function(seq) {
			//console.log(seq);
			EntityModel.findOne({_id: self.entity}, "cptRef", function(err, entity) {
				if (err)
					console.log(err);

				if (entity && entity.cptRef)
					self.ref = "CO" + entity.cptRef + seq;
				else
					self.ref = "CO" + seq;
				next();
			});
		});
	} else
		next();
});

var statusList = {};
DictModel.findOne({_id: "dict:fk_order_status"}, function(err, docs) {
	statusList = docs;
});

/**
 * Methods
 */
orderSchema.virtual('status')
		.get(function() {
	var res_status = {};

	var status = this.Status;

	if (statusList.values[status].label) {
		res_status.id = status;
		res_status.name = i18n.t("orders:" + statusList.values[status].label);
		//this.status.name = statusList.values[status].label;
		res_status.css = statusList.values[status].cssClass;
	} else { // By default
		res_status.id = status;
		res_status.name = status;
		res_status.css = "";
	}

	return res_status;
});

mongoose.model('commande', orderSchema, 'Commande');

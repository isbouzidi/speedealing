"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		gridfs = require('../controllers/gridfs'),
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
var DictModel = mongoose.model('dict');
var EntityModel = mongoose.model('entity');

/**
 * Article Schema
 */
var orderSchema = new Schema({
	ref: String,
	Status: {type: Schema.Types.Mixed, default: 'DRAFT'},
	status: {type: Schema.Types.Mixed, virtual: true},
	cond_reglement_code: {type: String, default: 'RECEP'},
	mode_reglement_code: {type: String, default: 'TIP'},
	availability_code: {type: String, default: 'AV_NOW'},
	demand_reason_code: {type: String, default: 'SRC_CAMP_EMAIL'},
	client: {id: {type: Schema.Types.ObjectId, ref: 'Societe'}, name: String},
	contact: {id: {type: Schema.Types.ObjectId, ref: 'Contact'}, name: String},
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
	total_ht: Number,
	total_tva: Number,
	total_ttc: Number,
	shipping: Number,
	author: {id: String, name: String},
	entity: String,
	modelpdf: String,
	linked_objects: [{id: Schema.Types.ObjectId, name: String}],
	bills: [Schema.Types.ObjectId],
	groups: [Schema.Types.Mixed],
	optional: Schema.Types.Mixed,
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
				}]
		}],
	lines: [{
			pu: Number,
			qty: Number,
			tva_tx: Number,
			price_base_type: String,
			group: String,
			title: String,
			pu_ht: Number,
			description: String,
			product_type: String,
			product: {
				id: {type: Schema.Types.ObjectId, ref: "Product"},
				name: String
			},
			total_tva: Number,
			total_ttc: Number,
			total_ht_without_discount: Number,
			total_ttc_without_discount: Number,
			total_vat_without_discount: Number,
			total_ht: Number,
			pu_ttc: Number,
			pu_tva: Number
		}],
	history: [{date: Date, author: {id: String, name: String}, Status: Schema.Types.Mixed}]
});

orderSchema.plugin(timestamps);

orderSchema.plugin(gridfs.pluginGridFs, {root: 'Commande'});

/**
 * Pre-save hook
 */
orderSchema.pre('save', function(next) {
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
orderSchema.methods.setStatus = function(status, i18n) {
	this.status = {};

	if (statusList.values[status].label) {
		this.status.id = status;
		this.status.name = i18n.t("orders:" + statusList.values[status].label);
		//this.status.name = statusList.values[status].label;
		this.status.css = statusList.values[status].cssClass;
	} else { // By default
		this.status.id = status;
		this.status.name = status;
		this.status.css = "";
	}
};

mongoose.model('commande', orderSchema, 'Commande');

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema;


/**
 * Article Schema
 */
var orderSchema = new Schema({
	ref: String,
	Status: {type: Schema.Types.Mixed, default: 'DRAFT'},
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
	groups: [Schema.Types.Mixed],
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
	history: [{date: Date, author: [Object], Status: Schema.Types.Mixed}]
});

mongoose.model('commande', orderSchema, 'Commande');

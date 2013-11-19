/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema;


/**
 * Article Schema
 */
var productSchema = new Schema({
	ref: {type: String, require: true, unique: true},
	label: String,
	type: Schema.Types.Mixed,
	Status: Schema.Types.Mixed,
	country_id: String,
	tva_tx: {type: Number, default: 19.6},
	weight_units: String,
	size_units: String,
	surface_units: String,
	volume_units: String,
	finished: String,
	price_base_type: String,
	tms: Date,
	datec: Date,
	Tag: [String],
	entity: String,
	price: [{
			_id : Schema.Types.ObjectId,
			price_level: String,
			tms: Date,
			pu_ht: Number,
			qtyMax: Number,
			ref_customer_code: String,
			user_mod: Schema.Types.Mixed
		}],
	user_mod: {id: String, name: String},
	history: [{
			tms: Date,
			user_mod: Schema.Types.Mixed,
			pu_ht: Number,
			ref_customer_code: String,
			price_level: String
		}]
});

mongoose.model('product', productSchema, 'Product');

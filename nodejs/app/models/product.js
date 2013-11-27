/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');


/**
 * Article Schema
 */
var productSchema = new Schema({
	ref: {type: String, require: true, unique: true, upper: true},
	label: {type: String, default: ""},
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
			_id: {type: Schema.Types.ObjectId, require: true},
			price_level: String,
			tms: Date,
			pu_ht: Number,
			qtyMin: {type: Number, default: 0},
			ref_customer_code: String,
			user_mod: Schema.Types.Mixed,
			tva_tx: Number
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

productSchema.plugin(timestamps);

mongoose.model('product', productSchema, 'Product');

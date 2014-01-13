/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
/**
 * Product Schema
 */
var productSchema = new Schema({
	ref: {type: String, require: true, unique: true, upper: true},
	compta_buy: {type: String, default: ""},
	compta_sell: {type: String, default: ""},
	label: {type: String, default: ""},
	barCode: String,
	type: Schema.Types.Mixed,
	Status: Schema.Types.Mixed,
	country_id: String,
	tva_tx: {type: Number, default: 20},
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

productSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.incBarCode("P", 4, function(seq) {
			self.barCode = seq;
			next();
		});
	} else
		next();
});

mongoose.model('product', productSchema, 'Product');

/**
 * Product Schema
 */
var storehouseSchema = new Schema({
	name: {type: String, require: true, unique: true, upper: true},
	barCode: {type: Number},
	societe:  {id: {type: Schema.Types.ObjectId}, name: String},
	subStock:[{
		name: {type: String, require: true},
		barCode: {type: Number},
		productId : [{type: Schema.Types.ObjectId}]
	}]
});

storehouseSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.barCode("S", 3, function(seq) {
			self.barCode = seq;
			next();
		});
	} else
		// TODO add subStock increment on K
		next();
});

mongoose.model('storehouse', storehouseSchema, 'Storehouse');

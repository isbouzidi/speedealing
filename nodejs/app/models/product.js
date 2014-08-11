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
	ref: {type: String, require: true, unique: true, uppercase: true},
	compta_buy: {type: String},
	compta_sell: {type: String},
	label: {type: String, default: ""},
	description: {type: String, default: ""},
	barCode: String,
	type: Schema.Types.Mixed,
	Status: Schema.Types.Mixed,
	country_id: String,
	tva_tx: {type: Number, default: 20},
	units: String,
	minPrice: {type: Number, default: 0},
	finished: String,
	price_base_type: String,
	tms: Date,
	datec: Date,
	billingMode: {type: String, uppercase: true, default: "QTY"}, //MONTH, QTY, ...
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
		}],
	template: {type: String, default: "/partials/lines/classic.html"},
	caFamily: {type: String, uppercase: true, default: "OTHER"}
});

productSchema.plugin(timestamps);

productSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.incNumber("P", 10, function(seq) {
			self.barCode = "P" + seq;
			next();
		});
	} else
		next();
});

mongoose.model('product', productSchema, 'Product');

/**
 * Product Storehouse Schema
 */
var storehouseSchema = new Schema({
	name: {type: String, require: true, unique: true, uppercase: true},
	barCode: {type: Number},
	societe: {id: {type: Schema.Types.ObjectId}, name: String},
	subStock: [{
			name: {type: String, uppercase: true},
			barCode: {type: Number},
			productId: [{type: Schema.Types.ObjectId}]
		}]
});

storehouseSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.incCpt("S", function(seq) {
			self.barCode = seq;
			next();
		});
	} else
		// TODO add subStock increment on K
		next();
});

mongoose.model('storehouse', storehouseSchema, 'Storehouse');

/**
 * Product PriceLevel Schema
 */
var priceLevelSchema = new Schema({
	price_level: {type: String, require: true},
	product: {
		id: {type: Schema.Types.ObjectId, ref: 'product'},
		name: String
	},
	tms: Date,
	pu_ht: Number,
	qtyMin: {type: Number, default: 0},
	user_mod: {id: String, name: String},
	optional: Schema.Types.Mixed,
	history: [{
			tms: Date,
			user_mod: Schema.Types.Mixed,
			pu_ht: Number,
			qtyMin: {type: Number, default: 0}
		}]
});

priceLevelSchema.plugin(timestamps);

mongoose.model('pricelevel', priceLevelSchema, 'PriceLevel');


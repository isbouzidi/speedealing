/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		i18n = require("i18next"),
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
var ExtrafieldModel = mongoose.model('extrafields');
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
	Status: String,
	country_id: String,
	tva_tx: {type: Number, default: 20},
	units: {type: String, default: "unit"},
	minPrice: {type: Number, default: 0},
	finished: String,
	price_base_type: String,
	tms: Date, // Not used ??
	datec: {type: Date, default: Date.now},
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
			tva_tx: Number,
			dsf_coef: Number,
			dsf_time: Number
		}],
	pu_ht: {type: Number, default: 0}, // For base price
	user_mod: {id: String, name: String},
	history: [{
			tms: Date,
			user_mod: Schema.Types.Mixed,
			pu_ht: Number,
			ref_customer_code: String
		}],
	template: {type: String, default: "/partials/lines/classic.html"},
	caFamily: {type: String, uppercase: true, default: "OTHER"}
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
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

var statusList = {};
ExtrafieldModel.findById('extrafields:Product', function(err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	statusList = doc.fields.Status;
});

productSchema.virtual('status')
		.get(function() {
			var res_status = {};

			var status = this.Status;

			if (status && statusList.values[status].label) {
				//console.log(this);
				res_status.id = status;
				res_status.name = i18n.t("products:" + statusList.values[status].label);
				//res_status.name = statusList.values[status].label;
				res_status.css = statusList.values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

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
	price_level: {type: String, uppercase: true, require: true},
	product: {
		id: {type: Schema.Types.ObjectId, ref: 'product'},
		name: String
	},
	tms: Date,
	pu_ht: Number,
	qtyMin: {type: Number, default: 0},
	user_mod: {id: String, name: String},
	optional: Schema.Types.Mixed,
	discount: {type: Number, default: 0},
	history: [{
			tms: Date,
			user_mod: Schema.Types.Mixed,
			pu_ht: Number,
			qtyMin: {type: Number, default: 0},
			discount: {type: Number, default: 0}
		}]
});

priceLevelSchema.plugin(timestamps);

mongoose.model('pricelevel', priceLevelSchema, 'PriceLevel');


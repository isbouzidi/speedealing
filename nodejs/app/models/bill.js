/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		i18n = require("i18next"),
		config = require('../../config/config'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');
var EntityModel = mongoose.model('entity');
var ExtrafieldModel = mongoose.model('extrafields');

/**
 * Article Schema
 */
var billSchema = new Schema({
	ref: {type: String, unique: true},
	Status: {type: Schema.Types.Mixed, default: 'DRAFT'},
	cond_reglement_code: {type: String, default: 'RECEP'},
	mode_reglement_code: {type: String, default: 'TIP'},
	client: {id: {type: Schema.Types.ObjectId, ref: 'Societe'}, name: String},
	contact: {id: {type: Schema.Types.ObjectId, ref: 'Contact'}, name: String},
	ref_client: {type: String},
	datec: {type: Date},
	dater: {type: Date},
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
	commercial_id: {id: {type: String}, name: String},
	entity: {type: String},
	modelpdf: String,
	orders: [Schema.Types.ObjectId],
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
	history: [{date: Date, author: {id: String, name: String}, Status: Schema.Types.Mixed}],
	latex: {
		title: String,
		createdAt: {type: Date},
		data: Buffer,
	}
},{
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

billSchema.plugin(timestamps);

/**
 * Pre-save hook
 */
billSchema.pre('save', function(next) {
	this.total_ht = 0;
	this.total_tva = 0;
	this.total_ttc = 0;

	for (var i = 0; i < this.lines.length; i++) {
		//console.log(object.lines[i].total_ht);
		this.total_ht += this.lines[i].total_ht;
		this.total_tva += this.lines[i].total_tva;
		this.total_ttc += this.lines[i].total_ttc;
	}

	this.total_ht = Math.round(this.total_ht * 100) / 100;
	this.total_tva = Math.round(this.total_tva * 100) / 100;
	this.total_ttc = Math.round(this.total_ttc * 100) / 100;

	var self = this;
	if (this.isNew) {
		SeqModel.inc("PROV", function(seq) {
			//console.log(seq);
			self.ref = "PROV" + seq;
			next();
		});
	} else {
		if (this.Status != "DRAFT" && this.ref.substr(0, 4) == "PROV") {
			EntityModel.findOne({_id: self.entity}, "cptRef", function(err, entity) {
				if (err)
					console.log(err);

				if (entity && entity.cptRef) {
					SeqModel.inc("FA" + entity.cptRef, function(seq) {
						//console.log(seq);
						self.ref = "FA" + entity.cptRef + seq;
						next();
					});
				} else {
					SeqModel.inc("FA", function(seq) {
						//console.log(seq);
						self.ref = "FA" + seq;
						next();
					});
				}
			});
		} else
			next();
	}
});

/**
 * Methods
 */
billSchema.methods = {
	/**
	 * inc - increment bill Number
	 *
	 * @param {function} callback
	 * @api public
	 */
	setNumber: function() {
		var self = this;
		if (this.ref.substr(0, 4) == "PROV")
			SeqModel.inc("FA", function(seq) {
				//console.log(seq);
				self.ref = "FA" + seq;
			});
	}
}

var statusList = {};
ExtrafieldModel.findById('extrafields:Facture', function(err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	statusList = doc.fields.Status;
});

billSchema.virtual('status')
		.get(function() {
			var res_status = {};

			var status = this.Status;

			if (status && statusList.values[status].label) {
				//console.log(this);
				res_status.id = status;
				res_status.name = i18n.t("bills:" + statusList.values[status].label);
				//res_status.name = statusList.values[status].label;
				res_status.css = statusList.values[status].cssClass;
			} else { // By default
				res_status.id = status;
				res_status.name = status;
				res_status.css = "";
			}
			return res_status;

		});

mongoose.model('bill', billSchema, 'Facture');

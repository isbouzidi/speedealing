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
var EntityModel = mongoose.model('entity');

var Dict = require('../controllers/dict');

/**
 * Article Schema
 */
var orderSchema = new Schema({
	ref: {type: String},
	Status: {type: Schema.Types.Mixed, default: 'DRAFT'},
	cond_reglement_code: {type: String, default: 'RECEP'},
	mode_reglement_code: {type: String, default: 'TIP'},
	//availability_code: {type: String, default: 'AV_NOW'},
	type: {type: String, default: 'SRC_COMM'},
	client: {
		id: {type: Schema.Types.ObjectId, ref: 'Societe'},
		name: String,
		isNameModified: {type: Boolean},
		cptBilling: {id: {type: Schema.Types.ObjectId}, name: String},
	},
	contact: {
		id: {type: Schema.Types.ObjectId, ref: 'contact'},
		name: String,
		phone: String,
		email: String,
	},
	ref_client: {type: String},
	datec: {type: Date},
	date_livraison: {type: Date},
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
	total_tva: [
		{
			tva_tx: Number,
			total: {type: Number, default: 0}
		}
	],
	total_ttc: {type: Number, default: 0},
	shipping: {
		total_ht: {type: Number, default: 0},
		tva_tx: {type: Number, default: 20},
		total_tva: {type: Number, default: 0},
		total_ttc: {type: Number, default: 0}
	},
	author: {id: String, name: String},
	commercial_id: {id: {type: String}, name: String},
	entity: String,
	modelpdf: String,
	linked_objects: [{id: Schema.Types.ObjectId, name: String}],
	bills: [Schema.Types.ObjectId],
	groups: [Schema.Types.Mixed],
	optional: Schema.Types.Mixed,
	billing: {
		sameBL0: {type: Boolean},
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
	price_level: {type: String, default: "BASE", uppercase: true, trim: true},
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
			//pu: {type: Number, default: 0},
			qty: {type: Number, default: 0},
			tva_tx: {type: Number, default: 0},
			//price_base_type: String,
			group: {type: String, default: "GLOBAL", uppercase: true, trim: true},
			title: String,
			pu_ht: {type: Number, default: 0},
			description: String,
			product_type: String,
			product: {
				id: {type: Schema.Types.ObjectId, ref: "Product"},
				name: {type: String},
				label: String,
				template: {type: String, default: "/partials/lines/classic.html"}
			},
			total_tva: {type: Number, default: 0},
			total_ttc: {type: Number, default: 0},
			//total_ht_without_discount: {type: Number, default: 0},
			//total_ttc_without_discount: {type: Number, default: 0},
			//total_vat_without_discount: {type: Number, default: 0},
			total_ht: {type: Number, default: 0},
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
orderSchema.pre('save', function (next) {
	this.total_ht = 0;
	this.total_tva = [];
	this.total_ttc = 0;

	for (var i = 0; i < this.lines.length; i++) {
		//console.log(object.lines[i].total_ht);
		this.total_ht += this.lines[i].total_ht;
		//this.total_ttc += this.lines[i].total_ttc;

		//Add VAT
		var found = false;
		for (var j = 0; j < this.total_tva.length; j++)
			if (this.total_tva[j].tva_tx == this.lines[i].tva_tx) {
				this.total_tva[j].total += this.lines[i].total_tva;
				found = true;
				break;
			}

		if (!found) {
			this.total_tva.push({
				tva_tx: this.lines[i].tva_tx,
				total: this.lines[i].total_tva
			});
		}
	}

	// shipping cost
	if (this.shipping.total_ht) {
		this.total_ht += this.shipping.total_ht;

		this.shipping.total_tva = this.shipping.total_ht * this.shipping.tva_tx / 100;

		//Add VAT
		var found = false;
		for (var j = 0; j < this.total_tva.length; j++)
			if (this.total_tva[j].tva_tx == this.shipping.tva_tx) {
				this.total_tva[j].total += this.shipping.total_tva;
				found = true;
				break;
			}

		if (!found) {
			this.total_tva.push({
				tva_tx: this.shipping.tva_tx,
				total: this.shipping.total_tva
			});
		}
	}

	this.total_ht = Math.round(this.total_ht * 100) / 100;
	//this.total_tva = Math.round(this.total_tva * 100) / 100;
	this.total_ttc = this.total_ht;

	for (var j = 0; j < this.total_tva.length; j++) {
		this.total_tva[j].total = Math.round(this.total_tva[j].total * 100) / 100;
		this.total_ttc += this.total_tva[j].total;
	}

	var self = this;
	if (this.isNew && this.ref === null) {
		SeqModel.inc("CO", function (seq) {
			//console.log(seq);
			EntityModel.findOne({_id: self.entity}, "cptRef", function (err, entity) {
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
Dict.dict({dictName: "fk_order_status", object: true}, function (err, docs) {
	statusList = docs;
});

/**
 * Methods
 */
orderSchema.virtual('status')
		.get(function () {
			var res_status = {};

			var status = this.Status;

			if (status && statusList.values[status].label) {
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

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
var DictModel = mongoose.model('dict');

/**
 * Article Schema
 */
var billSchema = new Schema({
	ref: {type: String, unique: true},
	type: {type: String, default: 'INVOICE_STANDARD'},
	Status: {type: String, default: 'DRAFT'},
	cond_reglement_code: {type: String, default: 'RECEP'},
	mode_reglement_code: {type: String, default: 'TIP'},
	client: {
		id: {type: Schema.Types.ObjectId, ref: 'Societe'},
		name: String,
		isNameModified: {type: Boolean}
	},
	contact: {id: {type: Schema.Types.ObjectId, ref: 'Contact'}, name: String},
	ref_client: {type: String},
	price_level: {type: String, default: "BASE", uppercase: true, trim: true},
	address: String,
	zip: String,
	town: String,
	country_id: {type: String, default: 'FR'},
	state_id: Number,
	datec: {type: Date},
	dater: {type: Date},
	notes: [{
			author: {
				id: {type: String, ref: 'User'},
				name: String
			},
			datec: Date,
			note: String
		}],
	total_ht: {type: Number, default: 0},
	total_tva: [
		{
			tva_tx: Number,
			total: {type: Number, default: 0}
		}
	],
	total_ttc: {type: Number, default: 0},
	shipping: {type: Number, default: 0},
	author: {id: String, name: String},
	commercial_id: {id: {type: String}, name: String},
	entity: {type: String},
	modelpdf: String,
	orders: [Schema.Types.ObjectId],
	groups: [Schema.Types.Mixed],
	lines: [{
			//pu: Number,
			qty: Number,
			tva_tx: Number,
			group: {type: String, default: "1. DEFAULT"},
			title: String,
			pu_ht: Number,
			description: String,
			product_type: String,
			product: {
				id: {type: Schema.Types.ObjectId, ref: "Product"},
				name: {type: String},
				label: String,
				template: {type: String, default: "/partials/lines/classic.html"}
			},
			total_tva: Number,
			total_ttc: Number,
			total_ht_without_discount: Number,
			total_ttc_without_discount: Number,
			total_vat_without_discount: Number,
			total_ht: Number
					//pu_ttc: Number,
					//pu_tva: Number
		}],
	history: [{date: Date, author: {id: String, name: String}, Status: Schema.Types.Mixed}],
	latex: {
		title: String,
		createdAt: {type: Date},
		data: Buffer,
	}
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

billSchema.plugin(timestamps);

var cond_reglement = {};
DictModel.findOne({_id: "dict:fk_payment_term"}, function(err, docs) {
	cond_reglement = docs;
});

/**
 * Pre-save hook
 */
billSchema.pre('save', function(next) {

	this.calculate_date_lim_reglement();

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
			if (this.total_tva[j].tva_tx === this.lines[i].tva_tx) {
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

	this.total_ht = Math.round(this.total_ht * 100) / 100;
	//this.total_tva = Math.round(this.total_tva * 100) / 100;
	this.total_ttc = this.total_ht;

	for (var j = 0; j < this.total_tva.length; j++) {
		this.total_tva[j].total = Math.round(this.total_tva[j].total * 100) / 100;
		this.total_ttc += this.total_tva[j].total;
	}

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
	},
	/**
	 * 	Renvoi une date limite de reglement de facture en fonction des
	 * 	conditions de reglements de la facture et date de facturation
	 *
	 * 	@param      string	$cond_reglement   	Condition of payment (code or id) to use. If 0, we use current condition.
	 * 	@return     date     			       	Date limite de reglement si ok, <0 si ko
	 */
	calculate_date_lim_reglement: function() {
		var data = cond_reglement.values[this.cond_reglement_code];

		var cdr_nbjour = data.nbjour;
		var cdr_fdm = data.fdm;
		var cdr_decalage = data.decalage || 0;

		/* Definition de la date limite */

		// 1 : ajout du nombre de jours
		var datelim = new Date(this.datec);
		datelim.setDate(datelim.getDate() + cdr_nbjour);

		// 2 : application de la regle "fin de mois"
		if (cdr_fdm) {
			var mois = datelim.getMonth();
			var annee = datelim.getFullYear();
			if (mois === 12) {
				mois = 1;
				annee += 1;
			} else {
				mois += 1;
			}

			// On se deplace au debut du mois suivant, et on retire un jour
			datelim.setHours(0);
			datelim.setMonth(mois);
			datelim.setFullYear(annee);
			datelim.setDate(0);
			//console.log(datelim);
		}

		// 3 : application du decalage
		datelim.setDate(datelim.getDate() + cdr_decalage);
		//console.log(datelim);

		this.dater = datelim;
	}
};

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

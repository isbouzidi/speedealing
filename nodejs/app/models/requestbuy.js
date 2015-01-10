"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
        config = require('../../config/config'),
        Schema = mongoose.Schema,
        SeqModel = mongoose.model('Sequence'),
        Dict = require('../controllers/dict');

/**
 * RequestBuy Schema
 */
var RequestBuySchema = new Schema({
    ref: String,
    title: String,
    datec: Date,
    date_livraison: Date,
    controlLiv: {type: Boolean, default: false},
    fournisseur: {
        id: {type: mongoose.Schema.Types.ObjectId, ref: "Societe"},
        name: String
    },
    ref_fournisseur: String,
    products: [mongoose.Schema.Types.Mixed],
    details: String,
    total_ht: Number,
    client: {
        id: {type: mongoose.Schema.Types.ObjectId, ref: "Societe"},
        name: String
    },
    vehicule: {
        id: {type: mongoose.Schema.Types.ObjectId, ref: "europexpress_vehicule"},
        name: String
    },
    author: {
        id: String,
        name: String
    },
    controlBy: {
        id: String,
        name: String
    },
    Status: String,
    history: [{
            tms: {type: Date, default: Date.now},
            Status: String,
            author: String,
            total_ht: Number
        }],
    latex: {
        title: String,
        createdAt: {type: Date},
        data: Buffer
    }
}, {
    toObject: {virtuals: true},
    toJSON: {virtuals: true}
});

/**
 * Pre-save hook
 */
RequestBuySchema.pre('save', function (next) {
    var self = this;
    if (this.isNew) {
        SeqModel.inc("CF", function (seq) {
            console.log(seq);
            self.ref = "CF" + seq;
            next();
        });
        //return next();
    } else
        next();
});

var requestBuyStatusList = {};
Dict.extrafield({extrafieldName: 'EuropExpress'}, function (err, doc) {
    if (err) {
        console.log(err);
        return;
    }
    if (doc)
        requestBuyStatusList = doc.fields;
    else
        console.log('Dict is not loaded');
});

RequestBuySchema.virtual('status')
        .get(function () {
            var res = {};

            var status = this.Status;

            if (status && requestBuyStatusList.statusBuy.values[status] && requestBuyStatusList.statusBuy.values[status].label) {
                res.id = status;
                res.name = requestBuyStatusList.statusBuy.values[status].label;
                res.css = requestBuyStatusList.statusBuy.values[status].cssClass;
            } else {
                res.id = status;
                res.name = status;
                res.css = "";
            }

            return res;

        });

mongoose.model('europexpress_buy', RequestBuySchema, 'europexpress_buy');
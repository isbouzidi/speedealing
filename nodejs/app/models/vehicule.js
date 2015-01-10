"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamp'),
    dateFormat = require('dateformat');

var Dict = require('../controllers/dict');

/**
 * Vehicule Schema
 */
var VehiculeSchema = new Schema({
    immat: {type: String, uppercase: true},
    desc: String,
    affectation: {
        id:{type: String, default: null},
        name: String
    },
    date_CT: Date,
    kms: Number,
    pneu: String,
    statusVehicule: String,
    freq_rev: Date,
    kmLastRev: Number,
    date_mise_circu: Date,
    end_buy: Date,
    badgeAuto: String,
    phone: Number,
    gazoilCard: String,
    gazoilCardPIN: String,
    author:{
        id: {type: String, ref: 'User'},
        name: String
    },
    geoloc: {type: Boolean, default: false},
    datec: {type: Date, default: Date.now},
    notes: [{
        author: {
            id: {type: String, ref: 'User'},
            name: String
        },
        datec: Date,
        note: String
    }],
    entretiens: [{
        author: {
            id: {type: String, ref: 'User'},
            name: String
        },
        date: Date,
        desc: String,
        km: Number
    }],
    checklist: mongoose.Schema.Types.Mixed
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

VehiculeSchema.plugin(timestamps);

var vehiculeStatusList = {};
Dict.extrafield({extrafieldName: 'EuropExpress'}, function (err, doc) {
    if (err) {
        console.log(err);
        return;
    }
    if (doc)
        vehiculeStatusList = doc.fields;
    else
        console.log('Dict is not loaded');
});

VehiculeSchema.virtual('Status')
        .get(function () {
            var res = {};

            var status = this.statusVehicule;

            if (status && vehiculeStatusList.statusVehicule.values[status] && vehiculeStatusList.statusVehicule.values[status].label) {
                res.id = status;
                res.name = vehiculeStatusList.statusVehicule.values[status].label;
                res.css = vehiculeStatusList.statusVehicule.values[status].cssClass;
            } else {
                res.id = status;
                res.name = status;
                res.css = "";
            }
            
            return res;

        });
        
VehiculeSchema.virtual('StatGeoloc')
        .get(function () {
            var res = 'Non';

            var geoloc = this.geoloc;

            if(geoloc)
                res = 'Oui';
            
            return res;

        });        

//mongoose.model('Vehicle', VehicleSchema);
var VehiculeModel = mongoose.model('europexpress_vehicule', VehiculeSchema, 'europexpress_vehicule');
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
 * Regulier Schema
 */
var RegulierSchema = new Schema({
    driver: {
        id: String,
        name: String
    },
    regulier_date: Date,
    datec: {type: Date, default: Date.now},
    storehouse: {
        id:{type: String, default: null},
        name: String    
    },
    vehicle: {
        id: {type: Schema.Types.ObjectId, ref: 'Vehicle'},
        matriculation: String
    },
    bill: {type: Boolean, default: true},
    immatriculation: {type: String, uppercase: true},
    import: Number,
    export: Number,
    workload: Number,
    ctrembour: Number,
    author:{
        id: {type: String, ref: 'User'},
        name: String
    },
    societe: {
        id: {type: mongoose.Schema.Types.ObjectId, ref: 'Societe'},
        name: String
    }
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

RegulierSchema.plugin(timestamps);

mongoose.model('europexpress_regulier', RegulierSchema, 'europexpress_regulier');
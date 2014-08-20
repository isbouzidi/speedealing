"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
        config = require('../../config/config'),
        Schema = mongoose.Schema,
        i18n = require("i18next"),
        timestamps = require('mongoose-timestamp');

var LeadModel = mongoose.model('lead');
/**
 * Report Schema
 */

var ReportSchema = new Schema({
    model: String,
    dateReport: Date,
    societe: {
        id: Schema.Types.ObjectId,
        name: String
    },
    duration: Number,
    durationAppointment: Number,
    contacts: [{
        id: Schema.Types.ObjectId,
        name: String
    }],
    products: [String],
    realised: {type: Boolean, default: false},
    dueDate: Date,
    actions: [{
            type: {type: String},
            method: String
        }],
    optional: Schema.Types.Mixed,
    comment: String,
    author: {
        id: String,
        name: String
    },
    leads: {
        id: Schema.Types.ObjectId,
        name: String
    },
	entity: String
});

ReportSchema.plugin(timestamps);

ReportSchema.post('save', function (doc) {
    
    var stat;
    
    switch(doc.model){
        case 'Découverte': 
            stat = 'NEG'; break;
        case 'Suivi/Contrat signé':
            stat = 'ACT'; break;
        case 'Pré Signature':
            stat = 'REF'; break;
        default: 
            stat = 'NEG';
            
    };
    
    for(var i = 0; i < doc.leads.length; i++){
        
        LeadModel.update({ _id: doc.leads[i]._id }, {$set:{status: stat}}, { multi: false }, function(err) {
                
                console.log('lead updated ');
        });
        
    }
    
});

mongoose.model('report', ReportSchema, 'Reports');
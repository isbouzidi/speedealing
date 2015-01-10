"use strict";

var mongoose = require('mongoose'),
        timestamps = require('mongoose-timestamp'),
        fs = require('fs'),
        csv = require('csv'),
        xml2js = require('xml2js'),
        dateFormat = require('dateformat'),
        _ = require('lodash');


var SeqModel = mongoose.model('Sequence');
var EntityModel = mongoose.model('entity');
var Dict = require('../controllers/dict');

/**
 * Schema du planning de prod
 */

var planningSchema = new mongoose.Schema({
    jobTicket: {type: String},
    order: {
        name: String,
        id: String,
        ref_client: String
    },
    description: String,
    notes: String,
    datec: {type: Date, default: Date.now},
    societe: {
        id: {type: mongoose.Schema.Types.ObjectId, ref: 'Societe'},
        name: String
    },
    qtyPages: {type: Number, default: 1},
    qty: {type: Number, default: 1},
    author: {
        id: {type: String, ref: 'User'},
        name: String
    },
    date_livraison: {type: Date},
    Status: String,
    step: String,
    entity: String,
    history: [{
            tms: {type: Date, default: Date.now},
            Status: String,
            step: String
        }]
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});
planningSchema.plugin(timestamps);

/**
 * Pre-save hook
 */
planningSchema.pre('save', function (next) {
    
    var self = this;
    if (this.isNew ) {
        SeqModel.inc("JT", function (seq) {
            //console.log(seq);
            EntityModel.findOne({_id: self.entity}, "cptRef", function (err, entity) {
                if (err)
                    console.log(err);

                if (entity && entity.cptRef)
                    self.jobTicket = "JT" + entity.cptRef + seq;
                else
                    self.jobTicket = "JT" + seq;
                next();
            });
        });
        //return next();
    } else
        next();
});

var planningStatusList = {};
Dict.extrafield({extrafieldName: 'Chaumeil'}, function (err, doc) {
    if (err) {
        console.log(err);
        return;
    }
    if (doc)
        planningStatusList = doc.fields;
    else
        console.log('Dict is not loaded');
});

planningSchema.virtual('status')
        .get(function () {
            var res = {};

            var status = this.Status;

            if (status && planningStatusList.planningStatus.values[status] && planningStatusList.planningStatus.values[status].label) {
                res.id = status;
                res.name = planningStatusList.planningStatus.values[status].label;
                res.css = planningStatusList.planningStatus.values[status].cssClass;
            } else {
                res.id = status;
                res.name = status;
                res.css = "";
            }
            
            return res;

        });

var PlanningModel = mongoose.model('chaumeil_planning', planningSchema, 'chaumeil_planning');
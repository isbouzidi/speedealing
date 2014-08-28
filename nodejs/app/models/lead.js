"use strict";

/**
 * Module leads.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamp');

var ExtrafieldModel = mongoose.model('extrafields');

/**
 * Lead Schema
 */
var leadSchema = new Schema({
    name: String,
    potential: String,
    dueDate: Date,
    societe :{
        id: {type: Schema.Types.ObjectId, ref: 'societe'}, 
        name: String
    },
    status: {type: String, default: 'NEG'},
	entity: String
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

leadSchema.plugin(timestamps);

var leadStatusList = {};

ExtrafieldModel.findById('extrafields:Lead', function(err, doc) {
	if (err) {
		console.log(err);
		return;
	}
	leadStatusList = doc.fields.Status;
});

leadSchema.virtual('Status')
        .get(function() {
            var res_status = {};

            var status = this.status;

            if (status && leadStatusList.values[status] && leadStatusList.values[status].label) {
                res_status.id = status;
                res_status.name = leadStatusList.values[status].label;
                res_status.css = leadStatusList.values[status].cssClass;
            } else { // By default
                res_status.id = status;
                res_status.name = status;
                res_status.css = "";
            }
            return res_status;

        });
mongoose.model('lead', leadSchema, 'Lead');


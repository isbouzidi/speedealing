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
			name: String,
			poste: String
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
	proposal_ht: Number,
	leadStatus: String,
	author: {
		id: String,
		name: String
	},
	lead: {
		id: Schema.Types.ObjectId,
		name: String
	},
	entity: String
}, {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

ReportSchema.plugin(timestamps);
ReportSchema.virtual('RealisedStatus').get(function() {

	var realisedStat = {};

	if (this.actions.length > 0) {
		if (this.realised)
			realisedStat = {id: 'Réalisé', css: 'green-gradient'};
		else
			realisedStat = {id: 'Non Réalisé', css: 'red-gradient'};
	} else {
		realisedStat = {id: 'Aucun', css: 'grey-gradient'};
	}

	return realisedStat;
});

ReportSchema.post('save', function(doc) {

	if (doc.lead.id && doc.leadStatus)
		LeadModel.update({_id: doc.lead.id}, {$set: {status: doc.leadStatus}}, {multi: false}, function(err) {

			console.log('lead updated ');
		});

});

mongoose.model('report', ReportSchema, 'Reports');
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('./config'),
		Schema = mongoose.Schema;


/**
 * Article Schema
 */
var sequenceSchema = new Schema({
	_id: String,
	seq: {type: Number, default: 1}
});



/**
 * Statics
 */
sequenceSchema.statics = {
	inc: function(name, cb) {
		this.findByIdAndUpdate(name, {$inc: {seq: 1}}, {upsert: true}, function(err, doc) {
			if (err)
				console.log(err);

			var date = new Date();

			return cb(numberFormat((date.getMonth() + 1), 2) + date.getFullYear().toString().substr(2, 2) + "-" + numberFormat(doc.seq, 6));
		});
	},
	incNumber: function(name, length, cb) {
		this.findByIdAndUpdate(name, {$inc: {seq: 1}}, {upsert: true}, function(err, doc) {
			if (err)
				console.log(err);

			return cb(numberFormat(doc.seq, length)); // format PROV return 000440
		});
	},
	incCpt: function(name, cb) {
		this.findByIdAndUpdate(name, {$inc: {seq: 1}}, {upsert: true}, function(err, doc) {
			if (err)
				console.log(err);

			return cb(doc.seq); // format T return 440
		});
	},
	incBarCode: function(name, length, cb) {
		this.findByIdAndUpdate(name, {$inc: {seq: 1}}, {upsert: true}, function(err, doc) {
			if (err)
				console.log(err);

			return cb(name + numberFormat(doc.seq, length)); //P0120
		});
	}
};

mongoose.model('Sequence', sequenceSchema, 'Sequence');

var numberFormat = function(number, width) {
	//console.log("number : " + number);
	//console.log("width : " + width);
	//console.log(number + '');
	return new Array(width + 1 - (number + '').length).join('0') + number;
};
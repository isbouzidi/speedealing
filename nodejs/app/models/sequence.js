/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
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

			return cb(name + (date.getMonth() + 1) + date.getFullYear().toString().substr(2, 2) + "-" + numberFormat(doc.seq, 5));
		});
	}
};

mongoose.model('Sequence', sequenceSchema, 'Sequence');

var numberFormat = function(number, width) {
	return new Array(width + 1 - (number + '').length).join('0') + number;
}
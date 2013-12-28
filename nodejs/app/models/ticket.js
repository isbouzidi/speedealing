/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');

var SeqModel = mongoose.model('Sequence');

/**
 * Ticket Schema
 */
var ticketSchema = new Schema({
	ref: String,
	name: {type: String, require: true}, //title
	Status: {type: Schema.Types.Mixed, default: 'NEW'},
	affectedTo: [{id: String, name: String}],
	read: [String], // readed is in this array
	controlledBy: {id: {type: String}, name: String},
	datec: {type: Date, default: new Date},
	percentage: Number,
	datef: Date,
	linked: [{//link internal object
			id: {type: Schema.Types.ObjectId},
			name: String,
			title: String
		}],
	important: Boolean,
	model: {type: String, default: 'NONE'}, //Model of ticket
	task : String,
	comments: [{
			author: {id: String, name: String},
			note: String,
			title: String, //top of the bar
			datec: {type: Date, default: new Date},
			icon: String
		}],
	files: [mongoose.Schema.Types.Mixed]
});

ticketSchema.plugin(timestamps);

ticketSchema.methods = {
	/**
	 * Add file to GridFs
	 * @param {String} file
	 * @return {Boolean}
	 * @api public
	 */
	addFile: function(file, options, fn) {
		var _this = this;

		options.root = 'Ticket';

		return gridfs.putGridFileByPath(file.path, file.originalFilename, options, function(err, result) {
//			console.log(result);
			var files = {};
			files.name = result.filename;
			files.type = result.contentType;
			files.size = result.internalChunkSize;
			files._id = result.fileId;
			files.datec = result.uploadDate;

			var found = false;
			for (var i = 0; i < _this.files.length; i++)
				if (_this.files[i].name == result.filename) {
					_this.files[i] = files;
					found = true;
				}

			if (!found)
				_this.files.push(files);

			return _this.save(fn);
		});
	},
	removeFile: function(file, fn) {
		var _this = this;

		var options = {root: 'Ticket'};

		var found = false;
		for (var i = 0; i < _this.files.length; i++)
			if (_this.files[i].name == file) {
				//_this.files[i] = files;
				gridfs.deleteGridFile(_this.files[i]._id.toString(), options, function(err, result) {
					if (err)
						console.log(err);
				});
				_this.files.splice(i, 1);
			}

		return _this.save(fn);
	},
	getFile: function(file, fn) {
		var _this = this;

		var options = {root: 'Ticket'};

		var found = false;
		for (var i = 0; i < _this.files.length; i++)
			if (_this.files[i].name == file) {
				return gridfs.getGridFile(_this.files[i]._id.toString(), options, function(err, store) {
					if (err) {
						console.log(err);
						return fn(err, null);
					}
					//console.log(store);
					fn(null, store);
				});
			}
		fn("Not found", null);
	}
};

/**
 * Pre-save hook
 */
ticketSchema.pre('save', function(next) {
	var self = this;
	if (this.isNew) {
		SeqModel.incNumber("#", function(seq) {
			console.log(seq);
			self.ref = seq;
			next();
		});
	} else
		next();
});

mongoose.model('ticket', ticketSchema, 'Ticket');

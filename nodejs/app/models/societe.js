/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		config = require('../../config/config'),
		gridfs = require('../controllers/gridfs'),
		Schema = mongoose.Schema,
		timestamps = require('mongoose-timestamp');

/**
 * Article Schema
 */
var societeSchema = new Schema({
	ref: String,
	name: {type: String, require: true},
	code_client: String,
	code_fournisseur: String,
	Status: {type: Schema.Types.Mixed, default: 'ST_NEVER'},
	address: String,
	zip: String,
	town: String,
	country_id: {type: String, default: 'FR'},
	state_id: Number,
	phone: String,
	fax: String,
	email: String,
	url: String,
	typent_id: {type: String, default: 'TE_UNKNOWN'},
	effectif_id: {type: String, default: 'EF0'},
	capital: {type: Number, default: 0},
	VATIsUsed: {type: Boolean, default: true},
	forme_juridique_code: String,
	commercial_id: {id: {type: String}, name: String},
	cptBilling: {id: {type: Schema.Types.ObjectId}, name: String},
	civilite_id: {type: String, default: 'NO'},
	price_level: {type: String, default: 'base'},
	prospectlevel: {type: String, default: 'PL_NONE'},
	cond_reglement: String,
	mode_reglement: String,
	zonegeo: String,
	Tag: [String],
	notes: String,
	public_notes: String,
	code_compta: String,
	code_compta_fournisseur: String,
	user_creat: String,
	user_modif: String,
	remise_client: String,
	entity: String,
	fournisseur: {type: String, default: 'NO'},
	gps: [Number],
	contractID: String,
	UGAP_Ref_Client: String,
	datec: Date,
	files: [mongoose.Schema.Types.Mixed]
});

societeSchema.plugin(timestamps);

societeSchema.methods = {
	/**
	 * Add file to GridFs
	 * @param {String} file
	 * @return {Boolean}
	 * @api public
	 */
	addFile: function(file, options, fn) {
		var _this = this;

		options.root = 'Societe';

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

		var options = {root: 'Societe'};

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

		var options = {root: 'Societe'};

		var found = false;
		for (var i = 0; i < _this.files.length; i++)
			if (_this.files[i].name == file) {
				return gridfs.getGridFile(_this.files[i]._id.toString(), options, function(err, store) {
					if (err) {
						console.log(err);
						return fn(err, null);
					}
console.log(store);
					fn(null, store);
				});
			}
		fn("Not found", null);
	}
};

mongoose.model('societe', societeSchema, 'Societe');

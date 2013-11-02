
var fs = require('fs'),
		util = require('util');

var timestamps = require('mongoose-timestamp');

var assert = require('assert');
var old_toString = assert.AssertionError.prototype.toString;

assert.AssertionError.prototype.toString = function() {
	var ret = util.format(
			"Caught '%s', at:\n%s",
			old_toString.call(this),
			this.stack
			);
	return ret;
};

var configFilename = 'config.json';

if (fs.existsSync(configFilename)) {
	config = JSON.parse(fs.readFileSync(configFilename));

} else {
	console.log(configFilename + " not found.");
	process.exit();
}

var ModuleModel;

exports.connect = function() {
	mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.database, {server: {auto_reconnect: true}});

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection mongodb error native :'));
	db.once('open', function callback() {
		console.log("mongoose mongoDB connected");
	});
};

exports.loadModules = function() {

	var moduleSchema = new mongoose.Schema({
		_id: {type: String},
		numero: Number,
		family: String,
		name: String,
		description: String,
		version: String,
		const_name: String,
		picto: String,
		dirs: [String],
		boxes: [mongoose.Schema.Types.Mixed],
		module_parts: [],
		const: [],
		tabs: [],
		langfiles: [],
		depends: [],
		requiredby: [],
		config_page_url: [],
		rights_class: {type: String},
		rights: [mongoose.Schema.Types.Mixed],
		menus: [mongoose.Schema.Types.Mixed],
		enabled: {type: Boolean},
		import: [mongoose.Schema.Types.Mixed],
		expport: [mongoose.Schema.Types.Mixed],
		_createdAt: {type: Date, default: Date.now}
	});

	ModuleModel = mongoose.model('module', moduleSchema, 'DolibarrModules');
};
"use strict";

var timestamps = require('mongoose-timestamp');

var extrafieldSchema = new mongoose.Schema({
	_id: String,
	ico: String,
	langs: {type: Array},
	schemaMongoose: {
		name: String,
		plugins: [String],
		enabled: {type: Boolean, default: false},
		collection: String
	},
	fields: {type: mongoose.Schema.Types.Mixed}
});

var ExtrafieldModel = mongoose.model('extrafields', extrafieldSchema, 'ExtraFields');

module.exports = exports = function(callback) {
// Load All schema in extrafields
	ExtrafieldModel.find({"schemaMongoose.enabled": true}, function(err, docs) {
		if (err) {
			console.log(err);
			process.exit();
		}

		if (docs !== null) {
			for (var i in docs) {
				var attributes = {};
				for (var j in docs[i].fields) {
					if (docs[i].fields[j].schema) {
						if (!(j === "_id" && (docs[i].fields[j].schema === "ObjectId" || docs[i].fields[j].schema.type === "ObjectId")))
							attributes[j] = docs[i].fields[j].schema;
					}
				}
				//console.log(attributes);
				var loadSchema = new mongoose.Schema(attributes);
				if (docs[i].schemaMongoose.plugins)
					for (var y = 0; y < docs[i].schemaMongoose.plugins.length; y++) {
						var plugin = require(docs[i].schemaMongoose.plugins[y]);
						//console.log(docs[i].schemaMongoose.plugins[y]);
						loadSchema.plugin(plugin);
					}
				//console.log(docs[i].schemaMongoose);
				var tmpModel;
				if (docs[i].schemaMongoose.collection)
					tmpModel = mongoose.model(docs[i].schemaMongoose.name, loadSchema, docs[i].schemaMongoose.collection);
				else
					tmpModel = mongoose.model(docs[i].schemaMongoose.name, loadSchema);
				//console.dir(docs[i].schemaMongoose.name);
			}
		}
		callback();
	});
};
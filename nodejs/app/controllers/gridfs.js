"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		fs = require('fs');

var GridStore = mongoose.mongo.GridStore,
		Grid = mongoose.mongo.Grid,
		ObjectID = mongoose.mongo.BSONPure.ObjectID;

function getGridFile(id, options, fn) {
	var db = mongoose.connection.db,
			id = new ObjectID(id),
			store = new GridStore(db, id, "r", options);

	store.open(function (err, store) {
		if (err) {
			return fn(err);
		}
		fn(null, store);
	});
}

function putGridFile(buf, name, options, fn) {
	var db = mongoose.connection.db,
			options = parse(options);
	options.metadata.filename = name;

	new GridStore(db, name, "w", options).open(function (err, file) {
		if (err)
			return fn(err);
		else
			file.write(buf, true, fn);
		//TODO: Should we gridStore.close() manully??
	});
}
;

function putGridFileByPath(path, name, original, options, fn) {
	var db = mongoose.connection.db,
			options = parse(options);
	options.metadata.filename = name;
	options.metadata.originalFilename = original;

	new GridStore(db, name, "w", options).open(function (err, file) {
		if (err)
			return fn(err);
		else
			file.writeFile(path, fn);
	});
}
;

function deleteGridFile(id, options, fn) {
	console.log('Deleting GridFile ' + id);
	var db = mongoose.connection.db,
			id = new mongoose.mongo.BSONPure.ObjectID(id),
			store = new GridStore(db, id, 'r', options);

	store.unlink(function (err, result) {
		if (err)
			return fn(err);

		return fn(null);
	});
}
;

function parse(options) {
	var opts = {};
	if (options.length > 0) {
		opts = options[0];
	}
	else
		opts = options;

	if (!opts.metadata)
		opts.metadata = {};

	return opts;
}

/**
 * Insert plugin to schema
 * @param {type} schema
 * @param {type} opt
 * @returns {undefined}
 */

exports.pluginGridFs = function (schema, opt) {
	schema.add({
		files: [mongoose.Schema.Types.Mixed]
	});

	schema.methods = {
		/**
		 * Add file to GridFs
		 * @param {String} file
		 * @return {Boolean}
		 * @api public
		 */
		addFile: function (file, options, fn) {
			var _this = this;

			options.root = opt.root;

			return putGridFileByPath(file.path, (this.ref || this.name) + "_" + file.originalFilename, file.originalFilename, options, function (err, result) {
				//console.log(result);
				var files = {};
				files.name = result.filename;
				files.originalFilename = result.metadata.originalFilename;
				files.type = result.contentType;
				files.size = result.internalChunkSize;
				files._id = result.fileId;
				files.datec = result.uploadDate;

				var update = false;
				for (var i = 0; i < _this.files.length; i++)
					if (_this.files[i].name === result.filename) {
						_this.files[i] = files;
						update = true;
					}

				if (!update)
					_this.files.push(files);

				return _this.save(function (err, doc) {
					fn(err, doc, files, update);
				});
			});
		},
		removeFile: function (file, fn) {
			var _this = this;

			var options = opt;

			var found = false;
			for (var i = 0; i < _this.files.length; i++) {
				if (_this.files[i].name == file) {
					//_this.files[i] = files;
					deleteGridFile(_this.files[i]._id.toString(), options, function (err, result) {
						if (err)
							console.log(err);
					});
					_this.files.splice(i, 1);
				}
			}

			return _this.save(function (err, doc) {
				fn(err, doc);
			});
		},
		getFile: function (file, fn) {
			var _this = this;

			var options = opt;

			var found = false;
			for (var i = 0; i < _this.files.length; i++)
				if (_this.files[i].name === file) {
					return getGridFile(_this.files[i]._id.toString(), options, function (err, store) {
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
};

exports.addFile = function (Model, id, file, callback) {
	var filename = file.path;

	if (fs.existsSync(filename)) {
		//console.log(filename);
		Model.findOne({_id: id}, function (err, doc) {
			if (err || doc ==== null) {
				console.log(err);
				return callback({status: "Id not found"});
			}

			var opts;
			opts = {
				content_type: file.type,
				metadata: {
					_id: id
				}
			};


			doc.addFile(file, opts, callback);
		});
	} else
		callback({foo: "bar", status: "failed"});
};

exports.getFile = function (Model, id, fileName, callback) {
	Model.findOne({_id: id}, function (err, doc) {

		if (err || doc ==== null) {
			console.log(err);
			return callback({status: "Id not found"}, null);
		}

		doc.getFile(fileName, function (err, store) {
			if (err)
				console.log(err);

			//console.log(store);
			callback(null, store);
		});
	});
};

exports.delFile = function (Model, id, fileNames, callback) {
	Model.findOne({_id: id}, function (err, doc) {

		if (err) {
			console.log(err);
			return callback({status: "Id not found"});
		}
		doc.removeFile(fileNames, function (err, result) {
			if (err)
				console.log(err);

			callback(err, result);
		});
	});
};

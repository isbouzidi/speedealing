"use strict";
var mongoose = require('mongoose'),
		fs = require("fs-extra"),
		temp = require("temp"),
		path = require("path"),
		accounting = require("accounting"),
		exec = require("child_process").exec,
		util = require('util'),
		async = require('async'),
		events = require('events'),
		dateFormat = require('dateformat'),
		_ = require('lodash'),
		config = require('../../config/config');
exports.loadModel = function (file, callback) {
	fs.readFile(config.root + config.latex.models + file, 'utf8', function (err, data) {
		callback(err, data);
	});
};
/**
 * exports.compileDoc
 * @param req : request object
 * @param res : response object
 */
exports.compileDoc = function (id, doc, callback) {
	// initialize the 'response' JS object to send back
	var response = {infos: [], errors: [], logs: "", compiledDocURI: null};
	// make temporary directory to create and compile latex pdf
	temp.mkdir("pdfcreator", function (err, dirPath) {
		var inputPath = path.join(dirPath, id + ".tex");
		var afterCompile = function (err) {
			// store the logs for the user here
			fs.readFile(path.join(dirPath, id + ".log"), function (err, data) {
				if (err) {
					response.errors.push("Error while trying to read logs.");
					callback(response);
					return;
				}

				response.logs = (data ? data.toString() : "");
				var errorStr = "An error occured before or during compilation";
				if (err) {
					response.errors.push(errorStr);
					callback(response);
					return;
				}

				var pdfTitle = id + ".pdf"
						, tempfile = path.join(dirPath, pdfTitle);
				fs.copy(tempfile, config.root + config.latex.pdfs + pdfTitle, function (err) {
					if (err) {
						console.log(err);
						response.errors.push(errorStr);
						callback(response);
						return;
					} else {
						response.infos.push("Successfully compiled '"
								+ doc.title
								+ "'");
						// make the compiledDocURI
						response.compiledDocURI = "/servepdf/" + id;
						response.compiledDocId = id;
						// send response back to user
						callback(response);
					}
				});
			});
		};
		fs.writeFile(inputPath, doc.data, function (err) {
			if (err) {
				response.errors.push("An error occured even before compiling");
				callback(response);
				return;
			}
			process.chdir(dirPath);
			var copyPackages = ["cp -r"
						, config.root + config.latex.includes + "."
						, dirPath + "/"].join(" ");
			exec(copyPackages, function (err) {
				if (err) {
					console.log(err);
					response.errors.push("Error copying additional "
							+ "packages/images to use during compilation");
					callback(response);
					return;
				}

				// compile the document (or at least try) 
				exec("pdflatex -interaction=nonstopmode " + inputPath + " > /dev/null 2>&1"
						, function () {
							exec("pdflatex -interaction=nonstopmode " + inputPath + " > /dev/null 2>&1"
									, afterCompile);
						});
			});
		});
	});
};
/**
 * exports.servePDF ->
 * @param req : request Object
 * @param res : result Object
 *
 */
exports.servePDF = function (req, res) {
	var id = req.params.pdfId
			, pdfPath = config.root + config.latex.pdfs + id + ".pdf";
	//console.log(pdfPath);
	fs.exists(pdfPath, function (exists) {
		if (!exists) {
			req.flash("error", "PDF not found");
			res.redirect("back");
			return;
		} else {
			res.type('application/pdf');
			//res.attachment(id + ".pdf"); // for douwnloading
			res.sendfile(pdfPath);
		}
	});
};
exports.getPDF = function (id, callback) {
	var pdfPath = config.root + config.latex.pdfs + id + ".pdf";
	//console.log(pdfPath);
	fs.exists(pdfPath, function (exists) {
		if (!exists) {
			callback("error", "PDF not found", null);
			return;
		} else {
			callback(null, pdfPath);
		}
	});
};
/**
 * Replace --MYSOC-- and create FOOTER
 */
exports.headfoot = function (entity, tex, callback) {
	mongoose.connection.db.collection('Mysoc', function (err, collection) {
		collection.findOne({_id: entity}, function (err, doc) {

			var mysoc = "";
			mysoc = "\\textbf{\\large " + doc.name + "}\\\\" + doc.address + "\\\\" + doc.zip + " " + doc.town;
			if (doc.phone)
				mysoc += "\\\\Tel : " + doc.phone;
			if (doc.fax)
				mysoc += "\\\\ Fax : " + doc.fax;
			if (doc.email)
				mysoc += "\\\\ Email : " + doc.email;
			if (doc.tva_intra)
				mysoc += "\\\\ TVA Intra. : " + doc.tva_intra;
			tex = tex.replace(/--MYSOC--/g, mysoc);
			var foot = "";
			foot = "\\textsc{" + doc.name + "} " + doc.address + " " + doc.zip + " " + doc.town;
			if (doc.phone)
				foot += " T\\'el.: " + doc.phone;
			if (doc.idprof1)
				foot += " R.C.S. " + doc.idprof1;
			tex = tex.replace(/--FOOT--/g, foot);
			tex = tex.replace(/--ENTITY--/g, "\\textbf{" + doc.name + "}");
			if (doc.iban)
				tex = tex.replace(/--IBAN--/g, doc.iban.name + "\\\\RIB : " + doc.iban.rib + "\\\\ IBAN : " + doc.iban.iban + "\\\\ BIC : " + doc.iban.bic);
			else
				tex = tex.replace(/--IBAN--/g, "RIB sur demande.");
			tex = tex.replace(/--LOGO--/g, doc.logo);
			tex = tex.replace(/é/g, "\\'e");
			tex = tex.replace(/è/g, "\\`e");
			callback(tex);
		});
	});
};
/**
 * Replace --MYSOC-- and create FOOTER for Supplier
 */
exports.headfootlight = function (entity, tex, callback) {
	mongoose.connection.db.collection('Mysoc', function (err, collection) {
		collection.findOne({_id: entity}, function (err, doc) {

			tex = tex.replace(/--MYSOC--/g, "\\textbf{\\large " + doc.name + "}\\\\" + doc.address + "\\\\" + doc.zip + " " + doc.town);
			//tex = tex.replace(/--FOOT--/g, "\\textsc{" + doc.name + "} " + doc.address + " " + doc.zip + " " + doc.town + " T\\'el.: " + doc.phone + " R.C.S. " + doc.idprof1);

			tex = tex.replace(/--ENTITY--/g, "\\textbf{" + doc.name + "}");
			if (doc.iban)
				tex = tex.replace(/--IBAN--/g, doc.iban.name + "\\\\RIB : " + doc.iban.rib + "\\\\ IBAN : " + doc.iban.iban + "\\\\ BIC : " + doc.iban.bic);
			else
				tex = tex.replace(/--IBAN--/g, "RIB sur demande.");
			tex = tex.replace(/é/g, "\\'e");
			tex = tex.replace(/è/g, "\\`e");
			callback(tex);
		});
	});
};
/**
 * Number price Format
 */
exports.price = function (price) {
	return accounting.formatMoney(price, {symbol: "€", format: "%v %s", decimal: ",", thousand: " ", precision: 2});
};
exports.number = function (number, precision) {
	return accounting.formatNumber(number, {decimal: ",", thousand: " ", precision: precision || 2});
};
exports.percent = function (number, precision) {
	return accounting.formatNumber(number, {symbol: "\\%", format: "%v %s", decimal: ",", thousand: " ", precision: precision || 2});
};
/**
 * Latex pipe convertion with a pipe
 */
/*
 template(doc)
 .apply(values)
 .on('error', function(err){
 throw err;
 })
 .finalize(function(bytes){
 console.log('The document is ' + bytes + ' bytes large.');
 })
 .pipe(createWriteStream('mydocument.odt'))
 .on('close', function(){
 console.log('document written');
 });
 */

exports.Template = createTemplate;
/**
 * Simply instantiates a new template instance.
 *
 * @param {String|Stream} arg The file path or stream with the odt data.
 */

function createTemplate(path, entity) {
	return new Template(path, entity);
}

/**
 * Class to work with odf templates.
 *
 * @param {String|Stream} arg The file path or stream with the tex data.
 */

function Template(arg, entity) {
	this.handlers = []; // variables
	this.entity = entity;
	// the constructor now works with a stream, too

	this.stream = fs.createReadStream(config.root + config.latex.models + arg);
}

// inherit from event emitter

util.inherits(Template, events.EventEmitter);
/**
 * Applies the values to the template and emits an `end` event.
 *
 * @param {Object} values The values to apply to the document.
 * @emit end {Archive} The read stream of the finished document.
 */

Template.prototype.apply = function (handler) {

	// provide a shortcut for simple value applying and convert to array
	this.handlers = _.values(_.reduce(handler, function (result, num, key) {
		num.id = key;
		result[key] = num;
		return result;
	}, {}));
	//console.log(this.handlers);

	// if the template is already running the action is complete

	if (this.processing)
		return this;
	// we have to wait for the number of entries.  they might be resolved in an
	// asynchronous way

	return apply.call(this);
	function apply() {

		// parse the tex file
		this
				.stream
				.on('data', this.processContent.bind(this));
		// the blip needs a resume to work properly
		this.processing = true;
		return this;
	}
};
/**
 * Parses the content and applies the handlers.
 *
 * @param {Stream} stream The to the content.
 * @api private
 */

Template.prototype.processContent = function (stream) {
	var emit = this.emit.bind(this);
	var self = this;
	async.waterfall(
			[
				parse(stream),
				this.applyHandlers(),
				this.applyHeadFoot()
						//this.append({name: 'content.xml'})
			], function (err, result) {
		// result now equals 'done'    

		if (err)
			return emit('error', err);
		emit('finalized', result);
		emit('compile', result);
	});
};
/**
 * Apply the content to the various installed handlers.
 *
 * @return {Function} function(content, done).
 * @api private
 */

Template.prototype.applyHandlers = function () {
	var handlers = this.handlers;

	function apply(handler, key, callback) {
		var value = "";

		switch (handler.type) {
			case "string" :
				if (handler.value) {
					value = handler.value.toString();
					//console.log(handler);
					value = value.replace(/_/gi, "\\_")
							.replace(/%/gi, "\\%")
							.replace(/&/gi, "\\&")
							.replace(/\n/g, " ");
				}
				break;
			case "area" :
				if (handler.value) {
					value = handler.value;
					value = value.replace(/_/gi, "\\_")
							.replace(/%/gi, "\\%")
							.replace(/&/gi, "\\&")
							.replace(/\n/g, "\\\\");
				}
				break;
			case "number" :
				value = accounting.formatNumber(handler.value, {decimal: ",", thousand: " ", precision: handler.precision || 2});
				break;
			case "euro" :
				value = accounting.formatMoney(handler.value, {symbol: "€", format: "%v %s", decimal: ",", thousand: " ", precision: 2});
				break;
			case "percent" :
				value = accounting.formatNumber(handler.value, {format: "%v %s", decimal: ",", thousand: " ", precision: handler.precision || 2});
				value = value.toString() + " \\%";
				break;
			case "date" :
				if (handler.value) {
					value = dateFormat(handler.value, handler.format);
				}
				break;
			case "cent":
				break;
			default :
				return callback("Handler not found : " + handler.type + " (" + handler.id + ")");
		}

		return callback(null, key, value);

	}

	return function (content, done) {
		//console.log(content);
		async.eachSeries(
				handlers,
				function (handler, next) {
					// apply the handlers to the content



					if (_.isArray(handler)) {
						if (!handler[0] || !handler[0].keys)
							return next("Array(0) row keys is missing " + handler.id);
						var columns = handler[0].keys;

						var output = "";

						async.eachSeries(handler, function (tabline, cb) {
							if (tabline.keys)
								return cb();

							for (var i = 0; i < columns.length; i++) {
								//console.log(tabline);
								if (typeof tabline[columns[i].key] === 'undefined')
									return next("Value not found in array : " + handler.id + " for key " + columns[i].key);

								if (columns[i].type === 'area') // Specific for array multilines
									tabline[columns[i].key] = "\\specialcell[t]{" + tabline[columns[i].key] + "\\\\}";

								apply(_.extend(columns[i], {value: tabline[columns[i].key]}), i, function (err, key, value) {
									if (err)
										return next(err);

									output += value;

									//console.log(key);
									if (key === columns.length - 1) { // end line
										output += "\\tabularnewline\n";
										cb();
									} else
										output += "&"; //next column

								});
							}

						}, function () {
							//console.log(output);
							content = content.replace(new RegExp("--" + handler.id + "--", "g"), output);
							next();
						});
					} else {
						apply(handler, handler.id, function (err, key, value) {
							if (err)
								return next(err);

							content = content.replace(new RegExp("--" + key + "--", "g"), value);
							next();
						})
					}
				},
				function (err) {
					if (err)
						return done(err);
					done(null, content);
				}
		);
	};
};
/**
 * Apply the head and foot to the various.
 *
 * @return {Function} function(content, done).
 * @api private
 */

Template.prototype.applyHeadFoot = function () {
	var entity = this.entity;
	var emit = this.emit.bind(this);
	return function (tex, done) {
		mongoose.connection.db.collection('Mysoc', function (err, collection) {
			collection.findOne({_id: entity}, function (err, doc) {
				if (err || !doc)
					return emit("error", "Entity not found");
				var mysoc = "";
				mysoc = "\\textbf{\\large " + doc.name + "}\\\\" + doc.address + "\\\\" + doc.zip + " " + doc.town;
				if (doc.phone)
					mysoc += "\\\\Tel : " + doc.phone;
				if (doc.fax)
					mysoc += "\\\\ Fax : " + doc.fax;
				if (doc.email)
					mysoc += "\\\\ Email : " + doc.email;
				if (doc.tva_intra)
					mysoc += "\\\\ TVA Intra. : " + doc.tva_intra;
				tex = tex.replace(/--MYSOC--/g, mysoc);
				var foot = "";
				foot = "\\textsc{" + doc.name + "} " + doc.address + " " + doc.zip + " " + doc.town;
				if (doc.phone)
					foot += " T\\'el.: " + doc.phone;
				if (doc.idprof1)
					foot += " R.C.S. " + doc.idprof1;
				tex = tex.replace(/--FOOT--/g, foot);
				tex = tex.replace(/--ENTITY--/g, "\\textbf{" + doc.name + "}");
				if (doc.iban)
					tex = tex.replace(/--IBAN--/g, doc.iban.name + "\\\\RIB : " + doc.iban.rib + "\\\\ IBAN : " + doc.iban.iban + "\\\\ BIC : " + doc.iban.bic);
				else
					tex = tex.replace(/--IBAN--/g, "RIB sur demande.");
				tex = tex.replace(/--LOGO--/g, doc.logo);
				tex = tex.replace(/é/g, "\\'e");
				tex = tex.replace(/è/g, "\\`e");
				done(null, tex);
			});
		});
	};
};
/**
 * Register a handler on the 'finalized' event.  This was formerly needed to
 * launch the finalization of the archive.  But this is done automatically now.
 */

Template.prototype.finalize = function (done) {
	this.on('finalized', done);
	return this;
};
/**
 * Register a handler on the 'finalized' event. This start latex compilation
 */

Template.prototype.compile = function () {
	var emit = this.emit.bind(this);
	this.on('compile', function (tex) {

		// make temporary directory to create and compile latex pdf
		temp.mkdir("pdfcreator", function (err, dirPath) {
			var inputPath = path.join(dirPath, "main.tex");
			var afterCompile = function (err) {
				// store the logs for the user here
				fs.readFile(path.join(dirPath, "main.log"), function (err, data) {
					if (err) {
						return emit('error', "Error while trying to read logs.");
					}

					var pdfTitle = "main.pdf"
							, tempfile = path.join(dirPath, pdfTitle);
					var outputStream = fs.createReadStream(tempfile);
					emit('pipe', outputStream);
					outputStream.on('end', function () {
						deleteFolderRecursive(dirPath);
					});
					return;
				});
			};
			fs.writeFile(inputPath, tex, function (err) {
				if (err) {
					console.log(err);
					return emit('error', "An error occured even before compiling");
				}
				process.chdir(dirPath);
				var copyPackages = ["cp -r"
							, config.root + config.latex.includes + "."
							, dirPath + "/"].join(" ");
				exec(copyPackages, function (err) {
					if (err) {
						console.log(err);
						return emit('error', "Error copying additional "
								+ "packages/images to use during compilation");
					}

					// compile the document (or at least try) 
					exec("pdflatex -interaction=nonstopmode " + inputPath + " > /dev/null 2>&1"
							, function () {
								exec("pdflatex -interaction=nonstopmode " + inputPath + " > /dev/null 2>&1"
										, afterCompile);
							});
				});
			});
		});
	});
	return this;
};
/**
 * Parses the tex file of the document.
 *
 * @param {Stream} stream The stream to parse.
 * @return {Function} function(done).
 * @api private
 */

function parse(stream) {
	return function (done) {
		done(null, stream.toString('utf8'));
	};
}


/*
 * Remove compile directory
 * @param {type} path
 * @returns {undefined}
 */
function deleteFolderRecursive(path) {
	var files = [];
	if (fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach(function (file, index) {
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}
;
/**
 * Proxy the archive `pipe()` method.
 */

Template.prototype.pipe = function () {
	var out = arguments;
	this.on('pipe', function (streamOutput) {
		streamOutput.pipe.apply(streamOutput, out);
	});
	return this;
};

"use strict";

var mongoose = require('mongoose'),
		fs = require("fs-extra"),
		temp = require("temp"),
		path = require("path"),
		exec = require("child_process").exec,
		config = require('../../config/config');

exports.loadModel = function(file, callback) {
	fs.readFile(config.root + config.latex.models + file, 'utf8', function(err, data) {
		callback(err, data);
	});
};

/**
 * exports.compileDoc
 * @param req : request object
 * @param res : response object
 */
exports.compileDoc = function(id, doc, callback) {
	// initialize the 'response' JS object to send back
	var response = {infos: [], errors: [], logs: "", compiledDocURI: null};

	// make temporary directory to create and compile latex pdf
	temp.mkdir("pdfcreator", function(err, dirPath) {
		var inputPath = path.join(dirPath, id + ".tex");

		var afterCompile = function(err) {
			// store the logs for the user here
			fs.readFile(path.join(dirPath, id + ".log"), function(err, data) {
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

				fs.copy(tempfile, config.root + config.latex.pdfs + pdfTitle, function(err) {
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
						// send response back to user
						callback(response);
					}
				});
			});
		};

		fs.writeFile(inputPath, doc.data, function(err) {
			if (err) {
				response.errors.push("An error occured even before compiling");
				callback(response);
				return;
			}
			process.chdir(dirPath);

			var copyPackages = ["cp -r"
						, config.root + config.latex.includes + "."
						, dirPath + "/"].join(" ");

			exec(copyPackages, function(err) {
				if (err) {
					console.log(err);
					response.errors.push("Error copying additional "
							+ "packages/images to use during compilation");
					callback(response);
					return;
				}

				// compile the document (or at least try) 
				exec("pdflatex -interaction=nonstopmode " + inputPath + " > /dev/null 2>&1"
						, function() {
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
exports.servePDF = function(req, res) {
	var id = req.params.pdfId
			, pdfPath = config.root + config.latex.pdfs + id + ".pdf";

	//console.log(pdfPath);
	fs.exists(pdfPath, function(exists) {
		if (!exists) {
			req.flash("error", "PDF not found");
			res.redirect("back");
			return;
		} else {
			res.type('pdf');
			res.attachment(id + ".pdf");
			res.sendfile(pdfPath);
		}
	});
};

/**
 * Replace --MYSOC-- and create FOOTER
 */
exports.headfoot = function(entity, tex, callback) { //\textsc{Symeos} 158 av. Leon Blum F-63000 Clermont-Ferrand. Tél.: +33 (0) 4 27 46 39 60 - R.C.S. Clermont-Ferrand  483 278 842
	mongoose.connection.db.collection('Mysoc', function(err, collection) {
		collection.findOne({_id: entity}, function(err, doc) {

			tex = tex.replace(/--MYSOC--/g, doc.name + "\\\\" + doc.address + "\\\\" + doc.zip + " " + doc.town);
			tex = tex.replace(/--FOOT--/g, "\\textsc{" + doc.name + "} " + doc.address + " " + doc.zip + " " + doc.town + " T\\'el.: " + doc.phone + " R.C.S. " + doc.idprof1);

			callback(tex);
		});
	});
};
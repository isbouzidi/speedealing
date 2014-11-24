"use strict";

var mongoose = require('mongoose'),
		fs = require("fs-extra"),
		temp = require("temp"),
		path = require("path"),
		accounting = require("accounting"),
		exec = require("child_process").exec,
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
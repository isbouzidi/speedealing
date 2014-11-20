"use strict";

var mongoose = require('mongoose'),
		config = require('../../config/config');

var Dict = require('../controllers/dict')

module.exports = function(app, passport, auth) {
	
	app.get('/api/conf', auth.requiresLogin, function(req, res) {
		Dict.conf(req.query, function(err, dict){
			if(err) {
				console.log(err);
				res.send(500);
			}
			res.json(conf);
				
		});
	});

	app.get('/api/dict', auth.requiresLogin, function(req, res) {
		Dict.dict(req.query, function(err, dict){
			if(err) {
				console.log(err);
				res.send(500);
			}
			res.json(dict);
				
		});
	});
	
	// File type icons TODO put it in dict
	app.get('/dict/filesIcons', auth.requiresLogin, function(req, res) {
		var iconList = {
			aac: "file-aac",
			avi: "file-avi",
			bat: "file-bat",
			bmp: "file-bmp",
			chm: "file-chm",
			css: "file-css",
			dat: "file-dat",
			default: "file-default",
			dll: "file-dll",
			xls: "file-excel",
			xlsx: "file-excel",
			exe: "file-exe",
			fon: "file-fon",
			gif: "file-gif",
			html: "file-html",
			tiff: "file-image",
			ini: "file-ini",
			jar: "file-jar",
			jpg: "file-jpg",
			js: "file-js",
			log: "file-log",
			mov: "file-mov",
			mp3: "file-mp",
			mpg: "file-mpg",
			otf: "file-otf",
			pdf: "file-pdf",
			png: "file-png",
			ppt: "file-powerpoint",
			reg: "file-reg",
			rtf: "file-rtf",
			swf: "file-swf",
			sys: "file-sys",
			txt: "file-txt",
			ttc: "file-ttc",
			ttf: "file-ttf",
			vbs: "file-vbs",
			wav: "file-wav",
			wma: "file-wma",
			wmv: "file-wmv",
			doc: "file-word",
			docx: "file-word",
			xml: "file-xml"
		};

		res.send(200, iconList);
	});
	
	app.get('/api/extrafield', auth.requiresLogin, function(req, res) {
		Dict.extrafield(req.query, function(err, extrafield){
			if(err) {
				console.log(err);
				res.send(500);
			}
			res.json(extrafield);
		});
	});

	//other routes..
};

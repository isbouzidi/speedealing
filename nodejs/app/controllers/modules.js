"use strict";

var async = require('async'),
		mongoose = require('mongoose'),
		fs = require('fs'),
		i18n = require("i18next"),
		_ = require('underscore');

var menus = {};

console.log("Loading Speedealing modules...");

fs.readdirSync(__dirname + '/../../config/modules').forEach(function(file) {
	if (file === "index.js")
		return;
	if (file.indexOf('.json') == null) // exclude not json
		return;

	fs.readFile(__dirname + '/../../config/modules/' + file, 'utf8', function(err, data) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}

		data = JSON.parse(data);

		/* Load Menu : 3 levels MAX */

		for (var i in data.menus) {
			if (data.menus[i].title)
				data.menus[i].title = i18n.t(data.menus[i].title);
			if (data.menus[i].submenus) {
				for (var j in data.menus[i].submenus) {
					if (data.menus[i].submenus[j].title)
						data.menus[i].submenus[j].title = i18n.t(data.menus[i].submenus[j].title);
					if (data.menus[i].submenus[j].submenus) {
						for (var k in data.menus[i].submenus[j].submenus) {
							if (data.menus[i].submenus[j].submenus[k].title)
								data.menus[i].submenus[j].submenus[k].title = i18n.t(data.menus[i].submenus[j].submenus[k].title);
						}
					}
				}
			}
		}

		menus = _.defaults(menus, data.menus);

		for (var i in data.menus) {
			if (data.menus[i].submenus) {
				menus[i] = _.defaults(menus[i], data.menus[i]);
				menus[i].submenus = _.defaults(menus[i].submenus, data.menus[i].submenus);
				for (var j in data.menus[i].submenus) {
					if (data.menus[i].submenus[j].submenus) {
						menus[i].submenus[j] = _.defaults(menus[i].submenus[j], data.menus[i].submenus[j]);
						menus[i].submenus[j].submenus = _.defaults(menus[i].submenus[j].submenus, data.menus[i].submenus[j].submenus);
					}
				}
			}
		}

		//console.dir(menus);
	});
});

exports.menus = function(req, res) {
	res.json(menus);
};

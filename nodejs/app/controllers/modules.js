"use strict";

var async = require('async'),
		mongoose = require('mongoose'),
		fs = require('fs'),
		i18n = require("i18next"),
		_ = require('lodash');

var menus = {};
var rights = [];

console.log("Loading Speedealing modules...");

fs.readdirSync(__dirname + '/../../config/modules').forEach(function (file) {
	if (file === "index.js")
		return;
	if (file.indexOf('.json') == null) // exclude not json
		return;

	fs.readFile(__dirname + '/../../config/modules/' + file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}

		data = JSON.parse(data);

		/* Load rights */

		if (data.enabled) {

			rights.push({
				name: data.name,
				desc: data.description,
				rights: data.rights
			});

		}

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

exports.menus = function (req, res) {
	var result = {};
	
	//console.dir(menus);

	function checkright(perms) {
		if (!req.user.admin && typeof perms == "string") {
			var perm = perms.split(".");
			console.log(perm);

			if (perm[0] === "admin" && !req.user.admin) // super administrator
				return false;

			if (perm.length == 2) {
				if (!req.user.rights[perm[0]] || !req.user.rights[perm[0]][perm[1]])
					return false;
			}
		}
		return true;
	}

	for (var i in menus) {
		// Check right
		var found0 = false;

		if (checkright(menus[i].perms))
			found0 = true;

		result[i] = _.clone(menus[i], true);

		for (var j in menus[i].submenus) {
			var found1 = false;
			
			if (checkright(menus[i].submenus[j].perms)) {
				found1 = true;
				found0 = true;
			}

			for (var k in menus[i].submenus[j].submenus) {
				if (checkright(menus[i].submenus[j].submenus[k].perms)) {
					found0=true;
					found1=true;
				}
				else
					delete result[i].submenus[j].submenus[k];
			}
			
			if(!found1)
				delete result[i].submenus[j];
			
		}
		
		if(!found0)
			delete result[i];
	}
	res.json(result);
};

exports.rights = function (req, res) {
	res.json(rights);
};
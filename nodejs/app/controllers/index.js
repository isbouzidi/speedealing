"use strict";

var async = require('async'),
		mongoose = require('mongoose'),
		fs = require('fs'),
		config = require('../../package.json');

var conf = {}; // for conf data const

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

var ModuleModel = mongoose.model('module', moduleSchema, 'DolibarrModules');

/*
 * GET home page.
 */

//var ModuleModel = mongoose.model('module');
var AgendaModel = mongoose.model('agenda');


/**
 * Refresh MAP/REDUCE for menu
 */

var map_reduce = {};
map_reduce.menuList = {};
map_reduce.menuList.map = function() {
	if (this.menus) {
		this.menus.forEach(function(tag) {
			if (tag.type) {
				emit({menu: tag._id, position: tag.position}, tag);
			}
		});
	}
};
map_reduce.menuList.map = map_reduce.menuList.map.toString();
map_reduce.menuList.reduce = function(key, values) {
	db.result.save(values[0]);

	return null;
};
map_reduce.menuList.reduce = map_reduce.menuList.reduce.toString();
map_reduce.menuList.out = {replace: "view_listMenu"};
map_reduce.menuList.query = {enabled: true};
/*ModuleModel.mapReduce(map_reduce.menuList, function(err) {
 if (err)
 console.log(err);
 });*/

map_reduce.submenuList = {};
map_reduce.submenuList.map = function() {
	if (this.menus) {
		this.menus.forEach(function(tag) {
			if (!tag.type) {
				emit({menu: tag.fk_menu, position: tag.position}, tag);
			}
		});
	}
};
map_reduce.submenuList.map = map_reduce.submenuList.map.toString();
map_reduce.submenuList.reduce = function(key, values) {
	db.result.save(values[0]);

	return null;
};
map_reduce.submenuList.reduce = map_reduce.submenuList.reduce.toString();
map_reduce.submenuList.out = {replace: "view_listSubmenu"};
map_reduce.submenuList.query = {enabled: true};
/*ModuleModel.mapReduce(map_reduce.submenuList, function(err) {
 if (err)
 console.log(err);
 });*/

map_reduce.countTODO = {};

map_reduce.countTODO.map = function() {
	if (this.Status == "TODO" && this.usertodo.length)
		for (var i = 0; i < this.usertodo.length; i++)
			emit(this.usertodo[i].id, 1);
};

map_reduce.countTODO.map = map_reduce.countTODO.map.toString();
map_reduce.countTODO.reduce = function(user, cpt) {
	return Array.sum(cpt);
};
map_reduce.countTODO.reduce = map_reduce.countTODO.reduce.toString();
map_reduce.countTODO.out = {inline: 1};

/**
 * List Services and Angular Controllers
 */

var angular = {};
angular.services = [];
angular.controllers = [];

fs.readdirSync(__dirname + '/../../public/js/speedealing/services').forEach(function(file) {
	angular.services.push(file);
});

fs.readdirSync(__dirname + '/../../public/js/speedealing/controllers').forEach(function(file) {
	angular.controllers.push(file);
});

exports.render = function(req, res) {
	var url = "/";

	/**
	 * Generate the menu
	 */

	if (req.query.idmenu) // save the menu position
		req.session.idmenu = req.query.idmenu;

	// load the menu
	var topmenu = [];
	var submenu = [];

	var countTodo = 0;
	var eventTodo = [];

	var menuHTML = "";

	// load conf and const
	ModuleModel.find({}, "name numero enabled always_enabled family version picto moddir dirs depends requireby need_dolibarr_version const langfiles boxes", function(err, docs) {
		if (err) {
			console.log(err);
			return;
		}

		req.conf = {};

		for (var i in docs) {
			var modulename = docs[i].name.toLowerCase();

			if (typeof docs[i].enabled === 'undefined') // undefined = false
				docs[i].enabled = false;
			conf[modulename] = docs[i];
		}

		async.parallel(
				[
					//load top menu
					function(callback) {
						ModuleModel.aggregate([
							{'$match': {enabled: true}},
							{'$unwind': "$menus"},
							{'$project': {_id: {menu: '$menus._id', position: '$menus.position'}, value: '$menus'}},
							{'$match': {"value.type": "top"}},
							{'$sort': {"value.position": 1}}
						], function(err, docs) {
							//console.log(docs);
							topmenu = docs;
							callback();
							//});
						});
					},
					//load submenu
					function(callback) {
						ModuleModel.aggregate([
							{'$match': {enabled: true}},
							{'$unwind': "$menus"},
							{'$project': {_id: {menu: '$menus.fk_menu', position: '$menus.position'}, value: '$menus'}},
							{'$match': {"value.type": {"$ne": "top"}}},
							{'$sort': {"value.position": 1}}
						],
								function(err, docs) {

									for (var i in docs) {
										var menu = docs[i].value;

										var newTabMenu = verifyMenu(menu, req);
										//console.log(newTabMenu);

										if (newTabMenu.enabled && newTabMenu.perms) {
											if (typeof submenu[docs[i]._id.menu] === 'undefined')
												submenu[docs[i]._id.menu] = [];

											submenu[docs[i]._id.menu].push(newTabMenu);
										}
									}

									callback();
									//});
								});
					},
					// Get Count task todo
					function(callback) {
						map_reduce.countTODO.query = {"usertodo.id": req.user._id};
						AgendaModel.mapReduce(map_reduce.countTODO, function(err, doc) {
							if (err) {
								console.log(err);
								callback();
								return;
							}

							console.log(doc);

							if (doc.length === 0)
								countTodo = 0;
							else
								countTodo = doc[0].value;

							callback();
						});
					},
					// Get Count task todo
					function(callback) {
						// Get All task list for menu
						var datep = new Date();
						datep.setHours(0);
						datep.setMinutes(0);
						datep.setSeconds(0);
						datep.setMilliseconds(0);
						//console.log(datep);

						var datef = new Date();
						datef.setHours(23);
						datef.setMinutes(59);
						datef.setSeconds(59);
						datef.setMilliseconds(999);
						//console.log(datef);

						AgendaModel.find({Status: {$ne: "DONE"}, "usertodo.id": req.user._id, datep: {'$gt': datep, '$lte': datef}}, function(err, docs) {
							if (err) {
								console.log(err);
								callback();
								return;
							}

							for (var i in docs) {
								var data = {};

								data._id = docs[i]._id;
								if (docs[i].societe)
									data.societe = docs[i].societe.name;

								data.label = docs[i].label;

								var d = new Date(docs[i].datep);

								data.event = {};
								data.event.datetime = d.toString();
								data.event.day = d.getDate();
								data.event.month = req.i18n.t("date.dayShort." + d.getDay());
								data.event.hour = d.getHours() + ":" + (d.getMinutes() <= 9 ? ('0' + d.getMinutes()) : d.getMinutes());

								eventTodo.push(data);
							}
							callback();
						});
					}
				], function() {
			//console.log(JSON.stringify(topmenu));
			//console.log(JSON.stringify(submenu));
			var menuHTML = "";
			var idsel;

			var selected;

			for (var i in topmenu) {
				topmenu[i] = topmenu[i].value;
				if (topmenu[i].enabled) {
					idsel = (topmenu[i]._id == null ? 'none' : topmenu[i]._id);
					//if(topmenu[i].perms)

					selected = genSubmenu(topmenu[i], 1);
				}
			}

			function genSubmenu(menuFather, level) { // function recursive
				var selectnow = false;
				var result = submenu[menuFather._id];

				var menu = {};

				if (typeof result === 'undefined') { // be a <li> link menu

					menuHTML += '<li>';

					//if (!empty($this->idmenu) && $this->menuSelected($menuFather))
					//	$classname = "current navigable-current";

					//$url = $this->menuURL($menuFather, $menuFather->_id);

					if (typeof menuFather.position === 'undefined')
						menuFather.position = 0;

					menu.classname = "";
					menu.url = menuFather.url;
					menu.title = menuFather.title;

					menuHTML += '<a class="' + menu.classname + '" href="' + menu.url + '" target="_self">';
					menuHTML += menuFather.title;
					menuHTML += '</a>';
					menuHTML += '</li>';

					return false;
				}

				if (typeof menuFather.position === 'undefined')
					menuFather.position = 0;

				menu.count = result.length;
				menu.url = "";
				if (menuFather.type === 'top')
					menu.title = req.i18n.t((menuFather.langs ? menuFather.langs + ":" : "") + menuFather.title);
				else
					menu.title = menuFather.title;

				menuHTML += '<li class="with-right-arrow">';
				//menuHTML+='<span><span class="list-count">' + result.length + '</span>' + menuFather.title + '</span>';
				menuHTML += '<span>' + menu.title + '</span>';
				menuHTML += '<ul class="big-menu ';
				if (level == 1)
					menuHTML += 'grey-gradient">';
				else
					menuHTML += 'anthracite-gradient">';

				menu.menu = [];

				for (i in result) {

					var selected = genSubmenu(result[i], (level + 1));

					if (selected)
						selectnow = selected;
				}

				menuHTML += '</ul>';
				menuHTML += '</li>';

				return selectnow;
			}

			res.render('index', {title: "Speedealing", href: url, agenda: {count: countTodo, task: eventTodo}, menuHTML: menuHTML, version: config.version, angular: angular});
		});
	});
};

function verifyMenu(newTabMenu, req) {
	var perms = true;

	if (newTabMenu.perms)
		perms = newTabMenu.perms;

	var enabled = true;

	// conversion old syntax PHP $conf->module->enabled
	if (newTabMenu.enabled && typeof newTabMenu.enabled === 'string') {
		if (newTabMenu.enabled.search('$') > -1) {
			newTabMenu.enabled = newTabMenu.enabled.replace(/\$/g, '');
			newTabMenu.enabled = newTabMenu.enabled.replace(/->/g, '.');
		}

		if (newTabMenu.enabled.search('user') == 0) // for $user->admin (perms)
			eval("enabled = req." + newTabMenu.enabled);
		else
			eval("enabled = " + newTabMenu.enabled);
	}

	//console.log(newTabMenu);

	newTabMenu.enabled = enabled;
	newTabMenu.title = req.i18n.t((newTabMenu.langs ? newTabMenu.langs + ":" : "") + newTabMenu.title);
	newTabMenu.perms = perms;

	return newTabMenu;
}

exports.home = function(req, res) {


	res.render('partials/home', {user: req.user});
};

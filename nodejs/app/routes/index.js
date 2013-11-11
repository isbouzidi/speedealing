"use strict";

var async = require('async'),
		mongoose = require('mongoose'),
		fs = require('fs');

var conf = {}; // for conf data const

/*
 * GET home page.
 */

var ModuleModel = mongoose.model('module');
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
ModuleModel.mapReduce(map_reduce.menuList, function(err) {
	if (err)
		console.log(err);
});

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
ModuleModel.mapReduce(map_reduce.submenuList, function(err) {
	if (err)
		console.log(err);
});

map_reduce.countTODO = {};
map_reduce.countTODO.map = function() {
	if (this.Status == "TODO" && this.usertodo.id)
		emit(this.usertodo.id, 1);
};
map_reduce.countTODO.map = map_reduce.countTODO.map.toString();
map_reduce.countTODO.reduce = function(user, cpt) {
	return Array.sum(cpt);
};
map_reduce.countTODO.reduce = map_reduce.countTODO.reduce.toString();
map_reduce.countTODO.out = {inline: 1};

exports.index = function(req, res) {
	var url = "/";

	/**
	 * Redirect to PHP
	 */

	res.redirect('index.php');
	return;

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
						ModuleModel.mapReduce(map_reduce.menuList, function(err, model, stats) {
							if (err) {
								console.log(err);
								callback();
								return;
							}
							model.find({}, "", {sort: {"_id.position": 1}}, function(err, docs) {
								topmenu = docs;
								callback();
							});
						});
					},
					//load submenu
					function(callback) {
						ModuleModel.mapReduce(map_reduce.submenuList, function(err, model, stats) {
							if (err) {
								console.log(err);
								callback();
								return;
							}
							model.find({}, "", {sort: {"_id.position": 1}}, function(err, docs) {

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
							});
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
						var d = new Date();
						d.setHours(0);
						d.setMinutes(0);
						d.setSeconds(0);
						d.setMilliseconds(0);
						var dateStart = d.toJSON();
						d.setHours(23);
						d.setMinutes(59);
						d.setSeconds(59);
						d.setMilliseconds(999);
						var dateEnd = d.toJSON();

						AgendaModel.find({Status: {$ne: "DONE"}, "usertodo.id": req.user._id}, function(err, docs) {
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
								data.event.month = req.i18n.t("main.date.dayShort." + d.getDay());
								data.event.hour = d.getHours() + ":" + (d.getMinutes() <= 9 ? ('0' + d.getMinutes()) : d.getMinutes());

								eventTodo.push(data);
							}
							callback();
						});
					}
				], function() {
			//console.log(JSON.stringify(topmenu));
			console.log(JSON.stringify(submenu));
			var menuHTML = "";
			var idsel;

			var selected;

			for (i in topmenu) {
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
					menu.url = "";
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
				menu.title = menuFather.title;

				menuHTML += '<li class="with-right-arrow">';
				//menuHTML+='<span><span class="list-count">' + result.length + '</span>' + menuFather.title + '</span>';
				menuHTML += '<span>' + menuFather.title + '</span>';
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

			res.render('index', {title: "Speedealing", href: url, agenda: {count: countTodo, task: eventTodo}, menuHTML: menuHTML});
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

	newTabMenu.enabled = enabled;
	newTabMenu.title = req.i18n.t("menu." + newTabMenu.title);
	newTabMenu.perms = perms;

	return newTabMenu;
}

module.exports = function(app, ensureAuthenticated) {
	fs.readdirSync(__dirname).forEach(function(file) {
		if (file === "index.js")
			return;
		var name = file.substr(0, file.indexOf('.'));
		require('./' + name)(app, ensureAuthenticated);
	});
};

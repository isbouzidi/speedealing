"use strict";

var fs = require('fs');


module.exports = function (app, passport, auth, usersSocket) {
	fs.readdirSync(__dirname).forEach(function (file) {
		if (file === "index.js")
			return;
		if (file.indexOf('.old') >= 0) // exclude old files
			return;

		var name = file.substr(0, file.indexOf('.'));
		require('./' + name)(app, passport, auth, usersSocket);
	});
};

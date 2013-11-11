/**
 * Module dependencies.
 */
var express = require('express'),
		http = require('http'),
		fs = require('fs'),
		passport = require('passport'),
		logger = require('mean-logger');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

//Load configurations
//if test env, load example file
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
		config = require('./config/config'),
		auth = require('./config/middlewares/authorization'),
		mongoose = require('mongoose');

//Bootstrap db connection
var db = mongoose.connect(config.db, {server: {auto_reconnect: true}});

var mongoose_connect = mongoose.connection;
mongoose_connect.on('error', console.error.bind(console, 'connection mongodb error native :'));
mongoose_connect.once('open', function callback() {
	console.log("mongoose mongoDB connected");
});

//Bootstrap models
var models_path = __dirname + '/app/models';
var walk = function(path) {
	fs.readdirSync(path).forEach(function(file) {
		var newPath = path + '/' + file;
		var stat = fs.statSync(newPath);
		if (stat.isFile()) {
			if (/(.*)\.(js|coffee)/.test(file)) {
				require(newPath);
			}
		} else if (stat.isDirectory()) {
			walk(newPath);
		}
	});
};
walk(models_path);



var app;

// Speedealing Schema
require('./config/extrafields')(function() {
	//bootstrap passport config
	require('./config/passport')(passport);

	app = express();

	//express settings
	require('./config/express')(app, passport, db);

	//Bootstrap routes
	require('./config/routes')(app, passport, auth);

	// Speedealing routes
	require('./app/routes')(app, ensureAuthenticated);
	
	//Home route
	var index = require('./app/controllers/index');
	app.get('*', index.render);


	//Start the app by listening on <port>
	var server = http.createServer(app).listen(app.get('port'), function() {
		console.log('Express server listening on port ' + app.get('port'));
	});

	// Start socket.io
	require('./config/socket.io')(server);

	//Initializing logger
	logger.init(app, passport, mongoose);

});



//expose app
exports = module.exports = app;

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	/*if(config.autologin && req.query && req.query.user && req.query.key === config.autologin.key) {
	 console.log("auto_login");
	 req.session.auth = {};
	 req.session.auth.userId = "user:"+req.query.user;
	 req.session.auth.loggedIn = true;
	 if(req.query.backto)
	 return res.redirect(req.query.backto);
	 else
	 return next();
	 }*/

	if (config.urlrewrite) {
		if (req.query.db)
			res.redirect(req.query.db + '/login');
		else
			// use the default database
			res.redirect(config.mongo.database + '/login');
	} else
		res.redirect('/index.php');

}

/**
 * Module dependencies
 */

var express = require('express'),
		http = require('http'),
		path = require('path'),
		fs = require('fs'),
		util = require('util'),
		i18n = require("i18next"),
		everyauth = require('everyauth'),
		mongodb = require('mongodb'),
		hbs = require("hbs");

var MongoStore = require('connect-mongo')(express);

/**
 * Load config File
 */

mongoose = require('mongoose');

var bd = require('./bd'),
		assert = require('assert');

/**
 * Mongoose Started
 */

bd.connect();
bd.loadModules();

/**
 * Authenticate module
 */

everyauth.debug = false;

everyauth.everymodule.findUserById(function(id, callback) {
	//console.log("findUserById");
	mongodb.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.database, {server: {auto_reconnect: true}}, function(err, db) {
		if (err)
			callback(null, err);

		var collection = db.collection('User');

		collection.findOne({'_id': id}, function(err, doc) {
			// Let's close the db
			db.close();

			if (err) {
				console.log("login error:" + id + " " + JSON.stringify(err));
				callback(null, err);
			}

			var user = {};
			for (i in doc) {
				user[i] = doc[i];
			}

			user.login = user.name; // rename login

			callback(null, user);
		});
	});
});

everyauth.password
		.getLoginPath('/login') // Uri path to the login page
		.postLoginPath('/login') // Uri path that your login form POSTs to
		.loginView('login.html')
		.authenticate(function(login, password) {
	var promise;

	var errors = [];
	if (!login)
		errors.push('Missing login');
	if (!password)
		errors.push('Missing password');
	if (errors.length)
		return errors;

	promise = this.Promise();

	mongodb.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.database, {server: {auto_reconnect: true}}, function(err, db) {
		if (err)
			throw err;

		var collection = db.collection('User');

		collection.findOne({'_id': 'user:' + login}, function(err, doc) {

			if (err || doc == null) {
				console.log("login error:" + login + " " + JSON.stringify(err));
				db.close();
				return promise.fulfill(['Login failed']);
			}

			var user = doc;
			user.id = user._id; // Need for using with mongo

			if (!user) {
				db.close();
				return promise.fulfill(['Login failed']);
			}
			if (user.password !== password) {
				db.close();
				return promise.fulfill(['Login failed']);
			}

			// update date connection

			collection.update({_id: doc._id}, {$set: {LastConnection: doc.NewConnection, NewConnection: new Date()}}, function(err, doc) {
				if (err) {
					console.log("login datetime error : " + err);
				}
			});
// Let's close the db
			db.close();
			return promise.fulfill(user);

		});
	});

	return promise;
})
		.loginSuccessRedirect('/') // Where to redirect to after a login
		.getRegisterPath('/register') // Uri path to the registration page
		.postRegisterPath('/register') // The Uri path that your registration form POSTs to
		.registerView('a string of html; OR the name of the jade/etc-view-engine view')
		.validateRegistration(function(newUserAttributes) {
	// Validate the registration input
	// Return undefined, null, or [] if validation succeeds
	// Return an array of error messages (or Promise promising this array)
	// if validation fails
	//
	// e.g., assuming you define validate with the following signature
	// var errors = validate(login, password, extraParams);
	// return errors;
	//
	// The `errors` you return show up as an `errors` local in your jade template
})
		.registerUser(function(newUserAttributes) {
	// This step is only executed if we pass the validateRegistration step without
	// any errors.
	//
	// Returns a user (or a Promise that promises a user) after adding it to
	// some user store.
	//
	// As an edge case, sometimes your database may make you aware of violation
	// of the unique login index, so if this error is sent back in an async
	// callback, then you can just return that error as a single element array
	// containing just that error message, and everyauth will automatically handle
	// that as a failed registration. Again, you will have access to this error via
	// the `errors` local in your register view jade template.
	// e.g.,
	// var promise = this.Promise();
	// User.create(newUserAttributes, function (err, user) {
	//   if (err) return promise.fulfill([err]);
	//   promise.fulfill(user);
	// });
	// return promise;
	//
	// Note: Index and db-driven validations are the only validations that occur 
	// here; all other validations occur in the `validateRegistration` step documented above.
})
		.registerSuccessRedirect('/')
		.loginFormFieldName('name')       // Defaults to 'login'
		.passwordFormFieldName('password')
		.respondToLoginSucceed(function(res, user, req) {
	if (user) { /* Then the login was successful */
		//console.log(user);
		res.json({success: true}, 200);
	}
})
		.respondToLoginFail(function(req, res, errors, login) {
	if (!errors || !errors.length)
		return;
	return res.json({success: false, errors: errors}, 401);
});

/** 
 * config translate
 */

var i18nextMongoSync = require('i18next/backends/mongoDb/index');
i18nextMongoSync.connect({
	host: config.mongo.host,
	port: config.mongo.port,
	dbName: config.mongo.database,
	resCollectionName: "i18next"
			/*username: "usr",
			 password: "pwd",
			 options: {
			 auto_reconnect: true, // default true
			 ssl: false // default false
			 }
			 */
}, function() {
	i18n.backend(i18nextMongoSync);

	i18n.init({
		ns: {namespaces: ['ns.common'], defaultNs: 'ns.common'},
		supportedLngs: ['en-US', 'fr-FR'],
		preload: ['fr-FR'],
		cookie: 'speedealingLang',
		resSetPath: 'locales/__lng__/new.__ns__.json',
		saveMissing: true,
		debug: false,
		sendMissingTo: 'fallback'
	});
});

hbs.registerHelper('t', function(i18n_key) {
	var result = i18n.t(i18n_key);

	return new hbs.SafeString(result);
});

// include template partials
hbs.registerPartials(__dirname + '/views/partials');

var app = express();

/**
 * Configuration
 */

//configure Express
app.configure(function() {
	app.set('port', config.nodejs_port || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');
	app.engine('html', require('hbs').__express);
	app.use(express.logger('dev'));
	// For POST XML in webservices
	app.use(function(req, res, next) {
		var type = req.get('Content-Type')
		//console.log(type);
		if (typeof type === 'string' && type.indexOf('text/xml') < 0)
			return next();

		var data = '';
		req.setEncoding('utf8');

		req.on('data', function(chunk) {
			data += chunk;
		});
		req.on('end', function() {
			req.rawBody = data;
			next();
		});
	});
	app.use(express.cookieParser());
	app.use(express.bodyParser({uploadDir: './uploads'}));
	app.use(i18n.handle);

	app.use(express.session({
		secret: config.secret,
		key: 'SpeedSession',
		cookie: {
			maxAge: 36000000
					//expires: new Date(Date.now() + 3600000) //1 Hour
		},
		//store: new express.session.MemoryStore()
		store: new MongoStore({
			db: new mongodb.Db("session", new mongodb.Server(config.mongo.host, config.mongo.port, {server: {auto_reconnect: true}}), {w: 1})
		})
				//store: new MongoStore({host: config.mongo.host, port: config.mongo.port, db: 'session', collection: 'sessions', "options": {// all optional
				//		"autoReconnect": true}})
				//store: new MongoStore({host: config.mongo.host, port: config.mongo.port, db: 'session', options: {// all optional
				//		autoReconnect: true}})
	}));
	app.use(everyauth.middleware());
	app.use(express.methodOverride());


	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
	app.use(express.csrf());
});

i18n.registerAppHelper(app)
		.serveClientScript(app)
		.serveDynamicResources(app)
		.serveMissingKeyRoute(app);

/**
 *  Create token against CSRF vulnerabilities
 *
 app.dynamicHelpers({
 token: function(req, res) {
 return req.session._csrf;
 }
 });*/

app.configure('dev', function() {
	app.locals.pretty = true;
});

//log error
app.use(function(err, req, res, next) {
	if (!err)
		return next(); // you also need this line

	if (req.user)
		err.user = req.user.username;
	err.path = req.url;
	console.log(err);
	if (err.errorCode && err.msg)
		res.send(err.errorCode, err.msg);
	else
		res.send(500, "Internal error!!!");
});
//app.use(express.errorHandler());




app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

require('./core/extrafields.js')(function() {

	var routes = require('./routes'),
		api = require('./routes/api');

	/**
	 * Routes
	 */

	//serve index and view partials
	app.get('/', ensureAuthenticated, routes.index);
	app.get('/partials/:name', ensureAuthenticated, routes.partials);

	app.get('/api/session', function(req, res) {
		if (req.user) {
			//console.log('session : ' + req.user.login);
			return res.send(200, {'user': req.user.login, 'email': req.user.email});
		} else {
			return res.send(401, {}); // no session
		}

	});

	/** Load webservices **/
	require('./api')(app, ensureAuthenticated);

	//JSON API
	app.get('/api/name', ensureAuthenticated, api.name);

	//redirect all others to the index (HTML5 history)
	app.get('*', ensureAuthenticated, routes.index);

	/**
	 * Start Server
	 */

	var server = http.createServer(app).listen(app.get('port'), function() {
		console.log('Express server listening on port ' + app.get('port'));
	});

	/** WebSocket */
	var sockets = require('socket.io').listen(server, {log: false}).of('/notification');
	sockets.on('connection', function(socket) { // New client
		var socket_username = null;
		// User sends his username
		socket.on('user', function(username) {
			socket_username = username;
			sockets.emit('join', username, Date.now());
		});
		// When user leaves
		socket.on('disconnect', function() {
			if (socket_username) {
				sockets.emit('bye', socket_username, Date.now());
			}
		});
		// New message from client = "write" event
		socket.on('write', function(message) {
			if (socket_username) {
				sockets.emit('message', socket_username, message, Date.now());
			} else {
				socket.emit('error', 'Username is not set yet');
			}
		});
		socket.emit('news', {hello: 'world a tous'});
		socket.on('my other event', function(data) {
			console.log(data);
		});
	});

});

function ensureAuthenticated(req, res, next) {
	if (req.loggedIn) {
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
		res.redirect('login');

}

/**
 * Module dependencies.
 */
var express = require('express'),
		expressWinston = require('express-winston'),
		winston = require('winston'),
		i18n = require("i18next"),
		hbs = require("hbs"),
		mongoStore = require('connect-mongo')(express),
		flash = require('connect-flash'),
		helpers = require('view-helpers'),
		fs = require('fs'),
		config = require('./config');

module.exports = function(app, passport, db) {

	/** 
	 * config translate
	 */

	/*var i18nextMongoSync = require('i18next/backends/mongoDb/index');
	 i18nextMongoSync.connect({
	 db: db.connection.db,
	 resCollectionName: "i18next"
	 username: "usr",
	 password: "pwd",
	 options: {
	 auto_reconnect: true, // default true
	 ssl: false // default false
	 }
	 }, function() {
	 i18n.backend(i18nextMongoSync);*/

	var namespaces = [];

	fs.readdirSync(__dirname + '/../locales/fr-FR').forEach(function(file) {
		namespaces.push(file.substr(0, file.indexOf(".json")));
	});

	i18n.init({
		ns: {namespaces: namespaces, defaultNs: 'main'},
		supportedLngs: ['en-US', 'fr-FR'],
		resSetPath: 'locales/__lng__/new.__ns__.json',
		load: 'current',
		preload: ['fr-FR', 'en-US'],
		cookie: 'speedealingLang',
		saveMissing: true,
		debug: false,
		sendMissingTo: 'fallback'
	});

	hbs.registerHelper('t', function(i18n_key) {
		var result = i18n.t(i18n_key);

		return new hbs.SafeString(result);
	});

	hbs.registerHelper('tr', function(context, options) {
		var opts = i18n.functions.extend(options.hash, context);
		if (options.fn)
			opts.defaultValue = options.fn(context);

		var result = i18n.t(opts.key, opts);

		return new hbs.SafeString(result);
	});

	// include template partials
	hbs.registerPartials(config.root + '/app/views/includes');

	app.configure(function() {
		app.set('port', config.app.port || 3000);
		app.set('showStackError', true);

		//Prettify HTML
		app.locals.pretty = true;

		//Should be placed before express.static
		app.use(express.compress({
			filter: function(req, res) {
				return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
			},
			level: 9
		}));

		//Setting the fav icon and static folder
		//app.use(express.favicon());
		app.use(express.static(config.root + '/public'));

		//Don't use logger for test env
		if (process.env.NODE_ENV !== 'test') {
			app.use(express.logger('dev'));
		}

		//Set views path, template engine and default layout
		app.set('views', config.root + '/app/views');
		app.set('view engine', 'html');
		app.engine('html', require('hbs').__express);

		//Enable jsonp
		//app.enable("jsonp callback");


		// For POST XML in webservices
		app.use(function(req, res, next) {
			var type = req.get('Content-Type');
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

		//cookieParser should be above session
		app.use(express.cookieParser());
		//express/mongo session storage
		app.use(express.session({
			secret: config.app.secret,
			key: 'SpeedSession',
			cookie: {
				maxAge: 36000000
						//expires: new Date(Date.now() + 3600000) //1 Hour
			},
			store: new mongoStore({
				db: db.connection.db,
				collection: 'session'
			})
		}));

		//connect flash for flash messages
		app.use(flash());

		//bodyParser should be above methodOverride
		app.use(express.bodyParser({uploadDir: './uploads'}));
		app.use(i18n.handle);
		app.use(express.methodOverride());

		//dynamic helpers
		app.use(helpers(config.app.name));

		//use passport session
		app.use(passport.initialize());
		app.use(passport.session());

		/*app.use(expressWinston.logger({
		 transports: [
		 new winston.transports.Console({
		 json: true,
		 colorize: true
		 })
		 ]
		 }));*/

		//routes should be at the last
		app.use(app.router);
//		app.use(express.csrf());

		app.use(expressWinston.errorLogger({
			transports: [
				new winston.transports.Console({
					json: true,
					colorize: true
				})
			]
		}));

		// Optionally you can include your custom error handler after the logging.
		//app.use(express.errorLogger({
		//	dumpExceptions: true,
		//	showStack: true
		//}));

		//Assume "not found" in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
		app.use(function(err, req, res, next) {
			//Treat as 404
			if (~err.message.indexOf('not found'))
				return next();

			//Log it
			console.error(err.stack);

			//Error page
			res.status(500).render('500', {
				error: err.stack
			});
		});

		//Assume 404 since no middleware responded
		app.use(function(req, res, next) {
			res.status(404).render('404', {
				url: req.originalUrl,
				error: 'Not found'
			});
		});

	});

	i18n.registerAppHelper(app)
			.serveClientScript(app)
			.serveDynamicResources(app)
			.serveMissingKeyRoute(app);
};

var async = require('async'),
		fs = require('fs'),
		modules = require('../app/controllers/modules'),
		config = require(__dirname + '/config'),
		mongoose = require('mongoose');

var ZipCodeModel = mongoose.model('zipCode');

module.exports = function(app, passport, auth) {
	//User Routes
	var users = require('../app/controllers/users');
	app.get('/login', function(req, res) {
		console.log(req.locale);
		var navigator = require('ua-parser').parse(req.headers['user-agent']);
		var error = "";
		if (navigator.ua.family == "Other" && parseFloat((req.headers['user-agent'].match(/.*(?:rv|ie)[\/: ](.+?)([ \);]|$)/) || [])[1]) < 10) {
			error = "Votre version Internet Explorer est trop ancienne. Utilisez Chrome ou Firefox.";
		}

		res.render('login', {error: error});
	});
	//app.get('/signin', users.signin);
	//app.get('/signup', users.signup);
	app.get('/logout', users.signout);

	//Setting up the users api
	//app.post('/users', users.create);

	app.post('/login', function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) {
				return next(err)
			}

			if (!user) {
				req.session.messages = [info.message];
				return res.json({success: false, errors: req.i18n.t('errors:ErrorBadLoginPassword')}, 401);
			}

			users.checkIP(req, res, user, function() {

				req.logIn(user, function(err) {
					if (err) {
						return next(err);
					}

					user.LastConnection = user.NewConnection;
					user.NewConnection = new Date();

					user.save(function(err) {
						if (err)
							console.log(err);
					});

					return res.json({success: true, url: user.url}, 200);
				});
			});
		})(req, res, next);
	});

	/*app.post('/login', passport.authenticate('local', {
	 failureRedirect: '/index.php',
	 failureFlash: 'Invalid login or password.'
	 }), users.session);*/

	app.get('/api/session', function(req, res) {
		if (typeof req.session.nb === 'undefined')
			req.session.nb = 0;

		var nb = req.session.nb; // for counting flash error to only send new error

		if (req.user) {
			//console.log('session : ' + req.user.name);

			/*var user = {name: req.user.name,
			 firstname: req.user.firstname,
			 lastname: req.user.lastname,
			 email: req.user.email,
			 _id: req.user._id,
			 entity: req.user.entity,
			 photo: req.user.photo,
			 societe: req.user.societe,
			 right_menu: req.user.right_menu,
			 url: req.user.url,
			 LastConnection: req.user.LastConnection
			 };*/

			//console.log(req.user);

			if (req.session.flash && req.session.flash.error && req.session.flash.error[nb]) {
				req.session.nb++;
				user.message = req.session.flash.error[nb];
			}

			return res.json(req.user);
		} else if (req.session.flash && req.session.flash.error && req.session.flash.error[nb]) {
			//console.log(req.session);
			req.session.nb++;
			res.send(200, {message: req.session.flash.error[nb]});
			return;
		} else {
			req.logout();
			return res.send(200, {message: 'Session expired'}); // no session
		}

	});

	//app.get('/users/me', users.me);
	//app.get('/users/:userId', users.show);

	app.get('/menus', auth.requiresLogin, modules.menus);
	
	//import rights from config/modules/..
	app.get('/rights', auth.requiresLogin, modules.rights);

	//Setting the facebook oauth routes
	app.get('/auth/facebook', passport.authenticate('facebook', {
		scope: ['email', 'user_about_me'],
		failureRedirect: '/signin'
	}), users.signin);

	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		failureRedirect: '/signin'
	}), users.authCallback);

	//Setting the github oauth routes
	app.get('/auth/github', passport.authenticate('github', {
		failureRedirect: '/signin'
	}), users.signin);

	app.get('/auth/github/callback', passport.authenticate('github', {
		failureRedirect: '/signin'
	}), users.authCallback);

	//Setting the twitter oauth routes
	app.get('/auth/twitter', passport.authenticate('twitter', {
		failureRedirect: '/signin'
	}), users.signin);

	app.get('/auth/twitter/callback', passport.authenticate('twitter', {
		failureRedirect: '/signin'
	}), users.authCallback);

	//Setting the google oauth routes
	app.get('/auth/google', passport.authenticate('google', {
		failureRedirect: '/signin',
		//accessType: 'offline', // will return a refresh token
		//approvalPrompt: 'force',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
					//	'https://www.googleapis.com/auth/contacts',
					//	'https://www.googleapis.com/auth/tasks',
					//	'https://www.googleapis.com/auth/tasks.readonly',
					//	'https://www.googleapis.com/auth/calendar',
					//	'https://www.googleapis.com/auth/calendar.readonly'
		]
	}), users.signin);

	app.get('/auth/google/callback', users.setAccessCodeGoogle, passport.authenticate('google', {
		failureRedirect: '/login' // TODO add error message
		//failureRedirect: '/signin'
	}), function(req, res) {
		users.checkIP(req, res, req.user, users.authCallback);
	});

	//Finish with setting up the userId param
	app.param('userId', users.user);

	/*/Article Routes
	 var articles = require('../app/controllers/articles');
	 app.get('/articles', articles.all);
	 app.post('/articles', auth.requiresLogin, articles.create);
	 app.get('/articles/:articleId', articles.show);
	 app.put('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.update);
	 app.del('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.destroy);
	 
	 //Finish with setting up the articleId param
	 app.param('articleId', articles.article);*/

	//latex Routes
	var latex = require('../app/models/latex');
	app.get('/servepdf/:pdfId', auth.requiresAuthenticate, latex.servePDF);

	app.get('/locales/:lng/:jsonFile', auth.requiresLogin, function(req, res) {
		var file = __dirname + '/../locales/' + req.params.lng + '/' + req.params.jsonFile;

		fs.readFile(file, 'utf8', function(err, data) {
			if (err) {
				console.log('Error: ' + err);
				return res.send(500);
			}

			data = JSON.parse(data);

			res.json(data);
		});
	});

	var index = require('../app/controllers/index');
	app.get('/partials/home', auth.html.hasAuthorization, index.home);

	app.get('/partials/:view', auth.html.hasAuthorization, function(req, res) {
		var view = req.params.view;
		res.render('partials/' + view, {user: req.user}); // Mode list view
	});

	app.get('/partials/ticket/:id', auth.html.hasAuthorization, function(req, res) {
		var view = "ticket";
		var pos = req.params.id.search(".html"); // search if id is an html page
		if (pos > 0) { // is a subview in directory
			res.render('partials/' + view + "/" + req.params.id.substr(0, pos), {user: req.user});
		} else
			res.render('partials/' + view, {user: req.user});
	});

	app.get('/partials/:view/:id', auth.html.hasAuthorization, function(req, res) {
		var view = req.params.view;
		var pos = req.params.id.search(".html"); // search if id is an html page
		if (pos > 0) // is a subview in directory
			res.render('partials/' + view + "/" + req.params.id.substr(0, pos), {user: req.user});
		else
			res.render('partials/' + view + "/fiche.html", {user: req.user}); // Mode fiche view 
	});

	app.post('/api/zipcode/autocomplete', auth.requiresLogin, function(req, res) {


		if (req.body.val === null)
			return res.send(200, {});

		var val = "^" + req.body.val;

		var query = {"$or": [
				{code: new RegExp(val, "i")},
				{city: new RegExp(val, "i")}
			]
		};

		//var query = {$or: [{"code" : {$regex: /val.*/ }}, {"city" : { $regex: val, $options: 'i'}}]};

		ZipCodeModel.find(query, {}, {limit: 5}, function(err, doc) {
			if (err) {
				console.log(err);
				return;
			}

			return res.send(200, doc);

		});

	});
	/*app.get('/partials/module/:module/:view', auth.requiresLogin, function(req, res) {
	 var module = req.params.module;
	 var view = req.params.view;
	 res.render('partials/' + module + "/" + view, {user: req.user});
	 });*/

	// Master angular Page
	app.get('/', auth.requiresAuthenticate, index.render);
};

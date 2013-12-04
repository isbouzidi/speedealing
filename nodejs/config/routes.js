var async = require('async');

module.exports = function(app, passport, auth) {
	//User Routes
	var users = require('../app/controllers/users');
	app.get('/login', function(req, res) {
		res.render('login');
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
				return res.json({success: false, errors: info.message}, 401);
			}
			req.logIn(user, function(err) {
				if (err) {
					return next(err);
				}
				return res.json({success: true}, 200);
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

			var user = {name: req.user.name,
				firstname: req.user.firstname,
				lastname: req.user.lastname,
				email: req.user.email,
				_id: req.user._id,
				entity: req.user.entity,
				photo: req.user.photo};
			
			//console.log(req.user.photo);

			if (req.session.flash && req.session.flash.error && req.session.flash.error[nb]) {
				req.session.nb++;
				user.message = req.session.flash.error[nb];
			}

			return res.send(200, user);
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

	app.get('/users/me', users.me);
	app.get('/users/:userId', users.show);

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
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}), users.signin);

	app.get('/auth/google/callback', passport.authenticate('google', {
		failureRedirect: '/signin'
	}), users.authCallback);

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
	app.get('/servepdf/:pdfId', latex.servePDF);

	app.get('/partials/:view', auth.requiresLogin, function(req, res) {
		var view = req.params.view;
		res.render('partials/' + view, {user: req.user});
	});

	app.get('/partials/:module/:view', auth.requiresLogin, function(req, res) {
		var module = req.params.module;
		var view = req.params.view;
		res.render('partials/' + module + "/" + view, {user: req.user});
	});

	//Home route
	var index = require('../app/controllers/index');
	app.get('/', auth.requiresLogin, index.render);
};

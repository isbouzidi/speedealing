var async = require('async');

module.exports = function(app, passport, auth) {
	//User Routes
	var users = require('../app/controllers/users');
	app.get('/signin', users.signin);
	app.get('/signup', users.signup);
	app.get('/signout', users.signout);

	//Setting up the users api
	app.post('/users', users.create);

	/*app.post('/login', function(req, res, next) {
	 passport.authenticate('local', function(err, user, info) {
	 if (err) {
	 return next(err)
	 }
	 if (!user) {
	 req.session.messages = [info.message];
	 return res.redirect('/login')
	 }
	 req.logIn(user, function(err) {
	 if (err) {
	 return next(err);
	 }
	 return res.redirect('/');
	 });
	 })(req, res, next);
	 });*/


	app.post('/login', passport.authenticate('local', {
		failureRedirect: '/index.php',
		failureFlash: 'Invalid login or password.'
	}), users.session);

	/*app.post('/login', function(req, res){
	 console.log(req.session);
	 console.log(req.body);
	 });*/

	app.get('/api/session', function(req, res) {
		if (req.session.flash.error) {
			console.log(req.session);
			res.send(200, {message: req.session.flash.error[0]});
			return req.logout();
		}
		
		if (req.user) {
			//console.log('session : ' + req.user.name);
			return res.send(200, {'user': req.user.name, 'email': req.user.email});
		} else {
			req.logout();
			return res.send(200, { message: 'Session expired'}); // no session
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

	//Article Routes
	var articles = require('../app/controllers/articles');
	app.get('/articles', articles.all);
	app.post('/articles', auth.requiresLogin, articles.create);
	app.get('/articles/:articleId', articles.show);
	app.put('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.update);
	app.del('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.destroy);

	//Finish with setting up the articleId param
	app.param('articleId', articles.article);
};

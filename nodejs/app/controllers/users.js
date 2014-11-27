"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		User = mongoose.model('user'),
		ip = require('ip'),
		config = require(__dirname + '/../../config/config');

var googleCommon = require('./google.common');

/**
 * Auth callback
 */
exports.authCallback = authCallback;

function authCallback(req, res) {
	if (req.user.google && req.user.google.user_id) {
		User.findOne({_id: req.user._id}, function (err, user) {
			if (user.google.tokens.refresh_token)
				return res.redirect('/');

			var url = googleCommon.generateAuthUrl(['contacts', 'tasks', 'calendar']);

			res.redirect(url);
		});
	} else
		res.redirect('/');
}

/**
 * Set tokens google in user database for offline tokens
 */

exports.setAccessCodeGoogle = function (req, res, next) {
	if (req.user) {
		//console.log(req.query);
		var code = req.query.code;
		var user = req.user;

		//console.log("oauth2callback: user = " + user.id + " ; code = " + code);

		googleCommon.setAccessCode(code, user,
				function (err, user) {

					//console.log(user.google.tokens);

					if (!user.google || !user.google.tokens.refresh_token)
						return googleCommon.refreshGoogleTokens(user, function (err) {
							if (err)
								console.log(err);
							res.redirect('/');
						});

					if (err) {
						console.log(err);
						res.send(500, "ERR: " + err);
					} else
						res.redirect('/');
						//next();
				}
		);
	} else
		next();
};

/**
 * Show login form
 */
exports.signin = function (req, res) {
	res.render('users/signin', {
		title: 'Signin',
		message: req.flash('error')
	});
};

/**
 * Show sign up form
 */
exports.signup = function (req, res) {
	res.render('users/signup', {
		title: 'Sign up',
		user: new User()
	});
};

/**
 * Logout
 */
exports.signout = signout;

function signout(req, res) {
	console.log("Logout : " + req.user._id);
	req.logout();
	res.redirect('/');
}

/**
 * Session
 */
exports.session = function (req, res) {
	res.redirect('/');
};

/**
 * Create user
 */
exports.create = function (req, res) {
	var user = new User(req.body);

	user.provider = 'local';
	user.save(function (err) {
		if (err) {
			return res.render('users/signup', {
				errors: err.errors,
				user: user
			});
		}
		req.logIn(user, function (err) {
			if (err)
				return next(err);
			return res.redirect('/');
		});
	});
};

/**
 *  Show profile
 */
exports.show = function (req, res) {
	var user = req.profile;

	res.render('users/show', {
		title: user.name,
		user: user
	});
};

/**
 * Send User
 */
exports.me = function (req, res) {
	res.jsonp(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function (req, res, next, id) {
	User.findOne({
		_id: id
	})
			.exec(function (err, user) {
				if (err)
					return next(err);
				if (!user)
					return next(new Error('Failed to load User ' + id));
				req.profile = user;
				next();
			});
};

exports.checkIP = function (req, res, user, callback) {
	var navigator = require('ua-parser').parse(req.headers['user-agent']);
	console.log(req.headers['user-agent']);
	console.log(navigator.ua.family);
	console.log(navigator.ua.major);

	if (navigator.ua.family == "Other" && parseFloat((req.headers['user-agent'].match(/.*(?:rv|ie)[\/: ](.+?)([ \);]|$)/) || [])[1]) < 10) {
		res.json({success: false, errors: "Votre version Internet Explorer est trop ancienne. Utilisez Chrome ou Firefox."}, 500);
		return;
	}

	/* CheckExternalIP */
	if (config.externalIPAllowed.length) { /* Verify list allowed IP */
		console.log(req.headers['x-real-ip']);
		if (!(ip.isPrivate(req.headers['x-real-ip']) || user.externalConnect || config.externalIPAllowed.indexOf(req.headers['x-real-ip']) >= 0)) {
			res.json({success: false, errors: "Internet access denied"}, 500);
			//return signout(req, res);
			return res.redirect('/logout');
		}
	}

	callback(req, res);
};
"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
		async = require('async'),
		Article = mongoose.model('Article'),
		_ = require('lodash');

module.exports = function(app, passport, auth) {
	//Article Routes
	var articles = new Articles();
	app.get('/articles', articles.all);
	app.post('/articles', auth.requiresLogin, articles.create);
	app.get('/articles/:articleId', articles.show);
	app.put('/articles/:articleId', auth.requiresLogin, auth.api.hasAuthorization, articles.update);
	app.del('/articles/:articleId', auth.requiresLogin, auth.api.hasAuthorization, articles.destroy);

	//Finish with setting up the articleId param
	app.param('articleId', articles.article);
};

/**
 * Saisie des Tournees
 */

function Articles() {
}

Articles.prototype = {
	/**
	 * Find article by id
	 */
	article: function(req, res, next, id) {
		Article.load(id, function(err, article) {
			if (err)
				return next(err);
			if (!article)
				return next(new Error('Failed to load article ' + id));
			req.article = article;
			next();
		});
	},
	/**
	 * Create a article
	 */
	create: function(req, res) {
		var article = new Article(req.body);
		article.user = req.user;

		article.save(function(err) {
			if (err) {
				return res.send('users/signup', {
					errors: err.errors,
					article: article
				});
			} else {
				res.jsonp(article);
			}
		});
	},
	/**
	 * Update a article
	 */
	update: function(req, res) {
		var article = req.article;

		article = _.extend(article, req.body);

		article.save(function(err) {
			res.jsonp(article);
		});
	},
	/**
	 * Delete an article
	 */
	destroy: function(req, res) {
		var article = req.article;

		article.remove(function(err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.jsonp(article);
			}
		});
	},
	/**
	 * Show an article
	 */
	show: function(req, res) {
		res.jsonp(req.article);
	},
	/**
	 * List of Articles
	 */
	all: function(req, res) {
		Article.find().sort('-created').populate('user', 'name username').exec(function(err, articles) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.jsonp(articles);
			}
		});
	}
};
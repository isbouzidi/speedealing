"use strict";

var mongoose = require('mongoose'),
		_ = require('lodash');

var UserModel = mongoose.model('user');
var UserAbsenceModel = mongoose.model('userAbsence');

var EntityModel = mongoose.model('entity');
var UserGroupModel = mongoose.model('userGroup');

module.exports = function (app, passport, auth) {

	var object = new Object();
	var absence = new Absence();

	object.colors = ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
		"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"];

	// Specific for select
	app.get('/api/user/select', auth.requiresLogin, function (req, res) {
		UserModel.find({Status: "ENABLE"}, function (err, docs) {
			if (err) {
				console.log("err : /api/user/select");
				console.log(err);
				return;
			}

			var result = [];

			if (docs !== null)
				for (var i in docs) {
					//console.log(docs[i]);
					if (req.query.agenda) { // for calendar
						result[i] = {};
						result[i].text = docs[i].firstname + " " + docs[i].lastname;
						result[i].value = docs[i]._id;
						result[i].color = object.colors[i];
					} else if (req.query.lastname) {
						result[i] = {};
						result[i].name = docs[i].lastname;
						result[i].id = docs[i]._id;
					} else {
						result[i] = {};
						result[i].firstname = docs[i].firstname;
						result[i].lastname = docs[i].lastname;
						result[i].name = docs[i].firstname + " " + docs[i].lastname;
						result[i].id = docs[i]._id;
						//console.log(result[i]);
					}
				}

			return res.send(200, result);
		});
	});

	// list for autocomplete
	app.post('/api/user/name/autocomplete', auth.requiresLogin, function (req, res) {
		console.dir(req.body);

		var query = {};

		if (req.body.filter)
			query = {'$or': [
					{firstname: new RegExp(req.body.filter.filters[0].value, "i")},
					{lastname: new RegExp(req.body.filter.filters[0].value, "i")}
				]};

		if (req.query.status) {
			query.Status = {$in: req.query.status};
		} else {
			query.Status = {$ne: "DISABLE"};
		}

		UserModel.find(query, {}, {limit: req.body.take}, function (err, docs) {
			if (err) {
				console.log("err : /api/user/name/autocomplete");
				console.log(err);
				return;
			}

			var result = [];

			if (docs !== null)
				for (var i in docs) {
					//console.log(docs[i]);

					result[i] = {};
					if (req.query.lastname) {
						result[i] = {};
						result[i].name = docs[i].lastname;
						result[i].id = docs[i]._id;
						result[i].entity = docs[i].entity;
					} else {
						//result[i].name = docs[i].name;
						result[i].name = docs[i].firstname + " " + docs[i].lastname;
						result[i].id = docs[i]._id;
						result[i].entity = docs[i].entity;
					}
				}

			return res.send(200, result);
		});
	});

	//liste des collaborateurs
	app.get('/api/users', auth.requiresLogin, object.read);

	//ajout d'un nouveau collaborateur
	app.post('/api/users', auth.requiresLogin, object.create);

	//afficher la fiche du collaborateur
	app.get('/api/users/:userId', auth.requiresLogin, object.show);

	//modifier la fiche du collaborateur
	app.put('/api/users/:userId', auth.requiresLogin, object.update);

	//verifie si le nouveau exite ou pas
	app.get('/api/createUser/uniqLogin', auth.requiresLogin, object.uniqLogin);

	app.del('/api/users/:userId', auth.requiresLogin, object.del);

	/*app.del('/api/user', auth.requiresLogin, function (req, res) {
	 console.log(JSON.stringify(req.body));
	 return res.send(200, object.update(req));
	 });*/

	app.get('/api/user/connection', auth.requiresLogin, object.connection);

	app.get('/api/user/absence', auth.requiresLogin, absence.read);
	app.post('/api/user/absence', auth.requiresLogin, absence.create);
	app.put('/api/user/absence/:id', auth.requiresLogin, absence.update);
	app.del('/api/user/absence/:id', auth.requiresLogin, absence.delete);

	app.get('/api/user/absence/count', auth.requiresLogin, absence.count);

	app.param('userId', object.user);
	//other routes..
};

function Object() {
}

Object.prototype = {
	user: function (req, res, next, id) {

		UserModel.findOne({_id: id}, function (err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return next(new Error('Failed to load user ' + id));

			req.user = doc;
			next();
		});
	},
	show: function (req, res) {

		console.log("show : " + req.user);
		res.json(req.user);
	},
	create: function (req, res) {
		//return req.body.models;
		var user = new UserModel(req.body);

		user.name = req.body.login.toLowerCase();
		var login = req.body.login;
		user._id = 'user:' + login;

		if (!user.entity)
			user.entity = req.user.entity;

		user.save(function (err, doc) {
			if (err) {
				return res.json(500, err);
				//return console.log(err);

			}

			res.json(200, user);
		});
	},
	read: function (req, res) {

		UserModel.find({}, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.send(200, doc);
		});
	},
	update: function (req, res) {
		//return req.body.models;
		var user = req.user;
		user = _.extend(user, req.body);

		user.save(function (err, doc) {

			if (err) {
				return console.log(err);
			}

			res.json(200, doc);
		});
	},
	del: function (req, res) {
		//return req.body.models;
		var user = req.user;
		user.remove(function (err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(user);
			}
		});
	},
	connection: function (req, res) {
		UserModel.find({NewConnection: {$ne: null}, entity: req.query.entity}, "lastname firstname NewConnection", {limit: 10, sort: {
				NewConnection: -1
			}}, function (err, docs) {
			res.json(200, docs);
		});
	},
	uniqLogin: function (req, res) {

		if (!req.query.login)
			return res.send(404);

		var login = "user:" + req.query.login;


		UserModel.findOne({_id: login}, "lastname firstname", function (err, doc) {
			if (err)
				return next(err);
			if (!doc)
				return res.json({});


			res.json(doc);
		});

	}
};

function Absence() {
}

Absence.prototype = {
	create: function (req, res) {
		var obj = req.body;

		console.log(obj);

		delete obj._id; // new tuple

		var doc = new UserAbsenceModel(obj);

		doc.datec = new Date();
		doc.author.id = req.user._id;
		doc.author.name = req.user.name;

		doc.save(function (err, doc) {
			if (err)
				console.log(err);

			res.send(200, doc);
		});
	},
	read: function (req, res) {
		var query = {};

		console.log(req.query);
		if (req.query.query) {
			if (req.query.query == 'NOW')
				query.closed = false;
			else
				query.closed = true;
		}

		query.entity = req.query.entity;

		UserAbsenceModel.find(query, function (err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}
			res.send(200, doc);
		});
	},
	update: function (req, res) {
		var obj = req.body;
		//console.log(obj);

		UserAbsenceModel.findOne({_id: req.params.id}, function (err, doc) {
			if (err)
				console.log(err);

			doc = _.extend(doc, obj);

			doc.save(function (err, doc) {
				res.send(200, doc);
			});
		});
	},
	delete: function (req, res) {

		UserAbsenceModel.remove({_id: req.params.id}, function (err, doc) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(doc);
			}
		});
	},
	count: function (req, res) {
		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), 0, 1);
		var dateEnd = new Date(d.getFullYear() + 1, 0, 1);

		UserAbsenceModel.aggregate([
			{$match: {Status: "NOTJUSTIFIED", dateStart: {$gte: dateStart, $lt: dateEnd}}},
			{$project: {_id: 0, nbDay: 1}},
			{$group: {'_id': 0, sum: {"$sum": "$nbDay"}}}
		], function (err, docs) {
			if (docs.length === 0)
				return res.json(200, {_id: 0, sum: 0});

			res.json(200, docs[0]);
		});
	}
};

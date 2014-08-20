"use strict";

var mongoose = require('mongoose'),
		_ = require('underscore');

var UserModel = mongoose.model('user');
var UserAbsenceModel = mongoose.model('userAbsence');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

	var object = new Object();
	var absence = new Absence();

	object.colors = ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
		"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"];

	ExtrafieldModel.findById('extrafields:User', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
		absence.fk_extrafields = doc;
	});
        
	app.get('/api/user', auth.requiresLogin, function(req, res) {
            
            object.read(req, res);
		return;
	});

	// Specific for select
	app.get('/api/user/select', auth.requiresLogin, function(req, res) {
		UserModel.find({Status: "ENABLE"}, function(err, docs) {
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
	app.post('/api/user/name/autocomplete', auth.requiresLogin, function(req, res) {
		console.dir(req.body);

		var query = {};

		if (req.body.filter)
			query = {'$or': [
					{firstname: new RegExp(req.body.filter.filters[0].value, "i")},
					{lastname: new RegExp(req.body.filter.filters[0].value, "i")}
				]};

		if (req.query.status) {
			query.Status = req.query.status;
		}

		UserModel.find(query, {}, {limit: req.body.take}, function(err, docs) {
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

	app.post('/api/user', auth.requiresLogin, function(req, res) {
		//console.log(JSON.stringify(req.body));
		return res.send(200, object.create(req));
	});

	app.put('/api/user', auth.requiresLogin, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.update(req));
	});

	app.del('/api/user', auth.requiresLogin, function(req, res) {
		console.log(JSON.stringify(req.body));
		return res.send(200, object.update(req));
	});

	app.get('/api/user/connection', auth.requiresLogin, object.connection);

	app.get('/api/user/absence', auth.requiresLogin, absence.read);
	app.post('/api/user/absence', auth.requiresLogin, absence.create);
	app.put('/api/user/absence/:id', auth.requiresLogin, absence.update);

	app.get('/api/user/absence/status/select', auth.requiresLogin, function(req, res) {
		var result = [];
		for (var i in absence.fk_extrafields.fields.StatusAbsence.values) {

			if (absence.fk_extrafields.fields.StatusAbsence.values[i].enable) {
				var status = {};

				status.id = i;
				status.name = absence.fk_extrafields.fields.StatusAbsence.values[i].label;
				status.css = absence.fk_extrafields.fields.StatusAbsence.values[i].cssClass;

				result.push(status);
			}
		}
		res.send(200, result);
	});

	app.get('/api/user/absence/count', auth.requiresLogin, absence.count);

	//other routes..
};

function Object() {
}

Object.prototype = {
	create: function(req) {
		return req.body.models;
	},
	read: function(req, res) {
		var status_list = this.fk_extrafields.fields.Status;

		UserModel.find({}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}
/*
			for (var i in doc) {
				var status = {};

				status.id = doc[i].Status;
				if (status_list.values[status.id]) {
					status.name = req.i18n.t("intervention." + status_list.values[status.id].label);
					status.css = status_list.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}

				doc[i].Status = status;
			}
*/
			res.send(200, doc);
		});
	},
	update: function(req) {
		return req.body.models;
	},
	del: function(req) {
		return req.body.models;
	},
	connection: function(req, res) {
		UserModel.find({NewConnection: {$ne: null}}, "lastname firstname NewConnection", {limit: 10, sort: {
				NewConnection: -1
			}}, function(err, docs) {
			res.json(200, docs);
		});
	}
};

function Absence() {
}

Absence.prototype = {
	create: function(req, res) {
		var obj = req.body;

		console.log(obj);

		delete obj._id; // new tuple

		var doc = new UserAbsenceModel(obj);

		doc.datec = new Date();
		doc.author.id = req.user._id;
		doc.author.name = req.user.name;

		doc.save(function(err, doc) {
			if (err)
				console.log(err);

			res.send(200, doc);
		});
	},
	read: function(req, res) {
		var query = {};
                
		console.log(req.query);
		if (req.query.query) {
			if (req.query.query == 'NOW')
				query.closed = false;
			else
				query.closed = true;
		}

		query.entity = req.query.entity;

		UserAbsenceModel.find(query, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}
			res.send(200, doc);
		});
	},
	update: function(req, res) {
		var obj = req.body;
		//console.log(obj);

		UserAbsenceModel.findOne({_id: req.params.id}, function(err, doc) {
			if (err)
				console.log(err);

			doc = _.extend(doc, obj);

			doc.save(function(err, doc) {
				res.send(200, doc);
			});
		});
	},
	del: function(req) {
		return req.body.models;
	},
	count: function(req, res) {
		var d = new Date();
		d.setHours(0, 0, 0);
		var dateStart = new Date(d.getFullYear(), 0, 1);
		var dateEnd = new Date(d.getFullYear() + 1, 0, 1);

		UserAbsenceModel.aggregate([
			{$match: {Status: "NOTJUSTIFIED", dateStart: {$gte: dateStart, $lt: dateEnd}}},
			{$project: {_id: 0, nbDay: 1}},
			{$group: {'_id': 0, sum: {"$sum": "$nbDay"}}}
		], function(err, docs) {
			if (docs.length == 0)
				return res.json(200, {_id: 0, sum: 0});

			res.json(200, docs[0]);
		});
	}
};

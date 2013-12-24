"use strict";

var mongoose = require('mongoose');

var UserModel = mongoose.model('user');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

	var object = new Object();

	object.colors = ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
		"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"];

	ExtrafieldModel.findById('extrafields:User', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/user', auth.requiresLogin, function(req, res) {
		object.read(req, res);
		return;
	});

	// Specific for autocomplete
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
					} else {
						result[i] = {};
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
					//result[i].name = docs[i].name;
					result[i].name = docs[i].firstname + " " + docs[i].lastname;
					result[i].id = docs[i]._id;
				}

			return res.send(200, result);
		});
	});

	app.post('/api/user', auth.requiresLogin, function(req, res) {
		console.log(JSON.stringify(req.body));
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

		StockModel.find({}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			for (i in doc) {
				var status = {};
				doc[i] = doc[i].value;
				delete doc[i].entity;
				delete doc[i].class;
				delete doc[i].tms;
				delete doc[i]._rev;
				delete doc[i].history;

				doc[i].societe_id = doc[i].societe.id;
				doc[i].societe = doc[i].societe.name;
				status.id = doc[i].Status;
				if (status_list.values[status.id]) {
					status.name = req.i18n.t("intervention." + status_list.values[status.id].label);
					status.css = status_list.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}


				doc[i].Status = status;
				if (!doc[i].group.url)
					doc[i].group.url = doc[i].group.name;
			}
			res.send(200, doc);
		});
	},
	update: function(req) {
		return req.body.models;
	},
	del: function(req) {
		return req.body.models;
	}
};
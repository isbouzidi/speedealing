"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var SocieteModel = mongoose.model('societe');
var ContactModel = mongoose.model('contact');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

	var contact = new Contact();

	//create a new contact
	app.post('/api/contact', auth.requiresLogin, contact.create);

	//get all contacts of a given company
	app.get('/api/contact', auth.requiresLogin, contact.showAll);

	//get all contacts for search engine
	app.get('/api/contact/searchEngine', auth.requiresLogin, contact.showList);

	//get a contact
	app.get('/api/contact/:contactId', auth.requiresLogin, contact.findOne);

	//update a contact
	app.put('/api/contact/:contactId', auth.requiresLogin, contact.update);

	//delete a contact
	app.del('/api/contact/:contactId', auth.requiresLogin, contact.delete);

	//get all contacts
	app.get('/api/contacts', auth.requiresLogin, contact.read);

	app.get('/api/contact/fk_extrafields/status', auth.requiresLogin, function(req, res) {
		contact.select(req, res, 'extrafields:Contact');
		return;
	});

	app.param('contactId', contact.contact);

	app.post('/api/contact/autocomplete', auth.requiresLogin, function(req, res) {
		console.dir(req.body.filter);

		if (req.body.filter === null)
			return res.send(200, {});

		var query = {
			"$or": [
				{name: new RegExp(req.body.filter.filters[0].value, "i")},
				{ref: new RegExp(req.body.filter.filters[0].value, "i")},
				{code_client: new RegExp(req.body.filter.filters[0].value, "i")}
			]
		};

		if (req.query.fournisseur) {
			query.fournisseur = req.query.fournisseur;
		} else // customer Only
			query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};

		console.log(query);
		SocieteModel.find(query, {}, {limit: req.body.take}, function(err, docs) {
			if (err) {
				console.log("err : /api/societe/autocomplete");
				console.log(err);
				return;
			}

			var result = [];

			if (docs !== null)
				for (var i in docs) {
					//console.log(docs[i].ref);
					result[i] = {};
					result[i].name = docs[i].name;
					result[i].id = docs[i]._id;
					if (docs[i].cptBilling.id == null) {
						result[i].cptBilling = {};
						result[i].cptBilling.name = docs[i].name;
						result[i].cptBilling.id = docs[i]._id;
					} else
						result[i].cptBilling = docs[i].cptBilling;

					result[i].price_level = docs[i].price_level;

					// add address
					result[i].address = {};
					result[i].address.name = docs[i].name;
					result[i].address.address = docs[i].address;
					result[i].address.zip = docs[i].zip;
					result[i].address.town = docs[i].town;
					result[i].address.country = docs[i].country;

					result[i].mode_reglement_code = docs[i].mode_reglement;
					result[i].cond_reglement_code = docs[i].cond_reglement;
				}

			return res.send(200, result);
		});
	});
};


function Contact() {
}

Contact.prototype = {
	contact: function(req, res, next, id) {
		//TODO Check ACL here
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		var query = {};

		if (checkForHexRegExp.test(id))
			query = {_id: id};
		else
			query = {code_client: id};

		//console.log(query);

		ContactModel.findOne(query, function(err, doc) {
			if (err)
				return next(err);

			req.contact = doc;
			next();
		});
	},
	create: function(req, res) {

		var contact = new ContactModel(req.body);
		contact.user_creat = req.user._id;

		contact.save(function(err, doc) {
			if (err) {
				console.log(err);
				return res.json(500, err);

			}

			res.json(200, contact);
		});
	},
	read: function(req, res) {
		//console.log(req.query.find);
		ContactModel.find(JSON.parse(req.query.find), req.query.field || "", function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			//console.log(doc);

			res.json(200, doc);
		});
	},
	showAll: function(req, res) {

		var query = {};

		if (req.query.Status !== "ALL")
			query = {"Status": req.query.Status};

		ContactModel.find(query, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(200, doc);
		});
	},
	showList: function(req, res) {

		//var query = {name: new RegExp(req.query.item, "i")};

		var query = {
			"$or": [
				{"name": new RegExp(req.query.item, "i")},
				{"lastname": new RegExp(req.query.item, "i")},
				{"firstname": new RegExp(req.query.item, "i")},
				{"societe.name": new RegExp(req.query.item, "i")}
			]
		};

		ContactModel.find(query, {}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			res.json(200, doc);
		});
	},
	findOne: function(req, res) {

		res.json(req.contact);
	},
	update: function(req, res) {

		var contact = req.contact;
		contact = _.extend(contact, req.body);

		contact.save(function(err, doc) {

			if (err) {
				return console.log(err);
			}

			res.json(200, doc);
		});
	},
	delete: function(req, res) {

		var contact = req.contact;
		contact.remove(function(err) {
			if (err) {
				res.render('error', {
					status: 500
				});
			} else {
				res.json(contact);
			}
		});
	},
	select: function(req, res, extrafields) {

		ExtrafieldModel.findById(extrafields, function(err, doc) {

			if (err) {
				console.log(err);
				return;
			}

			var result = [];

			for (var i in doc.fields[req.query.field].values) {
				if (doc.fields[req.query.field].values[i].enable) {
					var val = {};
					val.id = i;
					val.label = doc.fields[req.query.field].values[i].label;
					result.push(val);
				}
			}


			doc.fields[req.query.field].values = result;

			res.json(doc.fields[req.query.field]);

		});

	}
};
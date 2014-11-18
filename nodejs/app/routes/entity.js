"use strict";

var mongoose = require('mongoose'),
		timestamps = require('mongoose-timestamp'),
		_ = require('lodash');

var EntityModel = mongoose.model('entity');

module.exports = function(app, passport, auth) {

	var entity = new Entity();

	app.get('/api/entity', auth.requiresLogin, function(req, res) {
		entity.read(req, res);
		return;
	});

	app.post('/api/entity', auth.requiresLogin, function(req, res) {
		entity.create(req, res);
	});

	app.put('/api/entity', auth.requiresLogin, function(req, res) {
		entity.update(req, res);
	});

	app.del('/api/entity', auth.requiresLogin, function(req, res) {
		entity.del(req, res);
	});

	// Specific for select Status
	app.get('/api/entity/select', auth.requiresLogin, entity.select);

};

function Entity() {
}

Entity.prototype = {
	read: function(req, res) {

	},
	create: function(req, res) {

	},
	update: function(req, res) {

	},
	del: function(req, res) {

	},
	select: function(req, res) {
		var result = [];
		
		EntityModel.find(function(err, docs){
			for(var i in docs) {
				if ((!req.user.multiEntities && docs[i]._id == req.user.entity) // Only once entity
				|| req.user.multiEntities === true // superadmin
				|| (_.isArray(req.user.multiEntities) && _.contains(req.user.multiEntities, docs[i]._id))) { // Entities assigned
					var entity={};
					entity.id = docs[i]._id;
					entity.name = docs[i]._id;
					result.push(entity);
				}
			}
				
			res.json(result);
		});
	}
};

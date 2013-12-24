"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		config = require('../../config/config');

var TicketModel = mongoose.model('ticket');

var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

	var object = new Object();

	ExtrafieldModel.findById('extrafields:Societe', function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}

		object.fk_extrafields = doc;
	});

	app.get('/api/ticket', auth.requiresLogin, function(req, res) {
		object.read(req, res);
		return;
	});

	app.post('/api/ticket', auth.requiresLogin, function(req, res) {
		object.create(req, res);
	});

	app.put('/api/ticket', auth.requiresLogin, function(req, res) {
		object.update(req, res);
	});

	app.del('/api/ticket', auth.requiresLogin, function(req, res) {
		object.del(req, res);
	});

	app.post('/api/ticket/file/:Id', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;
		//console.log(id);

		if (req.files && id) {
			//console.log(req.files);
			var filename = req.files.files.path;
			if (fs.existsSync(filename)) {
				//console.log(filename);
				TicketModel.findOne({_id: id}, function(err, ticket) {

					if (err) {
						console.log(err);
						return res.send(500, {status: "Id not found"});
					}

					var opts;
					opts = {
						content_type: req.files.files.type,
						metadata: {
							_id: id
						}
					};

					return ticket.addFile(req.files.files, opts, function(err, result) {
						if (err)
							console.log(err);

						//console.log(result);

						return res.send(200, {status: "ok"});
					});
				});
			} else
				res.send(500, {foo: "bar", status: "failed"});
		}
	});
	
	app.get('/api/ticket/file/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;
		
		if(id && req.params.fileName) {
			TicketModel.findOne({_id: id}, function(err, ticket) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}
				
				ticket.getFile(req.params.fileName, function(err, store){
					if(err)
						console.log(err);
					
					//console.log(store);
					res.type(store.contentType);
					res.attachment(store.filename); // for douwnloading
					store.stream(true).pipe(res);
					
				});
			});
		}
	});
	
	app.del('/api/ticket/file/:Id', auth.requiresLogin, function(req, res) {
		//console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.body.fileNames && id) {
			TicketModel.findOne({_id: id}, function(err, ticket) {

				if (err) {
					console.log(err);
					return res.send(500, {status: "Id not found"});
				}
				ticket.removeFile(req.body.fileNames, function(err, result) {
					if (err)
						console.log(err);

					res.send(200, {status: "ok"});
				});
			});
		} else
			res.send(500, "File not found");
	});

	//other routes..
};

function Object() {
}

Object.prototype = {
	create: function(req, res) {
		console.log(req.body);
		
		req.body.datef = new Date(req.body.datef);
		
		var ticket = new TicketModel(req.body);
		
		ticket.save(function(err, doc) {
			if(err)
				console.log(err);
			
			res.send(200, doc);
		});
	},
	read: function(req, res) {
		var status_list = this.fk_extrafields.fields.Status;

		TicketModel.find({}, function(err, doc) {
			if (err) {
				console.log(err);
				res.send(500, doc);
				return;
			}

			/*for (var i in doc) {
				var status = {};
				doc[i] = doc[i].value;

				/*doc[i].societe_id = doc[i].societe.id;
				doc[i].societe = doc[i].societe.name;
				status.id = doc[i].Status;
				if (status_list.values[status.id]) {
					status.name = req.i18n.t("intervention." + status_list.values[status.id].label);
					status.css = status_list.values[status.id].cssClass;
				} else { // Value not present in extrafield
					status.name = status.id;
					status.css = "";
				}*/

				//doc[i].Status = status;
				
			//}
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
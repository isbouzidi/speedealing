/**
 * ListDatatable
 * @type type
 */

"use strict";


/**
 * Schema
 */



module.exports = function(app, ensureAuthenticated) {

	app.post('/api/listdatatables', function(req, res) {
		var object = new Object(req, res);

		object.exec();
		return;
	});
};

function Object(req, res) {

	this.res = res;
	this.req = req;

}

Object.prototype = {
	exec: function() {

		var res = this.res;
		console.log(this.req.body);
		//var toto = JSON.parse(this.req.body.query);
		var tmp = this.req.body.query;
		console.log(JSON.parse(tmp));
		this.send(null,{});
	},
	acl: function() {
		/** 
		 * Users Rights
		 */

		
	},
	send: function(err, data) {
		if (err)
			this.res.send(500);
		else
			this.res.send(200, data);
	}
};
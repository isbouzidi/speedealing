"use strict";

var mongoose = require('mongoose'),
		timestamps = require('mongoose-timestamp');

var Task = require('../controllers/task');


module.exports = function (app, passport, auth, usersSocket) {

	app.get('/api/task', auth.requiresLogin, function (req, res) {
		Task.read(req.query, function (err, tasks) {
			if (err) {
				console.log(err);
				return res.send(500);
			}
			if (tasks)
				res.json(tasks);
			else
				res.json([]);
		});
	});

	app.get('/api/task/count', auth.requiresLogin, function (req, res) {
		Task.count(req.query, function (err, count) {
			if (err) {
				console.log(err);
				return res.send(500);
			}

			res.json({count: count});
		});
	});

	app.post('/api/task', auth.requiresLogin, function (req, res) {
		Task.create(req.body, req.user, usersSocket, function (err, task) {
			if (err) {
				console.log(err);
				return res.send(500);
			}

			res.json(task);
		});
	});

	app.put('/api/task/:taskId', auth.requiresLogin, function (req, res) {
		Task.update(req.task, req.body, req.user, usersSocket, function (err, task) {
			if (err)
				return res.send(500, err);

			res.json(task);
		});
	});

	app.del('/api/task', auth.requiresLogin, function (req, res) {
		Task.del(req, res);
	});

	app.get('/api/task/:taskId', auth.requiresLogin, function (req, res) {
		res.json(req.task);
	});

	app.param('taskId', function (req, res, next, id) {
		Task.get(id, function (err, task) {
			req.task = task;
			//console.log(doc);
			next();
		});
	});
};
/*
 function Agenda() {
 }
 
 Agenda.prototype = {
 read: function(req, res) {
 //var typeMove_list = this.fk_extrafields.fields.typeMoveStock;
 
 var result = [];
 
 var query = {type_code: "AC_RDV"};
 
 if (req.query.filters) {
 if (req.query.filters.filters) {
 var list = [];
 for (var i = 0; i < req.query.filters.filters.length; i++)
 list.push(req.query.filters.filters[i].value);
 query['usertodo.id'] = {'$in': list};
 } else {
 res.send(200, []);
 }
 }
 
 console.log(req.query.filters.filters);
 
 AgendaModel.find(query, function(err, doc) {
 if (err) {
 console.log(err);
 res.send(500, doc);
 return;
 }
 
 for (var i in doc) {
 //convert usertoto
 result[i] = JSON.parse(JSON.stringify(doc[i]));
 
 var usertodo = [];
 for (var j = 0; j < result[i].usertodo.length; j++)
 usertodo[j] = result[i].usertodo[j].id;
 
 result[i].usertodo = [];
 result[i].usertodo = usertodo;
 
 if (result[i].notes.length)
 result[i].notes = result[i].notes[0];
 
 //var date = new Date(result[i].datep);
 
 //result[i].start = "Date("+ Date.parse(result[i].datep) +")";
 //result[i].end = "Date("+ Date.parse(result[i].datef) +")";
 
 if (i == 1)
 console.log(result[i]);
 //console.dir(doc[i].typeMove);
 }
 res.send(200, result);
 });
 },
 create: function(req, res) {
 var obj = JSON.parse(req.body.models);
 
 //console.log(obj);
 
 // Decompose le champ code barre
 var arr = [];
 if (typeof obj[0].barCode === 'string' && obj[0].barCode.indexOf('\n') > -1) {
 var tmp = obj[0].barCode.split("\n");
 for (var i = 0; i < tmp.length; i++) {
 if (typeof tmp[i] !== "undefined" && tmp[i].length > 2) // longueur de codebarre superieur a 2
 arr.push(tmp[i]);
 }
 //console.log(arr);
 } else {
 arr.push(obj[0].barCode);
 }
 
 var result = [];
 var result_cpt = 0; // compteur du nombre de ligne du tableau
 if (arr.length) {
 // compte le nombre de code a barre identique
 
 for (var i in arr) {
 if (arr[i].length) { // test si ligne non vide
 // fix error on windows
 //var code_mouv = arr[i].slice(-3); // 3 derniers caracteres
 //console.log("'" + code_mouv + "'");
 
 // check barCode : bug with windows XP
 //if (isNaN(parseInt(code_mouv[0])) || isNaN(parseInt(code_mouv[1])) || isNaN(parseInt(code_mouv[2]))) { // Bug detected  with wrong character
 var char = ['à', '&', 'é', '"', "'", '(', '', 'è', '_', 'ç'];
 var a = arr[i].split("");  // decompose le barCode
 var len = arr[i].length; //compte le nombre de caracteres - les 3 derniers
 for (var j = 0; j < 10; j++) {
 for (var k = 0; k < len; k++) {
 if (a[k] === char[j]) {
 //console.log(a[len + j]);
 a[k] = j; // change le caractere
 }
 }
 }
 arr[i] = a.join(""); // regenere la string du barCode
 //}
 
 console.log(arr[i]);
 
 
 if (typeof result[arr[i]] === 'undefined') {
 result[arr[i]] = 1;
 result_cpt++;
 }
 else
 result[arr[i]]++;
 }
 }
 }
 
 for (var key in result) {
 var obj_uniq = JSON.parse(JSON.stringify(obj[0])); //clone
 
 //console.log(obj_uniq);
 obj_uniq.barCode = key;
 
 if (arr.length > 1)
 obj_uniq.qty = result[key];
 
 var tab = [];
 
 var fk_typeMove = this.fk_extrafields.fields.typeMoveStock;
 
 inOutStock(obj_uniq, fk_typeMove, res, function(err, obj, callback) {
 
 if (err) { // Error
 res.type('html');
 res.send(500, err);
 return;
 }
 
 delete obj._id; //Just for create
 
 var doc = new StockModel(obj);
 
 doc.typeMove = obj.typeMove.id;
 
 doc.save(function(err, doc) {
 if (err) {
 console.log(err);
 return;
 }
 obj._id = doc._id;
 
 tab.push(obj);
 callback(tab, result_cpt);
 return;
 });
 //console.log(obj);
 });
 }
 },
 update: function(req, res) {
 var obj = JSON.parse(req.body.models);
 //console.dir(obj);
 
 var arr = [];
 var tmp = obj[0].barCode.split("\n");
 for (var i = 0; i < tmp.length; i++) {
 if (typeof tmp[i] !== "undefined" && tmp[i].length > 2) // longueur de codebarre superieur a 2
 arr.push(tmp[i]);
 }
 
 if (arr.length > 1) {
 res.type('html');
 res.send(500, "En mode mise a jour, le code doit etre seul");
 return;
 } else
 obj[0].barCode = arr[0];
 
 if (obj[0].barCode.length) { // test si ligne non vide
 // fix error on windows
 
 //console.log("'" + code_mouv + "'");
 
 // check barCode : bug with windows XP
 // Bug detected  with wrong character
 var char = ['à', '&', 'é', '"', "'", '(', '', 'è', '_', 'ç'];
 var a = obj[0].barCode.split("");  // decompose le barCode
 var len = obj[0].barCode.length; //compte le nombre de caracteres - les 3 derniers
 for (var i = 0; i < 10; i++) {
 for (var j = 0; j < len; j++) {
 if (a[j] === char[i]) {
 //console.log(a[j]);
 a[j] = i; // change le caractere
 }
 }
 }
 obj[0].barCode = a.join(""); // regenere la string du barCode
 //}
 
 
 inOutStock(obj[0], this.fk_extrafields.fields.typeMoveStock, res, function(err, obj) {
 if (err) { // Error
 res.type('html');
 res.send(500, err.label);
 return;
 }
 
 StockModel.findById(obj._id, function(err, doc) {
 if (err) {
 console.log(err);
 return;
 }
 
 //console.log(doc);
 
 doc.barCode = obj.barCode;
 doc.typeMove = obj.typeMove.id;
 doc.storehouse = obj.storehouse;
 obj.datec = doc.datec;
 obj.author.id = req.user._id;
 obj.author.name = req.user.name;
 
 doc.penality = obj.penality;
 doc.qty = obj.qty;
 
 doc.save(function(err, doc) {
 if (err) {
 console.log(err);
 return;
 }
 res.send(200, obj);
 return;
 });
 });
 });
 }
 }
 ,
 del: function(req, res) {
 var obj = JSON.parse(req.body.models);
 
 //console.log(obj);
 if (obj.length)
 for (var i in obj) {
 StockModel.remove({_id: obj[i]._id}, function(err) {
 if (err)
 console.log(err);
 });
 }
 
 res.send(200, {});
 }
 };*/

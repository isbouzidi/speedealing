"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var RegulierModel = mongoose.model('europexpress_regulier');
    
module.exports = function (app, passport, auth) {
    
    var object = new Object();
    
    app.get('/api/regulier', auth.requiresLogin, object.read);
    app.get('/api/regulier/:regulierId', auth.requiresLogin, object.show);
    app.post('/api/regulier', auth.requiresLogin, object.create);
    app.put('/api/regulier/:regulierId', auth.requiresLogin, object.update);
    
    app.param('regulierId', object.regulier);
};

function Object() {
};

Object.prototype = {
    regulier: function (req, res, next, id) {
        try{
            RegulierModel.findOne({_id: id}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return next(new Error('Failed to load a regulier ' + id));

                req.regulier = doc;
                next();
        });        
        }catch(e){
            return next(e.message);
        }
    },
    read: function (req, res){
        try{
            var query = {};                        
        
        if (req.query.find)
            query = {
                datec: {$gte: req.query.find}
            };            
            
        RegulierModel.find(query,{}, {sort: {"datec": -1}}, function(err, doc){
            if(err) {
                console.log(err);
                res.send(500);
            }
            
            res.json(doc);

        });
        }catch(e){
            console.log(e.message);
            res.send(500);
        }
    },
    show: function (req, res){
        res.json(req.regulier);
    },
    create: function (req, res){
        var regulier = new RegulierModel(req.body);
        regulier.author = {};
        regulier.author.id = req.user._id;
        regulier.author.name = req.user.name;                
                            
        regulier.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(regulier);
        });
    },
    update: function (req, res){
        var regulier= req.regulier;
        regulier = _.extend(regulier, req.body);
        
        regulier.save(function(err, doc) {
            
            if (err) {
                return console.log(err);
            }
            
            res.json(200, doc);
        });
    }
};
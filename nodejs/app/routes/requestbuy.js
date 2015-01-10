"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var RequestBuyModel = mongoose.model('europexpress_buy');

module.exports = function (app, passport, auth) {
    
    var object = new Object();
    
    app.get('/api/requestBuy', auth.requiresLogin, object.read);
    app.get('/api/requestBuy/:requestBuyId', auth.requiresLogin, object.show);
    app.post('/api/requestBuy', auth.requiresLogin, object.create);
    app.put('/api/requestBuy/:requestBuyId', auth.requiresLogin, object.update);
    
    app.param('requestBuyId', object.requestBuy);
};

function Object() {
};

Object.prototype = {
    requestBuy: function (req, res, next, id) {
        try{
            RequestBuyModel.findOne({_id: id}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return next(new Error('Failed to load a request buy ' + id));

                req.requestBuy = doc;
                next();
        });        
        }catch(e){
            return next(e.message);
        }
    },
    read: function (req, res){
        try{
            var query;
        
        if (req.query.find)
            query = JSON.parse(req.query.find);
            
        RequestBuyModel.find(query, function(err, doc){
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
        res.json(req.requestBuy);
    },
    create: function (req, res){
        var requestBuy = new RequestBuyModel(req.body);
        requestBuy.author = {};
        requestBuy.author.id = req.user._id;
        requestBuy.author.name = req.user.name;                
                            
        requestBuy.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(requestBuy);
        });
    },
    update: function (req, res){
        var requestBuy = req.requestBuy;
        requestBuy = _.extend(requestBuy, req.body);
        
        requestBuy.save(function(err, doc) {
            
            if (err) {
                return console.log(err);
            }
            
            res.json(200, doc);
        });
    }
};
"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var MailingModel = mongoose.model('Mailing');
    
module.exports = function (app, passport, auth) {
    
    var object = new Object();
    
    app.get('/api/mailing', auth.requiresLogin, object.read);
    app.get('/api/mailing/:mailingId', auth.requiresLogin, object.show);
    app.post('/api/mailing', auth.requiresLogin, object.create);
    app.put('/api/mailing/:mailingId', auth.requiresLogin, object.update);
    
    app.param('mailingId', object.mailing);
};

function Object() {
}

Object.prototype = {
    mailing: function(req, res, next, id){
        MailingModel.findOne({_id: id}, function (err, doc) {
            if (err)
                    return next(err);
            if (!doc)
                    return next(new Error('Failed to load an email model ' + id));

            req.mailing = doc;
            next();
    });  
    },
    read: function(req, res){
        var query;
        
        if (req.query.find)
            query = JSON.parse(req.query.find);
            
        MailingModel.find(query, function(err, doc){
            if(err) {
                console.log(err);
                res.send(500);
            }
            
            res.json(doc);

        });
    },
    show: function(req, res){
        res.json(req.mailing);
    },
    create: function(req, res){
        var mailing = new MailingModel(req.body);
        mailing.author = {};
        mailing.author.id = req.user._id;
        mailing.author.name = req.user.name;
        
        mailing.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(doc);
        });
    },
    update: function(req, res){
        var mailing = req.mailing;
        mailing = _.extend(mailing, req.body);

        mailing.save(function (err, doc) {

            if (err) {
                return console.log(err);
            }

            res.json(200, doc);
        });    
    }
};
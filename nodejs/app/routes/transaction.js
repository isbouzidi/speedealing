"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var TransactionModel = mongoose.model('Transaction');
    
module.exports = function (app, passport, auth) {
    
    var object = new Object();
    
    //create a new bank account
    app.post('/api/transaction', auth.requiresLogin, object.create);
    
    //get list of transactions
    app.get('/api/transaction', auth.requiresLogin, object.read);
};

function Object() {
}

Object.prototype = {
    create: function (req, res){
        
        var transaction = new TransactionModel(req.body);
        transaction.author = {};
        transaction.author.id = req.user._id;
        transaction.author.name = req.user.name;
        
        transaction.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(doc);
        });
    },
    read: function(req, res){
        var query;
        
        if (req.query.find)
            query = JSON.parse(req.query.find);
            
        TransactionModel.find(query, function(err, doc){
            if(err) {
                console.log(err);
                res.send(500);
            }
            console.log(doc);
            res.json(doc);

        });
    }
};
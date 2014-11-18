"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var TransactionModel = mongoose.model('Transaction');
    
module.exports = function (app, passport, auth) {
    
    var object = {};
    
    //create a new bank account
    app.post('/api/transaction', auth.requiresLogin, object.create);
    
    //get list of transactions
    app.get('/api/transaction', auth.requiresLogin, object.read);
    
    //get list of transactions
    app.get('/api/transaction/reconcile', auth.requiresLogin, object.getReconcile);
    
    //get list bank statement
    app.get('/api/transaction/bankStatement', auth.requiresLogin, object.getStatement);
    
    //reconciliation transactions
    app.put('/api/transaction/reconcile', auth.requiresLogin, object.updateReconcile);
    
    //get a transactin
    app.get('/api/transaction/:transactionId', auth.requiresLogin, object.show);
    
    //update a transaction
    app.put('/api/transaction/:transactionId', auth.requiresLogin, object.update);        
    
    app.param('transactionId', object.transaction);
};

function Object() {
}

Object.prototype = {
    transaction: function (req, res, next, id) {
        
        TransactionModel.findOne({_id: id}, function (err, doc) {
                if (err)
                        return next(err);
                if (!doc)
                        return next(new Error('Failed to load a transaction ' + id));

                req.transaction = doc;
                next();
        });        
    },
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
            
            res.json(doc);

        });
    },
    show: function (req, res) {
      
        res.json(req.transaction);
    },
    update: function (req, res) {
        
        var transaction = req.transaction;
        transaction = _.extend(transaction, req.body);

        transaction.save(function (err, doc) {

            if (err) {
                return console.log(err);
            }

            res.json(200, doc);
        });                
    },
    getReconcile: function(req, res){
        var id;
        var statement;
        
        if (req.query.find)
            id = JSON.parse(req.query.find);
        
        statement = {
            "bank_statement":{
                $exists: false
            }
        };
        
        var query = {
            $and: [
                id, statement
            ]
        };        
        
        TransactionModel.find(query, function(err, doc){
            if(err) {
                console.log(err);
                res.send(500);
            }

            res.json(200, doc);

        });
    },
    updateReconcile: function(req, res){
        
        var query = {};
        var bank_statement = 0;
        var category = {};
        var updateFields = {};
        
        if(req.query.ids){
            if( Object.prototype.toString.call(req.query.ids) === '[object Array]' ) {
                query = {_id: { $in: req.query.ids}};
            }else{
                query = {_id: req.query.ids};
            }
        }
        
        updateFields.bank_statement = req.query.bank_statement;        
        
        if(typeof req.query.category !== 'undefined'){
            category = JSON.parse(req.query.category);
            updateFields.category = {
                id: category.id,
                name: category.name                
            };
        }
        
        TransactionModel.update(
                query, 
                updateFields, 
                { multi: true }, 
                function(err, doc){
                    if(err){
                        console.log(err);
                        return res.json(500);
                    }
                    
                    res.json(doc);
                });            
    },
    getStatement: function(req, res){
        var bank;
        var statement;
        
        if (req.query.bank)
            bank =  req.query.bank;            
        
        if (req.query.statement)
            statement = req.query.statement;            
        
        var query = {
            $and: [
                {"bank.id": bank}, 
                {"bank_statement": statement}
            ]
        };        
        
        TransactionModel.find(query, function(err, doc){
            if(err) {
                console.log(err);
                res.send(500);
            }

            res.json(200, doc);
        });
    }
};
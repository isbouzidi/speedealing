"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var BankModel = mongoose.model('bank');
var TransactionModel = mongoose.model('Transaction');
    
module.exports = function (app, passport, auth) {

    var object = new Object();
    
    //verifie si la ref du nouveau compte bancaire exite ou pas
    app.get('/api/createBankAccount/uniqRef', auth.requiresLogin, object.uniqRef);
    
    //verifie si le libelle du nouveau compte bancaire exite ou pas
    app.get('/api/createBankAccount/uniqLibelle', auth.requiresLogin, object.uniqLibelle);
    
    //create a new bank account
    app.post('/api/bank', auth.requiresLogin, object.create);
    
    //get list of bank account
    app.get('/api/bank', auth.requiresLogin, object.read);
    
    //get bank account
    app.get('/api/bank/:accountId', auth.requiresLogin, object.show);
    
    //update an account bank
    app.put('/api/bank/:accountId', auth.requiresLogin, object.update);        
    
    app.param('accountId', object.account);
};

function Object() {
}

Object.prototype = {
    account: function (req, res, next, id) {
        
        BankModel.findOne({_id: id}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return console.log("failed to load bank account : " + id);
                
                req.account = doc;
                next();
        });        
    },
    read: function (req, res) {
        console.log('bank ********************');
        console.log(req.query.entity);
        console.log('bank ********************');        
        var balances = [];
        
        var query = {
                entity: {$in: ["ALL", req.query.entity]}
            };
        
        BankModel.find(query, function (err, doc) {
            if (err) {
                    console.log(err);
                    res.send(500, doc);
                    return;
            }
            res.json(200, doc);
        });
    },
    show: function (req, res) {
      
        res.json(req.account);
    },
    create: function (req, res){
        
        var bank = new BankModel(req.body);
        bank.author = {};
        bank.author.id = req.user._id;
        bank.author.name = req.user.name;
        
        if (bank.entity === null)
            bank.entity = req.user.entity;
                    
        console.log(bank);
        bank.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(bank);
        });
    },
    update: function (req, res) {
            
        var account = req.account;
        account = _.extend(account, req.body);

        account.save(function (err, doc) {

            if (err) {
                return console.log(err);
            }

            res.json(200, doc);
        });
    },
    uniqRef: function (req, res) {
        
        if (!req.query.ref)
                return res.send(404);

        var ref = req.query.ref;


        BankModel.findOne({ref: ref}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return res.json({});

                res.json(doc);
        });
    },
    uniqLibelle: function (req, res) {
        
        if (!req.query.libelle)
                return res.send(404);

        var libelle = req.query.libelle;


        BankModel.findOne({libelle: libelle}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return res.json({});

                res.json(doc);
        });
    }
};

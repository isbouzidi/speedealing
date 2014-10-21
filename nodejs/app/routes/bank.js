"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var BankModel = mongoose.model('bank');

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
};

function Object() {
}

Object.prototype = {
    read: function (req, res) {

        BankModel.find({}, function (err, doc) {
            if (err) {
                    console.log(err);
                    res.send(500, doc);
                    return;
            }

            res.send(200, doc);
        });
    },
    create: function (req, res){
        
        var bank = new BankModel(req.body);
        bank.author = {};
        bank.author.id = req.user._id;
        bank.author.name = req.user.name;

        console.log(bank);
        bank.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(bank);
        });
    },
    uniqRef: function (req, res) {
        
        if (!req.query.ref)
                return res.send(404);

        var ref = req.query.ref;


        BankModel.findOne({ref: ref}, "ref", function (err, doc) {
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


        BankModel.findOne({libelle: libelle}, "libelle", function (err, doc) {
                if (err)
                        return next(err);
                if (!doc)
                        return res.json({});

                res.json(doc);
        });
    }
};

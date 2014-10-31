"use strict";

var mongoose = require('mongoose'),
        async = require('async'),
        fs = require('fs'),
        csv = require('csv'),
        _ = require('lodash'),
        i18n = require("i18next"),
        config = require('../../config/config');

var BankCategoryModel = mongoose.model('BankCategory');

module.exports = function (app, passport, auth) {

    var object = new Object();

    //afficher la liste des rubriques des banques
    app.get('/api/bankCategory', auth.requiresLogin, object.read);
    
    //ajout d'une nouvelle rubrique de banque
    app.post('/api/bankCategory', auth.requiresLogin, object.create);

    app.param('bankCategoryId', object.bankCategoryId);
};

function Object() {

}

Object.prototype = {
    bankCategoryId: function (req, res, next, id) {
        BankCategoryModel.findOne({_id: id}, function (err, doc) {
            if (err)
                return next(err);
            if (!doc)
                return next(new Error('Failed to load bank category ' + id));

            req.bankCategory = doc;
            next();
        });
    },
    read: function (req, res) {
        BankCategoryModel.find({}, function (err, doc) {
            if (err) {
                
                res.send(500, doc);
                return;
            }

            res.send(200, doc);
        });
    },
    create: function (req, res) {
        
        var bankCategory = new BankCategoryModel(req.body);

        bankCategory.save(function(err, doc) {
            if (err) {
                return res.json(500, err);
                
            }

            res.json(200, bankCategory);
        });
    },
    update: function (req, res) {

    }
};
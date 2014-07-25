"use strict";

var mongoose = require('mongoose'),
        fs = require('fs'),
        csv = require('csv'),
        _ = require('underscore'),
        gridfs = require('../controllers/gridfs'),
        config = require('../../config/config');

var ReportModel = mongoose.model('report');
var ContactModel = mongoose.model('contact');
var ProductModel = mongoose.model('product');
var ExtrafieldModel = mongoose.model('extrafields');

module.exports = function(app, passport, auth) {

    var object = new Object();

    app.post('/api/report/autocomplete', auth.requiresLogin, function(req, res) {

        if (req.body.val === null)
            return res.send(200, {});
        console.log("contact : " + req.body.val);
        var val = req.body.val;

        var query = {"$or": [
                {firstname: new RegExp(val, "i")},
                {lastname: new RegExp(val, "i")}
            ]
        };

        ContactModel.find(query, {}, {limit: 5}, function(err, doc) {
            if (err) {
                console.log(err);
                return;
            }

            return res.send(200, doc);

        });

    });

    app.get('/api/report/caFamily/select', auth.requiresLogin, function(req, res) {


        ProductModel.distinct(req.query.field, function(err, data) {

            if (err) {
                console.log('Erreur : ' + err);
            } else {

                res.send(200, data);
            }
        });

        return;
    });

    app.get('/api/report/fk_extrafields/select', auth.requiresLogin, object.select);

    //add new report
    app.post('/api/reports', auth.requiresLogin, object.create);
    
    //get all report of a company
    app.get('/api/report', auth.requiresLogin, object.read);
};

function Object() {
}

Object.prototype = {
    select: function(req, res) {

        ExtrafieldModel.findById('extrafields:Report', function(err, doc) {
            if (err) {
                console.log(err);
                return;
            }

            var result = [];
            if (doc.fields[req.query.field])
                for (var i in doc.fields[req.query.field].values) {
                    if (doc.fields[req.query.field].values[i].enable) {
                        var val = {};
                        val.id = i;
                        val.label = doc.fields[req.query.field].values[i].label;
                        result.push(val);
                    }
                }

            res.json(result);
        });
    },
    create: function(req, res) {


        var reportModel = new ReportModel(req.body);
        console.log("log " + req.body.report);
        reportModel.save(function(err, doc) {
            if (err) {
                //return res.json(500, err);
                return console.log(err);
            }

            res.json(200, doc);
        });
    },
    read: function(req, res) {

        
            var query = {};
            var fields = {};
            
            query = JSON.parse(req.query.find);
            
            if (req.query.fields) {
                fields = req.query.fields;
            }

            ReportModel.find(query, fields, function(err, doc) {
                if (err) {
                    console.log(err);
                    res.send(500, doc);
                    return;
                }

                res.send(200, doc);
            });
    }
};
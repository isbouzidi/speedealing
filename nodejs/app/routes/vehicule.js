"use strict";

var mongoose = require('mongoose'),
        fs = require('fs'),
        csv = require('csv'),
        _ = require('lodash'),
        gridfs = require('../controllers/gridfs'),
        config = require('../../config/config');

var VehiculeModel = mongoose.model('europexpress_vehicule');

module.exports = function (app, passport, auth) {

    var object = new Object();

    app.get('/api/vehicule', auth.requiresLogin, object.read);
    app.get('/api/vehicule/:vehiculeId', auth.requiresLogin, object.show);
    app.post('/api/vehicule', auth.requiresLogin, object.create);
    app.put('/api/vehicule/:vehiculeId', auth.requiresLogin, object.update);
    app.post('/api/vehicule/autocomplete', auth.requiresLogin, function (req, res) {

        if (req.body.filter === null)
            return res.send(200, {});

        var val = "^" + req.body.filter;

        var query = {
            immat: new RegExp(val, "i")
        };

        VehiculeModel.find(query, "immat", function (err, doc) {
            if (err) {
                console.log(err);
                res.send(500);
            }
            console.log(doc);
            res.json(doc);

        });
    });

    // list for autocomplete
    app.post('/api/europexpress/vehicules/immat/autocomplete', auth.requiresLogin, function (req, res) {
        //console.dir(req.body);

        VehiculeModel.find({immat: new RegExp(req.body.filter.filters[0].value, "i")}, "immat", {limit: req.body.take}, function (err, docs) {
            if (err) {
                console.log("err : /api/europexpress/vehicules/immat/autocomplete");
                console.log(err);
                return;
            }

            var result = [];

            if (docs !== null)
                for (var i in docs) {
                    //console.log(docs[i]);
                    result[i] = {};
                    result[i].name = docs[i].immat;
                    //console.log(result);
                    result[i].id = docs[i]._id;
                }

            return res.send(200, result);
        });
    });


    app.param('vehiculeId', object.vehicule);
};

function Object() {
}
;

Object.prototype = {
    vehicule: function (req, res, next, id) {
        try {
            VehiculeModel.findOne({_id: id}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return next(new Error('Failed to load a vehicule ' + id));

                req.vehicule = doc;
                next();
            });
        } catch (e) {
            return next(e.message);
        }
    },
    read: function (req, res) {
        try {
            var query;

            if (req.query.find)
                query = JSON.parse(req.query.find);

            VehiculeModel.find(query, function (err, doc) {
                if (err) {
                    console.log(err);
                    res.send(500);
                }

                res.json(doc);

            });
        } catch (e) {
            console.log(e.message);
            res.send(500);
        }
    },
    show: function (req, res) {
        res.json(req.vehicule);
    },
    create: function (req, res) {
        var vehicule = new VehiculeModel(req.body);
        vehicule.author = {};
        vehicule.author.id = req.user._id;
        vehicule.author.name = req.user.name;

        vehicule.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(vehicule);
        });
    },
    update: function (req, res) {

        var vehicule = req.vehicule;
        vehicule = _.extend(vehicule, req.body);

        vehicule.save(function (err, doc) {

            if (err) {
                return console.log(err);
            }

            res.json(200, doc);
        });
    }
};

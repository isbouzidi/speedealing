"use strict";

var mongoose = require('mongoose'),
        fs = require('fs'),
        csv = require('csv'),
        _ = require('lodash'),
        gridfs = require('../controllers/gridfs'),
        config = require('../../config/config');

var PlanningModel = mongoose.model('chaumeil_planning');
var Dict = require('../controllers/dict');

module.exports = function (app, passport, auth) {

    var planning = new Planning();

    Dict.extrafield({extrafieldName: 'Chaumeil'}, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }

        planning.fk_extrafields = doc;
    });

    app.get('/api/chaumeil/planning', auth.requiresLogin, planning.read);
    app.get('/api/chaumeil/planning/:planningId', auth.requiresLogin, planning.show);
    app.post('/api/chaumeil/planning', auth.requiresLogin, planning.create);
    app.put('/api/chaumeil/planning/:planningId', auth.requiresLogin, planning.update);
    
    app.param('planningId', planning.planningId);
    
};

function Planning() {
}

Planning.prototype = {
    planningId: function (req, res, next, id) {
        try{
            PlanningModel.findOne({_id: id}, function (err, doc) {
                if (err)
                    return next(err);
                if (!doc)
                    return next(new Error('Failed to load a planning production ' + id));

                req.planningProd = doc;
                next();
        });        
        }catch(e){
            return next(e.message);
        }
    },
    create: function (req, res) {
        var planningProd = new PlanningModel(req.body);
        planningProd.author = {};
        planningProd.author.id = req.user._id;
        planningProd.author.name = req.user.name;                
                            
        planningProd.save(function (err, doc) {
            if (err) {
                return console.log(err);
            }

            res.json(planningProd);
        });
    },
    read: function (req, res) {
        try{
            var query = {};
        
        if (req.query.findDelivery)
            query.date_livraison = {$gte: req.query.findDelivery};
        
        if (req.query.findStatus)
            query.Status = req.query.findStatus;
        
        query.entity = req.user.entity;
            
        PlanningModel.find(query, function(err, doc){
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
    show: function (req, res) {
        res.json(req.planningProd);
    },
    update: function (req, res) {
        var planningProd = req.planningProd;
        planningProd = _.extend(planningProd, req.body);
        
        planningProd.save(function(err, doc) {
            
            if (err) {
                return console.log(err);
            }
            
            res.json(200, doc);
        });
    }
};
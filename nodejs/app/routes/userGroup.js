"use strict";

var mongoose = require('mongoose'),
    async = require('async'),
    fs = require('fs'),
    csv = require('csv'),
    _ = require('lodash'),
    gridfs = require('../controllers/gridfs'),
    i18n = require("i18next"),
    config = require('../../config/config');
                
var UserModel = mongoose.model('user');
var UserGroupModel = mongoose.model('userGroup');


module.exports = function(app, passport, auth) {

	var object = new Object();
        
	//afficher la liste des groupes de collaborateurs
        app.get('/api/userGroup', auth.requiresLogin, object.read);
        
        //recuperer la liste des groupes
        app.get('/api/userGroup/list', auth.requiresLogin, object.list);
        
        //verifie si le nouveau groupe exite ou pas
        app.get('/api/userGroup/uniqName', auth.requiresLogin, object.uniqName);
        
        //affiche la liste des collaborateurs du groupe
        app.get('/api/userGroup/users', auth.requiresLogin, object.listUsers);
        
        //affiche la liste des collaborateurs non affectés au groupe
        app.get('/api/userGroup/noUsers', auth.requiresLogin, object.listNoUsers);
        
        //ajout d'un nouveau groupe collaborateurs
        app.post('/api/userGroup', auth.requiresLogin, object.create);
        
        //afficher la fiche du groupe collaborateurs
        app.get('/api/userGroup/:userGroupId', auth.requiresLogin, object.show);
        
        //affecter un collaborateur à un groupe
        app.put('/api/userGroup/addUserToGroup', auth.requiresLogin, object.addToGroup);
        
        //Supprimer un groupe de collaborateurs
        app.del('/api/userGroup/:userGroupId', auth.requiresLogin, object.deleteUserGroup);
        
        //supprimer un collaborateur d'un groupe
        app.put('/api/userGroup/removeUserFromGroup', auth.requiresLogin, object.removeUserFromGroup);
        
        //modifier un groupe de collaborateur
        app.put('/api/userGroup/:userGroupId', auth.requiresLogin, object.update);
            
        app.param('userGroupId', object.userGroupId);
};

function Object() {
}

Object.prototype = {
    userGroupId: function(req, res, next, id){
        UserGroupModel.findOne({_id: id}, function(err, doc) {
            if (err)
                    return next(err);
            if (!doc)
                    return next(new Error('Failed to load userGroup ' + id));
            
            req.userGroup = doc;
            next();
        });
    },
    read: function(req, res) {
        
        var user;
        var group;
        var userGroup = [];
        
        UserGroupModel.find(function(err, doc){
            
            group = doc;
            
            UserModel.find(function(err, doc){
                
                user = doc;
                
                var counter;
                var i, j;
                for(i in group) {
                    counter = 0;
                    for(j in user) {
                        if(user[j].groupe === group[i]._id)
                            counter = counter + 1;
                        }
                    
                    userGroup.push({_id: group[i]._id, name: group[i].name, count: counter});
                }
                
                console.log(userGroup);
                res.send(200, userGroup);
            });
        });
    },
    uniqName: function(req, res) {
        
        if (!req.query.name)
                return res.send(404);

        var id = "group:" + req.query.name;
        
        UserGroupModel.findOne({_id: id}, "name", function(err, doc) {
                if (err)
                        return next(err);
                if (!doc)
                        return res.json({});
                
                res.json(doc);
        });

    },
    listUsers: function(req, res) {
        
        if (!req.query.groupe)
                return res.send(404);

        var groupe = req.query.groupe;
        
        UserModel.find({groupe: groupe}, function(err, doc) {
                if (err)
                        return next(err);
                if (!doc)
                        return res.json({});
                
                res.send(200, doc);
                
        });

    },
    listNoUsers: function(req, res) {
        
        if (!req.query.groupe)
                return res.send(404);

        var groupe = req.query.groupe;
        
        UserModel.find({groupe: {$nin: [groupe]}}, "_id lastname firstname", function(err, doc) {
                if (err)
                        return next(err);
                if (!doc)
                        return res.json({});
                
                res.send(200, doc);
                
        });

    },
    addToGroup: function(req, res){
        
        var user = req.query.user;
        var groupe = req.query.groupe;
        
        UserModel.update({_id:user}, {$set: {groupe : groupe}}, function(err, doc){
           if(err)
               return res.send(500, err);
           
           
           res.send(200);
        });
    },
    create: function(req, res) {
         
        var userGroup = new UserGroupModel(req.body);

        var name = req.body.name;
        userGroup._id = 'group:'+ name;

        userGroup.save(function(err, doc) {
            if (err) {
                return res.json(500, err);
                //return console.log(err);

            }

            res.json(200, userGroup);
        });
    },
    show: function(req, res) {
        res.json(req.userGroup);
    },
    deleteUserGroup: function(req, res){
        
        var userGroup = req.userGroup;
        
        userGroup.remove(function(err) {
            if (err) {
                    res.render('error', {
                            status: 500
                    });
            } else {
                    res.json(userGroup);
            }
        });
    },
    removeUserFromGroup: function(req, res){
        
        var user = req.query.user;
        var group = req.query.group;
        
        UserModel.update({_id: user}, {groupe: null }, function(err){
           if(err)
               return res.send(500, err);
           
           res.send(200);
        });
    },
    update: function(req, res){
        
        var userGroup = req.userGroup;
        userGroup = _.extend(userGroup, req.body);
        
        userGroup.save(function(err, doc) {
            
            if (err) {
                return console.log(err);
            }
            
            res.json(200, doc);
        });
    },
    list: function(req, res){
        
        var fields = req.query.fields;
        
        UserGroupModel.find("ALL" ,fields, function(err, doc){
            if(err)
                return res.send(500, err);
            
            res.json(200, doc);
        });
    }
};

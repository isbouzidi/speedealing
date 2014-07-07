"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var RhModel = mongoose.model('rh');
var ExtrafieldModel = mongoose.model('extrafields');
var EntityModel = mongoose.model('entity');
var DictModel = mongoose.model('dict');
var UserGroupModel = mongoose.model('userGroup');

module.exports = function(app, passport, auth) {

	var object = new Object();
        
	app.get('/api/rh', auth.requiresLogin, function(req, res) {
            
            
            object.read(req, res);
		return;
	});
        
        app.get('/api/rh/fk_extrafields/select', auth.requiresLogin, function(req, res){
            object.select(req, res, 'extrafields:User');
                return;
        });
        /*
        app.get('/api/userGroup/fk_extrafields/select', auth.requiresLogin, function(req, res){
            object.select(req, res, 'extrafields:UserGroup');
                return;
        });
        */
       
        app.get('/api/UserGroup/fk_extrafields/select', auth.requiresLogin, function(req, res){
            
            UserGroupModel.find(function(err, userGroup){
                
                if(err) {
			console.log('Erreur - Get UserGroup : '+ err);
		} else {
                    
			res.json(userGroup);
		}
            });
            
            return;
        });
       
        app.get('/api/site/fk_extrafields/select', auth.requiresLogin, function(req, res){
            
            EntityModel.find(function(err, entity){
                
                if(err) {
			console.log('Erreur - Get Entity(site) : '+ err);
		} else {
			res.json(entity);
		}
            });
            
            return;
        });
        
        app.get('/api/rh/pays/select', auth.requiresLogin, function(req, res){
            
            DictModel.findById(req.query.field, function(err, docs){
               
                if(err) {
			console.log('Erreur - Get Entity(site) : '+ err);
		} else {

                    var pays = [];

                    if (docs) {
                        for (var i in docs.values) {
                            if (docs.values[i].enable) {
                                
                                var val = {};
                                val.id = i;
                                
                                if (docs.values[i].label)
                                    val.label = docs.values[i].label;
                                else
                                    val.label = req.i18n.t("pays : " + i);
                                    pays.push(val);
                                }
                            }

                    }

                    res.json(pays);
		}
            });
            
            return;
        });
        
        app.post('/api/rh/file/:Id', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;
		//console.log(id);

		if (req.files && id) {
			//console.log(req.files);

			gridfs.addFile(RhModel, id, req.files.files, function(err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "Error in request file");
	});

	app.get('/api/rh/file/:Id/:fileName', auth.requiresLogin, function(req, res) {
		var id = req.params.Id;

		if (id && req.params.fileName) {

			gridfs.getFile(RhModel, id, req.params.fileName, function(err, store) {
				if (err)
					return res.send(500, err);

				if (req.query.download)
					res.attachment(store.filename); // for downloading 

				res.type(store.contentType);
				store.stream(true).pipe(res);

			});
		} else {
			res.send(500, "Error in request file");
		}

	});

	app.del('/api/ticket/file/:Id', auth.requiresLogin, function(req, res) {
                //console.log(req.body);
		var id = req.params.Id;
		//console.log(id);

		if (req.body.fileNames && id) {
			gridfs.delFile(RhModel, id, req.body.fileNames, function(err) {
				if (err)
					res.send(500, err);
				else
					res.send(200, {status: "ok"});
			});
		} else
			res.send(500, "File not found");
	});

        //ajout d'un nouveau collaborateur
        app.post('/api/rh', auth.requiresLogin, object.create);
        
        //afficher la fiche du collaborateur
        app.get('/api/rh/:rhId', auth.requiresLogin, object.show);
        
        //modifier une ficher de collaborateur
        app.put('/api/rh/:rhId', auth.requiresLogin, object.update);
        
        //supprimer une ficher de collaborateur
        app.del('/api/rh/:rhId', auth.requiresLogin, object.destroy);
        
        //verifie si le nouveau exite ou pas
        app.get('/api/user/uniqLogin', auth.requiresLogin, object.uniqLogin);
        
        //other routes..
        
        app.param('rhId', object.user);
};

function Object() {
}

Object.prototype = {
    user: function(req, res, next, id){
        RhModel.findOne({_id: id}, function(err, doc) {
            if (err)
                    return next(err);
            if (!doc)
                    return next(new Error('Failed to load user ' + id));
            
            req.user = doc;
            next();
        });
    },
    read: function(req, res) {
        
        console.log(req.query.query);
            
        RhModel.find(function(err, doc) {
                if (err) {
                        console.log(err);
                        res.json(500, doc);
                        return;
                }
                
                res.send(200, doc);
        });
    },
    show: function(req, res) {
        console.log("show : " + req.user);
        res.json(req.user);
    },
    
    create: function(req, res) {
         
        var rhUser = new RhModel(req.body);

        //rhUser.name = req.body.login.toLowerCase();
        var login = req.body.login;
        rhUser._id = 'user:'+ login;

        if (!rhUser.entity)
                rhUser.entity = req.user.entity;

            rhUser.save(function(err, doc) {
                if (err) {
                    return res.json(500, err);
                    //return console.log(err);
                    
                }
                
                res.json(200, rhUser);
            });
    },
    update: function(req, res){
        
        var user = req.user;
        user = _.extend(user, req.body);
        
        user.save(function(err, doc) {
            
            if (err) {
                return console.log(err);
            }
            
            res.json(200, doc);
        });
    },
    destroy: function(req, res){
        
        var user = req.user;
        user.remove(function(err) {
            if (err) {
                    res.render('error', {
                            status: 500
                    });
            } else {
                    res.json(user);
            }
        });
    },
    uniqLogin: function(req, res) {
        
        if (!req.query.login)
                return res.send(404);

        var login = "user:" + req.query.login;
        
        
        RhModel.findOne({_id: login}, "lastname firstname", function(err, doc) {
                if (err)
                        return next(err);
                if (!doc)
                        return res.json({});
                
                
                res.json(doc);
        });

    },
    select: function(req, res, extrafields) {

            //ExtrafieldModel.findById('extrafields:User', function(err, doc) {
            ExtrafieldModel.findById(extrafields, function(err, doc) {

                if (err) {
                            console.log(err);
                            return;
                }

                var result = [];

                if (doc.fields[req.query.field].dict)
                            return DictModel.findOne({_id: doc.fields[req.query.field].dict}, function(err, docs) {

                                    if (docs) {
                                            for (var i in docs.values) {
                                                    if (docs.values[i].enable) {
                                                            var val = {};
                                                            val.id = i;
                                                            if (docs.values[i].label)
                                                                    val.label = docs.values[i].label;
                                                            else
                                                                    val.label = req.i18n.t("user:" + i);
                                                            result.push(val);
                                                    }
                                            }
                                            doc.fields[req.query.field].values = result;
                                    }

                                    //res.json(doc.fields[req.query.field]);
                });

                for (var i in doc.fields[req.query.field].values) {
                        if (doc.fields[req.query.field].values[i].enable) {
                                var val = {};
                                val.id = i;
                                val.label = doc.fields[req.query.field].values[i].label;
                                result.push(val);
                        }
                }


                doc.fields[req.query.field].values = result;

                res.json(doc.fields[req.query.field]);

            });

    }
};

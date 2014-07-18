"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('underscore'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var ContactModel = mongoose.model('contact');

module.exports = function(app, passport, auth) {
    
    app.post('/api/report/autocomplete', auth.requiresLogin, function(req, res){
            
            if (req.body.val === null)
                return res.send(200, {});
            console.log("contact : " + req.body.val);
            var val = req.body.val;
            
            var query = { "$or": [
                            {firstname: new RegExp(val, "i")},
                            {lastname: new RegExp(val, "i")}
                        ]
            };
            
            ContactModel.find(query, {}, {limit: 5}, function(err, doc){
                if(err){
                    console.log(err);
                    return;
                }
                
                return res.send(200, doc);
                
            });
            
	});
};
"use strict";

var mongoose = require('mongoose'),
		fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		gridfs = require('../controllers/gridfs'),
		config = require('../../config/config');

var converter = require('json-2-csv');

module.exports = function(app, passport, auth) {
  
    app.get('/api/export', auth.requiresLogin, function(req, res) {
        
        var db;
        try{
            db = mongoose.model(req.query.model);
        
            var struct = req.query.request.split('.');
            var op = struct[1].split('(');
            var operation = op[0];

            var result = [];
            var query = eval(req.query.request);
            console.log(query);
            var promise = query.exec();
            
        }catch(e){
            res.send(500, e.message);
        }                
        
        promise.addBack(function (err, docs) {
            if(err)
                console.log(err);                        
                        
            switch(operation){
                case 'find':
                    /*
                    * code for find
                    */
                    if(query._fields)
                        var fields = Object.keys(query._fields);
                    else
                        return res.send(500, "Champs ne peux pas être vide")
                    
                    var csvString;
                    for (var i = 0; i < fields.length; i++) {
                        if (i === 0)
                            csvString = fields[i];
                        else
                            csvString = csvString + ';' + fields[i];
                    }

                    csvString = csvString + '\n';

                    for (var i = 1; i <= fields.length; i++) {
                        if (i < fields.length)
                            csvString = csvString + ';';
                        else
                            csvString = csvString + '\n';
                    }

                    var csv2jsonCallback = function (err, json) {
                       var obj;
                       if (err)
                           throw err;

                       for (var i = 0; i < docs.length; i++) {
                            var doc = docs[i];
                            obj = JSON.parse(JSON.stringify(json[0]));
                            obj = _.extend(obj, doc.toObject({virtuals: false}));
                            result.push(obj);
                            obj = {};                           
                       };
                       
                       var json2csvCallbackFind = function (err, csv) {
                           if (err) throw err;
                           //console.log(csv);
                           
                           var data = [result.slice(0, 100), csv];
                           var data = [result, csv];
                           res.send(data);
                       };
                        try{
                            converter.json2csv(result, json2csvCallbackFind, {DELIMITER: {FIELD  :  ';',ARRAY  :  ','}});
                        }catch(e){
                            res.send(500, e.message);
                        }                   
                   };
                   try{
                        converter.csv2json(csvString, csv2jsonCallback, {DELIMITER: {FIELD  :  ';',ARRAY  :  ','}});
                    }catch(e){
                        res.send(500, e.message);
                    };
                    break;
                case 'aggregate':
            
                /*
                 * code for aggregation
                 */
                
                    var json2csvCallbackAgg = function (err, csv) {
                        if (err)
                            throw err;                    
                        
                        var data = [docs.slice(0, 100), csv];
                        
                        res.send(data);
                    };
                    try{
                        converter.json2csv(docs, json2csvCallbackAgg, {DELIMITER: {FIELD  :  ';',ARRAY  :  ','}});
                    }catch(e){
                        res.send(500, e.message);
                    };
                    break;
                default : 
                    
                    res.send(500, "Opération non autorisée");
            }             
       });
       
    });    
};

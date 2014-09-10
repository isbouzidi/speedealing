"use strict";

var async = require('async'),
        mongoose = require('mongoose'),
        fs = require('fs'),
        i18n = require("i18next"),
        _ = require('underscore');

var rights = [];

fs.readdirSync(__dirname + '/../../config/modules').forEach(function(file) {


    if (file === "index.js")
        return;
    if (file.indexOf('.json') === null) // exclude not json
        return;

    fs.readFile(__dirname + '/../../config/modules/' + file, 'utf8', function(err, data) {
        if (err) {
            console.log('Error: ' + err);
            return;
        }

        data = JSON.parse(data);

        if (data.enabled) {

            rights.push({
                name: data.name,
                desc: data.description,
                rights: data.rights
            });

        }

    });

});

exports.rights = function(req, res) {
    res.json(rights);
};

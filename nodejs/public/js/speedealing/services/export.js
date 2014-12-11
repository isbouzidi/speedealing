"use strict";
/* global angular: true */

//Leads service used for lead REST endpoint
angular.module('mean.export').factory("Export", ['$resource', function($resource) {
    return $resource('api/export/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
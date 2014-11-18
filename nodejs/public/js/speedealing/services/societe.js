"use strict";
/* global angular: true */

//Societes service used for articles REST endpoint
angular.module('mean.societes').factory("Societes", ['$resource', function($resource) {
    return $resource('api/societe/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
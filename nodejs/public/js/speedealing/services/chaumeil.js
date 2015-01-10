"use strict";
/* global angular: true */

//Chaumeil service
angular.module('mean.chaumeil').factory("Chaumeil", ['$resource', function($resource) {
    return $resource('api/chaumeil/planning/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

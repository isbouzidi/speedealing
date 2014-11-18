"use strict";
/* global angular: true */

//Reports service
angular.module('mean.reports').factory("Reports", ['$resource', function($resource) {
    return $resource('api/reports/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
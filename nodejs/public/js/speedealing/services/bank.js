"use strict";
/* global angular: true */

//Bank service
angular.module('mean.bank').factory("Bank", ['$resource', function($resource) {
    return $resource('api/bank/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

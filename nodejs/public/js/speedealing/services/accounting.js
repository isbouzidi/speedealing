"use strict";
/* global angular: true */

//Accounting service used for REST endpoint
angular.module('mean.accounting').factory("Accounting", ['$resource', function($resource) {
    return $resource('api/accounting/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
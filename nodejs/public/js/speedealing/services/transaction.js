"use strict";
/* global angular: true */

//Transaction service
angular.module('mean.transaction').factory("Transaction", ['$resource', function($resource) {
    return $resource('api/transaction/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

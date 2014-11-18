"use strict";
/* global angular: true */
//Bank Category service
angular.module('mean.bankCategory').factory("BankCategory", ['$resource', function($resource) {
    return $resource('api/bankCategory/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
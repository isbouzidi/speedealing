"use strict";
/* global angular: true */

//User Group service used for UserGroup REST endpoint
angular.module('mean.userGroup').factory("UserGroup", ['$resource', function($resource) {
    return $resource('api/userGroup/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
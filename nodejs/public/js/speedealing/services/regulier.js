"use strict";

//Regulier service
angular.module('mean.regulier').factory("Regulier", ['$resource', function($resource) {
    return $resource('api/regulier/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

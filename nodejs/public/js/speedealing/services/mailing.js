"use strict";

//Emailing service
angular.module('mean.mailing').factory("Mailing", ['$resource', function($resource) {
    return $resource('api/mailing/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

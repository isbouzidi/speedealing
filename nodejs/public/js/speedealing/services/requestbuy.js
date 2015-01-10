"use strict";

//RequestBuy service
angular.module('mean.requestBuy').factory("RequestBuy", ['$resource', function($resource) {
    return $resource('api/requestBuy/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

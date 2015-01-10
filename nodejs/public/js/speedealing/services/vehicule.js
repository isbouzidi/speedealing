"use strict";

//Vehicule service
angular.module('mean.vehicule').factory("Vehicule", ['$resource', function($resource) {
    return $resource('api/vehicule/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

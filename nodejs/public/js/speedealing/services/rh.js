//Ressources Humaines service used for RH REST endpoint
angular.module('mean.rh').factory("RH", ['$resource', function($resource) {
    return $resource('api/rh/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
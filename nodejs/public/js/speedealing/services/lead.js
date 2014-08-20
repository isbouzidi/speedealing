//Leads service used for lead REST endpoint
angular.module('mean.lead').factory("Lead", ['$resource', function($resource) {
    return $resource('api/lead/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
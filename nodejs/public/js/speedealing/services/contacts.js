angular.module('mean.contacts').factory("Contacts", ['$resource', function($resource) {
    return $resource('api/contact/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
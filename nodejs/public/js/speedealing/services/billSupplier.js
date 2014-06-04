//Bills service used for REST endpoint
angular.module('mean.bills').factory("BillsSupplier", ['$resource', function($resource) {
    return $resource('api/billSupplier/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
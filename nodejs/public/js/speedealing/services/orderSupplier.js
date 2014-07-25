//Orders Supplier service used for REST endpoint
angular.module('mean.ordersSupplier').factory("OrdersSupplier", ['$resource', function($resource) {
    return $resource('api/orderSupplier/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
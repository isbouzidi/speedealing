//Bills service used for REST endpoint
angular.module('mean.delivery').factory("Deliveries", ['$resource', function($resource) {
    return $resource('api/delivery/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        },
		clone:{
			method:'POST',
			params : {
				clone:1
			}
		}
    });
}]);
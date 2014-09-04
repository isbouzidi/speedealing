//Bills service used for REST endpoint
angular.module('mean.products').factory("Products", ['$resource', function($resource) {
    return $resource('api/product/:Id', {
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
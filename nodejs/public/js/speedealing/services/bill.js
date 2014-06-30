//Bills service used for REST endpoint
angular.module('mean.bills').factory("Bills", ['$resource', function($resource) {
    return $resource('api/bill/:Id', {
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
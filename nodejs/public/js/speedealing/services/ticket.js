//Speedealing service used for REST endpoint
angular.module('mean.system').factory("Ticket", ['$resource', function($resource) {
		return $resource('api/ticket/:id', {
				id: '@_id'
			}, {
				update: {
					method: 'PUT'
				}
			});
	}]);
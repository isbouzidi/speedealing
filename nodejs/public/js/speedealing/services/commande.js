//Speedealing service used for REST endpoint
angular.module('mean.system').factory("Order", ['$resource', function($resource) {
		return $resource('api/commande/:id', {
				id: '@_id'
			}, {
				update: {
					method: 'PUT'
				}
			});
	}]);
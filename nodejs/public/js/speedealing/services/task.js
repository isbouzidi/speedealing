//Speedealing service used for REST endpoint
angular.module('mean.system').factory("Task", ['$resource', function($resource) {
		return $resource('api/task/:id', {
				id: '@_id'
			}, {
				update: {
					method: 'PUT'
				}
			});
	}]);
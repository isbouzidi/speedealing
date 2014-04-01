//Users service used REST endpoint
angular.module('mean.users').factory("Users", ['$resource', function($resource) {
		return {
			absences: $resource('api/user/absence/:Id', {
				Id: '@_id'
			}, {
				update: {
					method: 'PUT'
				}
			})
		};
	}]);
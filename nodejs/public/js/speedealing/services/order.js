"use strict";
/* global angular: true */

//Orders service used for articles REST endpoint
angular.module('mean.orders').factory("Orders", ['$resource', function ($resource) {
		return $resource('api/commande/:Id', {
			Id: '@_id'
		}, {
			update: {
				method: 'PUT'
			},
			clone: {
				method: 'POST',
				params: {
					clone: 1
				}
			},
			delivery: {
				method: 'POST',
				params: {
					delivery: 1
				}
			}
		});
	}]);
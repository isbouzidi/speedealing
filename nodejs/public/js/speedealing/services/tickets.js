"use strict";
/* global angular: true */

//Speedealing service used for REST endpoint
angular.module('mean.tickets').factory("Tickets", ['$resource', function($resource) {
	return $resource('api/tickets/:id', {
		id: '@_id'
	}, {
		update: {
			method: 'PUT'
		}
	});
}]);
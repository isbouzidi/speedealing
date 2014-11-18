"use strict";
/* global angular: true */

//Speedealing service used for REST endpoint
angular.module('mean.system').factory("Task", ['$resource', function($resource) {
	return $resource('api/task/:Id', {
		Id: '@_id'
	}, {
		update: {
			method: 'PUT'
		}
	});
}]);
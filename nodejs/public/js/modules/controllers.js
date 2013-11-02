'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
controller('AppCtrl', function ($scope, $http) {

	$http({
		method: 'GET',
		url: 'api/name'
	}).
	success(function (data, status, headers, config) {
		$scope.name = data.name;
		$scope.title = data.title;
	}).
	error(function (data, status, headers, config) {
		$scope.name = 'Error!';
		$scope.title = 'Error!'
	});

}).
controller('MyCtrl1', function ($scope) {
	// write Ctrl here
}).
controller('MyCtrl2', function ($scope) {
	// write Ctrl here
});

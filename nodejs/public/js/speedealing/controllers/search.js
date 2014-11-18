"use strict";
/* global angular: true */

angular.module('mean.system').controller('SearchController', ['$rootScope', '$scope', '$location', '$routeParams', '$modal', 'Global', 'socket', '$http', function ($rootScope, $scope, $location, $routeParams, $modal, Global, socket, $http) {
		$scope.global = Global;

		$scope.init = function () {

			if ($rootScope.searchQuery) {
				$scope.searchItem = $rootScope.searchQuery;
			}
			if ($rootScope.showSearchInput)
				$rootScope.showSearchInput = false;

		};

		$scope.search = function () {

			var item = $scope.searchItem;
			$scope.find(item);

		};

		$scope.btnSearch = function () {
			$scope.search();
		};

		$scope.find = function (item) {

			if (item) {
				$http({method: 'GET', url: '/api/contact/searchEngine',
					params: {
						item: item,
						limit: 300
					},
				}).success(function (data) {
					$scope.results = data;
					$scope.resultsCount = data.length;
				});
			}
			else {
				$scope.results = 0;
			}
		};

		$scope.$on('$destroy', function () {

			$rootScope.showSearchInput = true;

		});

		$scope.showContact = function (id) {
			var modalInstance = $modal.open({
				templateUrl: '/partials/contacts/fiche.html',
				controller: "ContactsController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							contact: id
						};
					}
				}
			});
		};
		
		$scope.addNewContact = function () {

			var modalInstance = $modal.open({
				templateUrl: '/partials/contacts/create.html',
				controller: "ContactCreateController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							societe: null
						};
					}
				}
			});

			modalInstance.result.then(function (contacts) {
			}, function () {
			});
		};

	}]);
angular.module('mean.system').controller('CHMOtisController', ['$scope', 'Global', function($scope, Global) {
		$scope.global = Global;
		$scope.order = {};

		$scope.active = 1;

		$scope.isActive = function(idx) {
			if (idx == $scope.active)
				return "active";
		};

		$scope.next = function() {
			$scope.active++;
		};

		$scope.previous = function() {
			$scope.active--;
		};

		$scope.goto = function(idx) {
			if(idx < $scope.active)
				$scope.active = idx;
		};

	}]);
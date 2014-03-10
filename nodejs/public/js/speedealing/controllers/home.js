angular.module('mean.system').controller('IndexHomeController', ['$scope', '$location', 'Global', function ($scope, $location, Global) {
    $scope.global = Global;
	
	$scope.dateNow = new Date();
}]);
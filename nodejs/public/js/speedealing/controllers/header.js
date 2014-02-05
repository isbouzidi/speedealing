angular.module('mean.system').controller('HeaderController', ['$scope', 'Global', function ($scope, Global) {
    $scope.global = Global;
	
    $scope.title = "Speedealing";
	
	$scope.withMenu = function(){
		//console.log(Global);
		if(Global && Global.user.right_menu)
			return "with-menu";
	};
	
}]);
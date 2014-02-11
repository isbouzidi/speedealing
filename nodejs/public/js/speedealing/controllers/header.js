angular.module('mean.system').controller('HeaderController', ['$scope', 'Global', 'pageTitle', function($scope, Global, pageTitle) {
		$scope.global = Global;

		$scope.title = pageTitle.getTitle();

		$scope.withMenu = function() {
			//console.log(Global);
			if (Global && Global.user.right_menu)
				return "with-menu";
		};

	}]);
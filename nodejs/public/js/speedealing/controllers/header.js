angular.module('mean.system').controller('HeaderController', ['$scope', '$http', '$route', 'Global', 'pageTitle', function($scope, $http, $route, Global, pageTitle) {
		$scope.global = Global;

		$scope.title = pageTitle.getTitle();

		$scope.withMenu = function() {
			//console.log(Global);
			if (Global && Global.user.right_menu)
				return "with-menu";
		};

		$scope.getEntities = function() {
			$http({method: 'GET', url: 'api/entity/select'
			}).
					success(function(data, status) {
				$scope.entities = data;
			});
		};

		$scope.entity = {id: Global.user.entity, name: Global.user.entity};

		$scope.changeEntity = function() {
			$scope.title = pageTitle.getTitle();
			//Global.user.entity = $scope.entity.id;
			$route.reload();
		}

	}]);
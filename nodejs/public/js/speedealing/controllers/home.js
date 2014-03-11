angular.module('mean.system').controller('IndexHomeController', ['$scope', '$location', '$http', 'Global', function($scope, $location, $http, Global) {
		$scope.global = Global;

		$scope.dateNow = new Date();
		$scope.userConnection = [];
		$scope.indicateurs = {};
		$scope.familles = {};

		if (Global.user.url) {
			return $location.path(Global.user.url.substr(2)); // Go to default url
		}

		$scope.connection = function() {
			$http({method: 'GET', url: 'api/user/connection'
			}).success(function(users, status) {
				$scope.userConnection = users;
			});
		};

		$scope.indicateur = function() {
			$scope.indicateurs.hsupp = 0;
			$scope.indicateurs.abs = 0;

			$http({method: 'GET', url: 'api/user/absence/count'
			}).success(function(cpt, status) {
				$scope.indicateurs.abs = cpt.sum;
			});

			$http({method: 'GET', url: 'api/europexpress/planning/countHSupp'
			}).success(function(cpt, status) {
				$scope.indicateurs.hsupp = cpt.sum;
			});
		};

		$scope.familleCA = function() {
			$http({method: 'GET', url: 'api/europexpress/courses/stats'
			}).success(function(ca, status) {
				//console.log(ca);
				$scope.familles = ca;
			});
		};

	}]);
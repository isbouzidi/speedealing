angular.module('mean.system').controller('HeaderController', ['$scope', '$http', '$route', 'Global', 'pageTitle', function($scope, $http, $route, Global, pageTitle) {
		$scope.global = Global;
		//console.log(Global);

		$scope.title = pageTitle.getTitle();

		$scope.withMenu = function() {
			//console.log(Global);
			if (Global && Global.user.right_menu)
				return "with-menu";
		};

		$scope.getEntities = function() {
			$http({method: 'GET', url: 'api/entity/select'
			}).success(function(data, status) {
				$scope.entities = data;
			});
		};

		$scope.entity = {id: Global.user.entity, name: Global.user.entity};

		$scope.changeEntity = function() {
			$scope.title = pageTitle.getTitle();
			//Global.user.entity = $scope.entity.id;
			$route.reload();
		};

		$scope.filteredResults = [];
		$scope.currentPage = 1;
		$scope.numPerPage = 3;
		$scope.maxSize = 5;

//        $scope.$watch('searchItem', function(item) {
//            $scope.currentPage = 1;
//            $scope.showPagination = false;
//            if (item) {
//
//                $http({method: 'GET', url: '/api/contact/searchEngine',
//                    params: {item: item}
//
//                }).success(function(data) {
//                    
//                    $scope.results = data;
//                    $scope.resultsCount = data.length;
//                    if (data.length > 0)
//                        $scope.showPagination = true;
//                    
//                    $scope.$watch('currentPage + numPerPage', function() {
//                        var begin = (($scope.currentPage - 1) * $scope.numPerPage);
//                        var end = begin + $scope.numPerPage;
//                        
//                        $scope.filteredResults = $scope.results.slice(begin, end);
//                    });
//                    
//                });
//                
//                $scope.numPages = function() {
//                    return Math.ceil($scope.results.length / $scope.numPerPage);
//                };
//
//            }
//        });

	}]);
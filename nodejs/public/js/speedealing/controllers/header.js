angular.module('mean.system').controller('HeaderController', ['$scope', '$http', '$route', 'Global', 'pageTitle', function($scope, $http, $route, Global, pageTitle) {
		$scope.global = Global;
		//console.log(Global);
		
		$scope.title = pageTitle.getTitle();
                $scope.currentPage = 0;
                $scope.pageSize = 5;
                
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
		};
                
                $scope.$watch('searchItem', function(item){
                    
                    if(item){
                        
                        $http({ method: 'GET', url: '/api/contact/searchEngine', 
                                params: { item: item }

                                }).success(function(data) {

                                    $scope.results = data;
                         });
                         
                        $scope.numberOfPages=function(){
                            return Math.ceil($scope.results.length/$scope.pageSize);          
                        };
                        
                    }
                });

	}]);
    
        app.filter('startFrom', function() {
            return function(input, start) {
                start = +start;
                return input.slice(start);
            };
        });
"use strict";
/* global angular: true */

angular.module('mean.system').controller('HeaderController', ['$scope', '$rootScope', '$http', '$route', 'Global', 'pageTitle', 'superCache', function ($scope, $rootScope, $http, $route, Global, pageTitle, superCache) {
		$scope.global = Global;
		//console.log(Global);

		$scope.title = pageTitle.getTitle();

		$scope.withMenu = function () {
			//console.log(Global);
			if (Global && Global.user.right_menu)
				return "with-menu";
		};

		if (Global.user.multiEntities)
			$http({method: 'GET', url: 'api/entity/select'
			}).success(function (data, status) {
				$rootScope.entities = data;
			});

		/*$scope.getEntities = function() {
		 $http({method: 'GET', url: 'api/entity/select'
		 }).success(function(data, status) {
		 $rootScope.entities = data;
		 });
		 };*/

		$scope.entity = {id: Global.user.entity, name: Global.user.entity};

		$scope.changeEntity = function () {
                        
                        $http({method: 'POST', url: '/api/user/changeEntity', params: {
                            id: Global.user._id,
                            entity: Global.user.entity
                        }
                        }).success(function () {
                            
                        });
                        $scope.title = pageTitle.getTitle();
                        //Global.user.entity = $scope.entity.id;
                        $route.reload();
                        superCache.removeAll();                        
		};

		$scope.filteredResults = [];
		$scope.currentPage = 1;
		$scope.numPerPage = 3;
		$scope.maxSize = 5;

		$rootScope.AutoComplete = function (val, url, max) {
			return $http.post(url, {
				take: max,
				skip: 0,
				page: 1,
				pageSize: 5,
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				//console.log(res.data);
				return res.data;
			});
		};

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
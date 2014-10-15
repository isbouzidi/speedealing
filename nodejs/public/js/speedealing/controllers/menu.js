angular.module('mean.system').controller('MenuController', ['$rootScope', '$scope', '$routeParams', 'Global', 'socket', '$http', '$translate', '$location', function($rootScope, $scope, $routeParams, Global, socket, $http, $translate, $location) {
		$scope.global = Global;

		$scope.ticketCpt = 0;
		$scope.menus = {};
		$scope.menuTasks = [];
		$rootScope.showSearchInput = true;

		$translate.use("fr-FR");

		//socket.emit('user', Global.user._id);

		//socket.on('reboot', function(data) {
		//	socket.emit('user', Global.user._id);
		//});

		socket.on('notify', function(data) {
			notify(data.title, data.message, data.options);
		});

		$scope.selectedMenu = function(id) {
			if ($routeParams.idmenu === id)
				return "current collapsible-current";
		};

		$scope.searchQuery = function() {
			if ($scope.searchQueryItem.length) {
				$rootScope.searchQuery = $scope.searchQueryItem;
				$location.path("/search");

				//$location.path('/search').search('q',$scope.searchQueryItem);
				$rootScope.showSearchInput = false;
				$scope.searchQueryItem = "";

			} else {

				$location.path(Global.lastPath);
			}

		};

		$scope.init = function() {
			$http({method: 'GET', url: '/menus'}).success(function(data, status) {
				$scope.menus = data;                    
			});
			
			$http({method: 'GET', url: '/api/task',
				params:{
					fields:"societe datep name",
					query : 'TODAYMYRDV',
					user : Global.user.id
				}
			}).success(function(data, status) {
				$scope.menuTasks = data;
				console.log(data);
			});
		};
                
		/*socket.on('news', function(data) {
		 notify('<span class="icon-info-round"> </span><i>Philippe</i> : Appeler DHL', data.hello, {
		 autoClose: true,
		 delay: 300,
		 classes: ["orange-gradient"],
		 icon: 'img/emotes/face-smile.png'
		 });
		 socket.emit('my other event', {my: 'data'});
		 });*/

		$scope.ticketCounter = function() {
			$http({method: 'GET', url: 'api/ticket?count=1'
			}).
					success(function(data, status) {
						$scope.ticketCpt = data.cpt;
					});
		};

		$scope.taskCounter = function() {
			$http({method: 'GET', url: '/api/reports/listTasks', params: {
					user: Global.user._id
				}
			}).success(function(data, status) {
				$scope.tasksCpt = data.length;
			});
		};

		socket.on('refreshTicket', function(data) {
			$scope.ticketCounter();
			$scope.taskCounter();
		});

		/* Resize all elements */
		angular.element(document).ready(function() {
			setTimeout(function() {
				angular.element(window).resize();
			}, 300);
			setTimeout(function() {
				angular.element(window).resize();
			}, 2000);
		});
	}]);
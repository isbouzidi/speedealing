angular.module('mean.system').controller('MenuController', ['$scope', '$routeParams', 'Global', 'socket', '$http', function($scope, $routeParams, Global, socket, $http) {
		$scope.global = Global;

		$scope.ticketCpt = 0;

		//socket.emit('user', Global.user._id);

		//socket.on('reboot', function(data) {
		//	socket.emit('user', Global.user._id);
		//});

		socket.on('notify', function(data) {
			notify(data.title, data.message, data.options);
		});

		$scope.selectedMenu = function(id) {
			if($routeParams.idmenu === id)
				return "current collapsible-current";
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

		socket.on('refreshTicket', function(data) {
			$scope.ticketCounter();
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
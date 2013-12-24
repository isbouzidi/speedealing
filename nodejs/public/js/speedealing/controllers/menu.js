angular.module('mean.system').controller('MenuController', ['$scope', 'Global', 'socket', function($scope, Global, socket) {
		$scope.global = Global;

		socket.on('news', function(data) {
			notify('<span class="icon-info-round"> </span><i>Philippe</i> : Appeler DHL', data.hello, {
				autoClose: true,
				delay: 300,
				classes: ["orange-gradient"],
				icon: 'img/emotes/face-smile.png'
			});
			socket.emit('my other event', {my: 'data'});
		});
	}]);
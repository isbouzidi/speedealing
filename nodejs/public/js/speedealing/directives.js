angular.module('mean.system').directive('resize', ['$window', function($window) {
		return function(scope, element) {
			var w = angular.element($window);
			//var w = element;
			//console.log(element.height());
			//console.log(element.width());
			//console.log(w);
			scope.getWindowDimensions = function() {
				return {'h': w.height(), 'w': w.width()};
			};
			scope.$watch(scope.getWindowDimensions, function(newValue, oldValue) {
				//scope.windowHeight = newValue.h;
				//scope.windowWidth = newValue.w;

				scope.style = function(height) {
					return {
						'height': (newValue.h - 35 - height) + 'px'
					//	'width': (newValue.w - 100) + 'px'
					};
				};

			}, true);

			w.bind('resize', function() {
				scope.$apply();
			});
		};
	}]);
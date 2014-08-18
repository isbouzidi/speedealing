angular.module('mean').directive('resize', ['$window', function($window) {
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
				scope.windowHeight = newValue.h;
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

angular.module('mean.system').directive('sdBarcode', function() {
	return {
		// Restrict tells AngularJS how you will be declaring your directive in the markup.
		// A = attribute, C = class, E = element and M = comment
		restrict: 'A',
		scope: {
			barcodeValue: '@'
		},
		link: function(scope, elem, attrs) {
			elem.barcode(attrs.barcodeValue.toString(), "code128");
		}
	};
});

/*angular.module('mean.system').directive('sdSelect', function() {
 return function(scope, element) {
 //console.log(element.parent());
 var id = element.parent();
 console.log(id)
 
 //element.text("{{course.Status.css}}");
 
 //var replaced = $(this),
 var select = id.data('replacement');
 console.log(select);
 
 // If valid
 //if (select)
 //{
 //	_updateSelectText(select, replaced, select.data('select-settings'));
 //}
 
 
 //return {
 //restrict: 'E',
 //template : 'Hello {{course.Status.css}}'
 //};
 };
 });*/

angular.module('mean.system').directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter, {'event': event});
				});

				event.preventDefault();
			}
		});
	};
});

angular.module('mean.system').directive('ngBlur', function() {
	return function(scope, elem, attrs) {
		elem.bind('blur', function(event) {
			scope.$apply(attrs.ngBlur);
		});
	};
});

angular.module('mean.system').directive('myFocus', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            scope.$watch(attr.myFocus, function (n, o) {
                if (n != 0 && n) {
                    element[0].focus();
                }
            });
        }
    };
});


"use strict";
/* global angular: true */

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
			scope.$eval(attrs.ngBlur);
		});
	};
});

angular.module('mean.system').directive('ngConfirmClick', ['dialogs', function(dialogs) {
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', function() {
					var message = attrs.ngConfirmClick || "Etes-vous sur ?";

					var dlg = dialogs.confirm("Confirmation", message);
					dlg.result.then(function(btn) {
						scope.$eval(attrs.confirmedClick);
					}, function(btn) {
						// Button NO
					});
				});
			}
		};
	}]);

angular.module('mean.system').directive('myFocus', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attr) {
			scope.$watch(attr.myFocus, function(n, o) {
				if (n != 0 && n) {
					element[0].focus();
				}
			});
		}
	};
});
angular.module('mean.system').directive('ngAddress', function($http) {
	return {
		restrict: 'A',
		scope: {
			addressModel: '=model',
			opp: '=?'
		},
		templateUrl: function(el, attr) {
			if (attr.opp) {
				if (attr.opp === 'create') {
					return '/partials/address.html';
				}
				if (attr.opp === 'update') {
					return '/partials/updateAddress.html';
				}
			} else
				return '/partials/address.html';
		},
		link: function(scope) {

			scope.updateAddressDir = true;

			scope.deletedAddress = {
				address: null,
				zip: null,
				town: null
			};

			scope.enableUpdateAddress = function() {
				scope.deletedAddress = {
					address: scope.addressModel.address,
					zip: scope.addressModel.zip,
					town: scope.addressModel.town
				};

				scope.updateAddressDir = !scope.updateAddressDir;
			};

			scope.cancelUpdateAddress = function() {
				scope.addressModel.address = scope.deletedAddress.address;
				scope.addressModel.zip = scope.deletedAddress.zip;
				scope.addressModel.town = scope.deletedAddress.town;
				scope.updateAddressDir = !scope.updateAddressDir;
			};
			scope.getLocation = function(val) {
				return $http.post('api/zipcode/autocomplete', {
					val: val
				}).then(function(res) {

					return res.data;
				});
			};

			scope.generateZip = function(item) {
				scope.addressModel.zip = item.code;
				scope.addressModel.town = item.city;
			};
		}
	};
});

angular.module('mean.system')
  .factory('superCache', ['$cacheFactory', function($cacheFactory) {
    return $cacheFactory('super-cache');
 }]);

angular.module('mean.system').directive('ckEditor', [function () {
        return {
            require: '?ngModel',
            restrict: 'C',
            link: function (scope, elm, attr, model) {
                var isReady = false;
                var data = [];
                var ck = CKEDITOR.replace(elm[0]);
                
                function setData() {
                    if (!data.length) {
                        return;
                    }
                    
                    var d = data.splice(0, 1);
                    ck.setData(d[0] || '<span></span>', function () {
                        setData();
                        isReady = true;
                    });
                }

                ck.on('instanceReady', function (e) {
                    if (model) {
                        setData();
                    }
                });
                
                elm.bind('$destroy', function () {
                    ck.destroy(false);
                });

                if (model) {
                    ck.on('change', function () {
                        scope.$apply(function () {
                            var data = ck.getData();
                            if (data == '<span></span>') {
                                data = null;
                            }
                            model.$setViewValue(data);
                        });
                    });

                    model.$render = function (value) {
                        if (model.$viewValue === undefined) {
                            model.$setViewValue(null);
                            model.$viewValue = null;
                        }

                        data.push(model.$viewValue);

                        if (isReady) {
                            isReady = false;
                            setData();
                        }
                    };
                }
                
            }
        };
    }]);
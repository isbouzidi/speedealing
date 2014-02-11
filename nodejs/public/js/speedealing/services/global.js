angular.module('mean.system').factory("Global", [function() {
		var _this = this;
		_this._data = {
			user: window.user,
			authenticated: !!window.user,
			title: window.title
		};

		return _this._data;
	}]);

angular.module('mean.system').service('pageTitle', function($window) {

	var myService = {};
	var data = {title: "Speedealing " /*+ window.user.company */+ " (" + window.user.entity + ")"};

	myService.setTitle = function(documentTitle) {
		$window.document.title = "Speedealing - " + documentTitle;
		//$rootScope.$apply(function() {
		data.title = "Speedealing - " /*+ window.user.company*/ + " (" + window.user.entity + ") - " + documentTitle;
		//});
	};

	myService.getTitle = function() {
		return data;
	}

	return myService;
}, {$inject: '$window'});
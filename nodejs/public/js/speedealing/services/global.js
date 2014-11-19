"use strict";
/* global angular: true */

angular.module('mean.system').factory("Global", [function() {
		var _this = this;
		_this._data = {
			user: window.user,
			authenticated: !!window.user,
			title: window.title
		};

		return _this._data;
	}]);

angular.module('mean.system').service('pageTitle', function($window, Global) {

	var myService = {};
	var data = {title: "Speedealing " /*+ window.user.company */+ " (" + Global.user.entity + ")"};

	myService.setTitle = function(documentTitle) {
		$window.document.title = "Speedealing - " + documentTitle;
		//$rootScope.$apply(function() {
		data.title = "Speedealing " /*+ window.user.company*/ + " (" + Global.user.entity + ") - " + documentTitle;
		//});
	};

	myService.getTitle = function() {
		return data;
	};

	return myService;
}, {$inject: ['$window','Global']});
window.app = angular.module('mean', ['ngRoute',
	'ngCookies',
	'ngSanitize',
	'ngResource',
	'ui.bootstrap',
	'kendo.directives',
	'ngAnimate',
	'angularFileUpload',
	'ngGrid',
	"xeditable",
	"highcharts-ng",
	"ngTagsInput",
	"ui.bootstrap.datetimepicker",
	'mean.system',
	'mean.societes',
	'mean.orders',
	'mean.users',
	'mean.articles',
	'mean.europexpress'
]);

angular.module('mean.system', []);
angular.module('mean.societes', []);
angular.module('mean.orders', []);
angular.module('mean.users', []);
angular.module('mean.articles', []);
angular.module('mean.europexpress', []);

window.app.run(function(editableOptions, editableThemes) {
	// bootstrap3 theme. Can be also 'bs2', 'default'
	editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';
});
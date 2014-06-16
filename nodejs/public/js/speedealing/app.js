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
	'mean.system',
	'mean.societes',
	'mean.orders',
	'mean.users',
	'mean.articles',
	'mean.europexpress',
	'mean.rh'
]);

angular.module('mean.system', []);
angular.module('mean.societes', []);
angular.module('mean.orders', []);
angular.module('mean.users', []);
angular.module('mean.articles', []);
angular.module('mean.europexpress', []);
angular.module('mean.rh', []);

/*window.app.run(function(editableOptions) {
 editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
 });*/

window.app = angular.module('mean', [
	'ngRoute',
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
	'mean.bills',
	'mean.users',
	'mean.accounting',
	'mean.articles',
	'mean.europexpress',
	'timer',
	'mean.rh',
	'mean.userGroup',
	'mean.contacts',
        'mean.reports',
        'mean.delivery',
        'mean.lead',
	'checklist-model'
]);

angular.module('mean.system', []);
angular.module('mean.societes', []);
angular.module('mean.orders', []);
angular.module('mean.users', []);
angular.module('mean.bills', []);
angular.module('mean.accounting', []);
angular.module('mean.articles', []);
angular.module('mean.europexpress', []);
angular.module('mean.rh', []);
angular.module('mean.userGroup', []);
angular.module('mean.contacts', []);
angular.module('mean.reports', []);
angular.module('mean.delivery', []);
angular.module('mean.lead', []);

window.app.run(function(editableOptions, editableThemes) {
	// bootstrap3 theme. Can be also 'bs2', 'default'
	editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';
});

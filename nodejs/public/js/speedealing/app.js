"use strict";

window.app = angular.module('mean', [
	'ngRoute',
	'ngCookies',
	'ngSanitize',
	'ngResource',
	"xeditable",
	'ui.bootstrap',
	'dialogs.main',
	'kendo.directives',
	//'ngAnimate',
	'angularFileUpload',
	'ngGrid',
	"highcharts-ng",
	"ngTagsInput",
	"ui.bootstrap.datetimepicker",
	'mean.system',
	'mean.societes',
	'mean.products',
	'mean.orders',
	'mean.ordersSupplier',
	'mean.bills',
	'mean.users',
	'mean.accounting',
	'mean.articles',
	'mean.europexpress',
	'timer',
	'mean.userGroup',
	'mean.contacts',
	'mean.reports',
	'mean.delivery',
	'mean.lead',
	'timer',
	'pascalprecht.translate',
	'jm.i18next',
	'ui.chart',
	'checklist-model',
	'jsonFormatter',
'mean.bank',
        'mean.transaction',
        'mean.bankCategory'
]);

angular.module('mean.system', []);
angular.module('mean.societes', []);
angular.module('mean.orders', []);
angular.module('mean.products', []);
angular.module('mean.ordersSupplier', []);
angular.module('mean.users', []);
angular.module('mean.bills', []);
angular.module('mean.accounting', []);
angular.module('mean.articles', []);
angular.module('mean.europexpress', []);
angular.module('mean.userGroup', []);
angular.module('mean.contacts', []);
angular.module('mean.reports', []);
angular.module('mean.delivery', []);
angular.module('mean.lead', []);
angular.module('mean.bank', []);
angular.module('mean.transaction', []);
angular.module('mean.bankCategory', []);

angular.module('jm.i18next').config(['$i18nextProvider', function($i18nextProvider) {
		$i18nextProvider.options = {
			//lng: 'fr',
			//useCookie: false,
			useLocalStorage: false,
			resGetPath: 'locales/__lng__/__ns__.json',
			//resPostPath: 'locales/__lng__/new.__ns__.json',
			defaultLoadingValue: '', // ng-i18next option, *NOT* directly supported by i18next
			ns: {namespaces: ["main", "bills", "orders", "companies"], defaultNs: 'main'},
			supportedLngs: ['fr-FR', 'en-US'],
			//load: 'current',
			useCookie: false,
			//cookie: 'speedealingLang',
			detectLngFromHeaders: false,
			saveMissing: true,
			debug: false,
			sendMissingTo: 'fallback',
			fallbackLng: "fr-FR"
		};
	}]);
window.app.run(function(editableOptions, editableThemes) {
	// bootstrap3 theme. Can be also 'bs2', 'default'
	editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';
});
window.app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q) {
        return {
            'response': function (response) {
                //Will only be called for HTTP up to 300
                //console.log(response);
                return response;
            },
            'responseError': function (rejection) {
                if(rejection.status === 401) {
                    location.replace("/login");
                }
                return $q.reject(rejection);
            }
        };
    });
}]);

window.app = angular.module('mean', ['ngRoute', 'ngCookies','ngSanitize', 'ngResource', 'kendo.directives', 'ngAnimate', 'ui.autocomplete', 'mean.system', 'mean.articles', 'mean.europexpress']);

angular.module('mean.system', []);
angular.module('mean.articles', []);
angular.module('mean.europexpress', []);
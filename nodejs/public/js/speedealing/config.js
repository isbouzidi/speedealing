//Setting up route
window.app.config(['$routeProvider',
	function($routeProvider) {
		//console.log($routeProvider.$get);
		$routeProvider.when('/articles', {
			templateUrl: 'views/articles/list.html'
		}).when('/articles/create', {
			templateUrl: 'views/articles/create.html'
		}).when('/articles/:articleId/edit', {
			templateUrl: 'views/articles/edit.html'
		}).when('/articles/:articleId', {
			templateUrl: 'views/articles/view.html'
		}).when('/view1', {
			templateUrl: 'partials/partial1'
		}).when('/:view', {
			templateUrl: function(params) {
				return 'partials/' + params.view;
			}
		}).when('/:module/:view', {
			templateUrl: function(params) {
				return 'partials/' + params.module + '/' + params.view;
			}
		}).when('/:module/:view/:id', {
			templateUrl: function(params) {
				return 'partials/' + params.module + '/' + params.view;
			}
		}).when('/', {
			templateUrl: 'partials/home'
		}).otherwise({
			redirectTo: '/'
		});
	}
]);

//Setting HTML5 Location Mode
window.app.config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix("!");
		//$locationProvider.html5Mode(true); // suppress #!
	}
]);
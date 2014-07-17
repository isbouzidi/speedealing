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
		}).when('/module/:module/:view/:id1/:id2', {
			templateUrl: function(params) {
				return 'partials/' + params.module + '/' + params.view;
			}
		}).when('/module/:module/:view/:id', {
			templateUrl: function(params) {
				return 'partials/' + params.module + '/' + params.view;
			}
		}).when('/module/:module/:view', {
			templateUrl: function(params) {
				return 'partials/' + params.module + '/' + params.view;
			}
		}).when('/:view/:id', {
			templateUrl: function(params) {
				return 'partials/' + params.view + '/' + params.id;
			}
		}).when('/:view', {
			templateUrl: function(params) {
				return 'partials/' + params.view;
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

// Add Body for DELETE request
window.app.config(['$httpProvider',
	function($httpProvider) {
		$httpProvider.defaults.headers.delete = {"Content-Type": "application/json;charset=utf-8"};
	}
]);

// For dialog box
window.app.config(['dialogsProvider','$translateProvider',function(dialogsProvider,$translateProvider){
		dialogsProvider.useBackdrop('static');
		dialogsProvider.useEscClose(false);
		dialogsProvider.useCopy(false);
		dialogsProvider.setSize('sm');

		$translateProvider.translations('fr-FR',{
			DIALOGS_ERROR: "Erreur",
			DIALOGS_ERROR_MSG: "Erreur inconnue.",
			DIALOGS_CLOSE: "Fermer",
			DIALOGS_PLEASE_WAIT: "Attendre",
			DIALOGS_PLEASE_WAIT_ELIPS: "Veuillez patienter...",
			DIALOGS_PLEASE_WAIT_MSG: "Veuiller attendre la fin de l'operation.",
			DIALOGS_PERCENT_COMPLETE: "% complete",
			DIALOGS_NOTIFICATION: "Notificacion",
			DIALOGS_NOTIFICATION_MSG: "Notificacion inconnue.",
			DIALOGS_CONFIRMATION: "Confirmation",
			DIALOGS_CONFIRMATION_MSG: "Confirmation requise.",
			DIALOGS_OK: "Ok",
			DIALOGS_YES: "Oui",
			DIALOGS_NO: "Non"
		});

		$translateProvider.preferredLanguage('en-US');
	}]);
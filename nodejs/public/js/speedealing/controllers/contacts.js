angular.module('mean.contacts').controller('ContactCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Contacts', 'object', function ($scope, $http, $modalInstance, $upload, $route, Global, Contacts, object) {

		$scope.global = Global;
		$scope.listCode = {};
		$scope.active = 1;
		$scope.jobs = [];

		$scope.soncas = [
			"Sécurité", "Sympathique", 'Nouveauté', 'Argent', 'Confort', 'Orgueil'
		];

		$scope.init = function () {
			$scope.contact = {
				societe: {
					id: object.societe._id,
					name: object.societe.name
				}
			};

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: "fk_job"
				}
			}).success(function (data, status) {
				$scope.jobs = data;
			});
		};

		$scope.isActive = function (idx) {
			if (idx === $scope.active)
				return "active";
		};

		$scope.createContact = function () {

			$scope.contact.user_creat = $scope.global.user._id;

			var contact = new Contacts(this.contact);

			contact.$save(function (response) {
				$modalInstance.close(response);

			});
		};

//		$scope.contactAutoComplete = function(val) {
//
//			return $http.post('api/zipcode/autocomplete', {
//				val: val
//			}).then(function(res) {
//				$scope.listCode = res.data;
//
//				return res.data;
//			});
//
//		};

//		$scope.generateZip = function(val) {
//
//			if (val) {
//				$scope.contact.town = val.city;
//				$scope.contact.zip = val.code;
//			}
//		};

	}]);

angular.module('mean.contacts').controller('ContactsController', ['$scope', '$rootScope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'object', 'Global', 'Contacts', function ($scope, $rootScope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, object, Global, Contacts) {

		$scope.retour = function () {
			$location.path('/contacts');
		};
		$scope.contact = {};

		$scope.etats = [
			{id: "ST_NEVER", name: "Non déterminé"},
			{id: "ST_ENABLE", name: "Actif"},
			{id: "ST_DISABLE", name: "Inactif"},
			{id: "ST_NO", name: "Ne pas contacter"},
			{id: "ALL", name: "Tous"}
		];

		$scope.soncas = [
			{value: "Sécurité", text: 'Sécurité'},
			{value: "Sympathique", text: 'Sympathique'},
			{value: 'Nouveauté', text: 'Nouveauté'},
			{value: 'Argent', text: 'Argent'},
			{value: 'Confort', text: 'Confort'},
			{value: 'Orgueil', text: 'Orgueil'},
		];

		$scope.etat = {id: "ST_ENABLE", name: "Actif"};

		$scope.find = function () {

			Contacts.query({Status: this.etat.id}, function (contact) {

				$scope.contacts = contact;
				$scope.count = contacts.length;
			});
		};

		$scope.filterOptionsContact = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsContact = {
			data: 'contacts',
			enableRowSelection: false,
			sortInfo: {fields: ["name"], directions: ["asc"]},
			filterOptions: $scope.filterOptionsContact,
			i18n: 'fr',
			enableColumnResize: true,
			columnDefs: [
				{field: 'name', displayName: 'Nom', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/contacts/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-user"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'poste', displayName: 'Fonction'},
				{field: 'email', displayName: 'Mail', cellTemplate: '<div class="ngCellText" ng-class="col.colIndex()"><a href="mailto:{{row.getProperty(col.field)}}" target="_blank">{{row.getProperty(col.field)}}</a></div>'},
				{field: 'societe.name', displayName: 'Société'},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"}
			]
		};

		$scope.init = function () {

			$http({method: 'GET', url: '/api/contact/fk_extrafields/status',
				params: {field: "Status"}

			}).success(function (data) {

				$scope.Status = data;
			});

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: "fk_job"
				}
			}).success(function (data, status) {
				$scope.jobs = data;
			});
		};

		$scope.findOne = function () {

			Contacts.get({
				Id: object.contact
			}, function (doc) {
				$scope.contact = doc;
			});

		};

		$scope.update = function () {

			var contact = $scope.contact;

			contact.$update(function () {
			}, function (errorResponse) {
			});
		};

		$scope.deleteContact = function () {

			var contact = $scope.contact;
			contact.$remove(function (response) {
				$location.path('/contacts');
			});
		};
	}]);
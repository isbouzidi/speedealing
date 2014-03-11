angular.module('mean.orders').controller('OrderListController', ['$scope', '$location', '$http', '$modal', 'pageTitle', 'Global', 'Orders', function($scope, $location, $http, $modal, pageTitle, Global, Orders) {

		pageTitle.setTitle('Liste des commandes');

		$scope.create = function() {
			var societe = new Societe({
				title: this.title,
				content: this.content
			});
			societe.$save(function(response) {
				$location.path("societe/" + response._id);
			});

			this.title = "";
			this.content = "";
		};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.update = function() {
			var societe = $scope.societe;

			societe.$update(function() {
				//$location.path('societe/' + societe._id);
			});
		};

		$scope.find = function() {
			Orders.query({}, function(orders) {
				$scope.orders = orders;
				$scope.count = orders.length;
			});
		};

		/*
		 * NG-GRID for societe list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsSociete = {
			data: 'orders',
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			sortInfo: {fields: ["name"], directions: ["asc"]},
			//showFilter:true,
			i18n: 'fr',
			columnDefs: [
				{field: 'name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'commercial_id.name', displayName: 'Commerciaux', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
				{field: 'zip', displayName: 'Code Postal'},
				{field: 'town', displayName: 'Ville'},
				{field: 'idprof3', displayName: 'APE'},
				{field: 'Tag', displayName: 'Catégories', cellTemplate: '<div class="ngCellText"><small ng-repeat="category in row.getProperty(col.field)" class="tag anthracite-gradient glossy small-margin-right">{{category}}</small></div>'},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'prospectLevel.name', displayName: 'Potentiel', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'prospectLevel.css\')}} glossy">{{row.getProperty(\'prospectLevel.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};
		
		$scope.order={};

		$scope.addNew = function() {

			var modalInstance = $modal.open({
				templateUrl: 'myModalContent.html',
				controller: ModalInstanceCtrl,
				resolve: {
					object: function() {
						return $scope.order;
					}
				}
			});

			modalInstance.result.then(function(order) {
				$scope.order = order;
				$scope.create();
				$scope.order = {};
			}, function() {
			});
		};

		var ModalInstanceCtrl = function($scope, $modalInstance, object) {

			$scope.societe = object;
			if (object.card)
				$scope.cardSelect = {
					id: object.card,
					vehicule: object.vehicule
				};

			$scope.datec = new Date(object.datec);


			$scope.cardAutoComplete = function(val) {
				return $http.post('api/europexpress/card/autocomplete', {
					take: '5',
					skip: '0',
					page: '1',
					pageSize: '5',
					filter: {logic: 'and', filters: [{value: val}]
					}
				}).then(function(res) {
					return res.data
				});
			};

			$scope.refreshVehicule = function() {
				$scope.paiement.vehicule = this.cardSelect.vehicule;
				$scope.paiement.card = this.cardSelect.id;
			};

			$scope.ok = function() {
				$modalInstance.close($scope.paiement);
			};

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};



	}]);

angular.module('mean.orders').controller('OrderViewController', ['$scope', '$location', '$http', '$routeParams', 'pageTitle', 'Global', 'Societes', function($scope, $location, $http, $routeParams, pageTitle, Global, Societe) {
		pageTitle.setTitle('Fiche commande');
		$scope.vehicule = {};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.update = function() {
			var societe = $scope.societe;

			societe.$update(function() {
				//$location.path('societe/' + societe._id);
			});
		};

		$scope.findOne = function() {
			Societe.get({
				Id: $routeParams.id
			}, function(societe) {
				$scope.societe = societe;
				pageTitle.setTitle('Fiche ' + $scope.societe.name);
			});
		};


	}]);
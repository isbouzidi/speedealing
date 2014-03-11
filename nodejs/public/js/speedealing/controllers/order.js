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
			sortInfo: {fields: ["createdAt"], directions: ["desc"]},
			//showFilter:true,
			i18n: 'fr',
			columnDefs: [
				{field: 'ref', displayName: 'Ref', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/orders/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-bag"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'client.name', displayName: 'Société'},
				{field: 'ref_client', displayName: 'Ref. client'},
				{field: 'contact.name', displayName: 'Contact'},
				{field: 'createdAt', displayName: 'Date création', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'total_ht', displayName: 'Montant HT', cellFilter: "currency", cellClass:"align-right"},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'}
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
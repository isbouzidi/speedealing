angular.module('mean.orders').controller('OrderController', ['$scope', '$location', '$http', '$routeParams', '$modal', 'pageTitle', 'Global', 'Orders', function($scope, $location, $http, $routeParams, $modal, pageTitle, Global, Orders) {

		pageTitle.setTitle('Liste des commandes');

		$scope.types = [{name: "En cours", id: "NOW"},
			{name: "Clos", id: "CLOSED"}];

		$scope.type = {name: "En cours", id: "NOW"};

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
			Orders.query({query: this.type.id}, function(orders) {
				$scope.orders = orders;
				$scope.count = orders.length;
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
				{field: 'ref', displayName: 'Ref', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="/commande/fiche.php?id={{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-bag"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'client.name', displayName: 'Société'},
				{field: 'ref_client', displayName: 'Ref. client'},
				{field: 'contact.name', displayName: 'Contact', /*cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="/contact/fiche.php?id={{row.getProperty(\'contact.id\')}}" title="Voir le contact"><span class="icon-user"></span> {{row.getProperty(col.field)}}</a>'*/},
				{field: 'createdAt', displayName: 'Date création',width: "100px", cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'total_ht', displayName: 'Montant HT', cellFilter: "currency", cellClass: "align-right"},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{displayName: "Actions", width: "80px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><a ng-href="#!/orders/{{row.getProperty(\'_id\')}}" class="button icon-download" title="Bon de commande PDF"></a><button class="button red-gradient icon-trash" disabled title="Supprimer"></button></div></div>'}
			]
		};

		$scope.order = {};

		$scope.addNew = function() {

			var modalInstance = $modal.open({
				templateUrl: '/partials/orders/create.html',
				controller: "CHMOtisController",
				windowClass: "steps",
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

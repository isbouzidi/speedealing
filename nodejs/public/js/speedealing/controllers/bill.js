angular.module('mean.bills').controller('BillController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Bills', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Bill) {

		pageTitle.setTitle('Liste des factures');

		$scope.bill = {};
		$scope.bills = [];
		$scope.gridOptionsBills = {};

		$scope.types = [{name: "Toutes", id: "ALL"}];

		$scope.type = {name: "Toutes", id: "ALL"};

		$scope.init = function() {
			var fields = ["Status", "fournisseur", "prospectlevel", "typent_id", "effectif_id", "forme_juridique_code"];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data, status) {
					$scope[field] = data;
					//console.log(data);
				});
			});
		};

		$scope.segmentationAutoComplete = function(val) {
			return $http.post('api/societe/segmentation/autocomplete', {
				take: 5,
				skip: 0,
				page: 1,
				pageSize: 5,
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				//console.log(res.data);
				return res.data
			});
		};

		$scope.showStatus = function(idx) {
			if (!($scope[idx] && $scope.societe[idx]))
				return;
			var selected = $filter('filter')($scope[idx].values, {id: $scope.societe[idx]});

			return ($scope.societe[idx] && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.remove = function(bill) {
			bill.$remove();

		};

		$scope.update = function() {
			var bill = $scope.bill;

			bill.$update(function(response) {
				pageTitle.setTitle('Facture ' + bill.ref);
			});
		};

		$scope.find = function() {
			Bill.query({query: this.type.id, entity: Global.user.entity}, function(bills) {
				$scope.bills = bills;
				$scope.countBills = bills.length;
			});
		};

		$scope.findOne = function() {
			Bill.get({
				Id: $routeParams.id
			}, function(bill) {
				$scope.bill = bill;

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": bill._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				pageTitle.setTitle('Facture ' + $scope.bill.ref);
			});
		};

		/*
		 * NG-GRID for societe list
		 */

		$scope.filterOptionsBill = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsBill = {
			data: 'bills',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsBill,
			sortInfo: {fields: ["ref"], directions: ["desc"]},
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'ref', displayName: 'Ref.', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/bills/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'dater', displayName: 'Date échéance', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'client.name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'client.id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'commercial_id.name', displayName: 'Commercial', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
				{field: 'total_ttc', displayName: 'Total TTC', cellFilter: "currency"},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};

		$scope.addNew = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/bills/create.html',
				controller: "BillCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function(bill) {
				$scope.societes.push(bill);
				$scope.countBills++;
			}, function() {
			});
		};

		$scope.addNote = function() {
			if (!this.note)
				return;

			var note = {};
			note.note = this.note;
			note.datec = new Date();
			note.author = {}
			note.author.id = Global.user._id;
			note.author.name = Global.user.firstname + " " + Global.user.lastname;

			if (!$scope.bill.notes)
				$scope.bill.notes = [];

			$scope.bill.notes.push(note);
			$scope.update();
			this.note = "";
		};

		/*
		 * NG-GRID for ticket list
		 */

		$scope.filterOptionsTicket = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsTicket = {
			data: 'tickets',
			enableRowSelection: false,
			sortInfo: {fields: ["updatedAt"], directions: ["desc"]},
			filterOptions: $scope.filterOptionsTicket,
			i18n: 'fr',
			enableColumnResize: true,
			columnDefs: [
				{field: 'name', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ticket/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-ticket"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', displayName: 'Id'},
				{field: 'percentage', displayName: 'Etat', cellTemplate: '<div class="ngCellText"><progressbar class="progress-striped thin" value="row.getProperty(col.field)" type="success"></progressbar></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"}
			]
		};

		$scope.updateInPlace = function(api, field, row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function() {
					$http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
						data: {
							value: row.entity[field]
						}
					}).
							success(function(data, status) {
						if (status == 200) {
							if (data.value) {
								if (data.field === "Status")
									for (var i = 0; i < $scope.status.length; i++) {
										if ($scope.status[i].id === data.value)
											row.entity.Status = $scope.status[i];
									}
							}
						}
					});

					$scope.save.pending = false;
				}, 500);
			}
		};


	}]);

angular.module('mean.bills').controller('BillCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Bills', function($scope, $http, $modalInstance, $upload, $route, Global, Bills) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.bill = {};

		$scope.isActive = function(idx) {
			if (idx == $scope.active)
				return "active";
		};

		$scope.next = function() {
			$scope.active++;
		};

		$scope.previous = function() {
			$scope.active--;
		};

		$scope.goto = function(idx) {
			if ($scope.active == 5)
				return;

			if (idx < $scope.active)
				$scope.active = idx;
		};

		$scope.init = function() {
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
				//console.log(data);
				$scope.societe.Status = data.default;
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "fournisseur"
				}
			}).success(function(data, status) {
				$scope.fournisseur = data;
				//console.log(data);
				$scope.societe.fournisseur = "NO";
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "prospectlevel"
				}
			}).success(function(data, status) {
				$scope.potential = data;
				//console.log(data);
				$scope.societe.prospectlevel = data.default;
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "typent_id"
				}
			}).success(function(data, status) {
				$scope.typent = data;
				//console.log(data);
				$scope.societe.typent_id = data.default;
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "effectif_id"
				}
			}).success(function(data, status) {
				$scope.effectif = data;
				//console.log(data);
				$scope.societe.effectif_id = data.default;
			});

			$scope.societe.commercial_id = {
				id: Global.user._id,
				name: Global.user.firstname + " " + Global.user.lastname
			}

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "forme_juridique_code"
				}
			}).success(function(data, status) {
				$scope.forme_juridique = data;
				//console.log(data);
				$scope.societe.forme_juridique_code = data.default;
			});

			$scope.societe.price_level = "BASE";
			$scope.societe.capital = 0;
		};

		$scope.create = function() {
			var bill = new Bills(this.bill);
			bill.$save(function(response) {
				//console.log(response);
				$modalInstance.close(response);
				//$location.path("societe/" + response._id);
			});
		};


		$scope.userAutoComplete = function(val) {
			return $http.post('api/user/name/autocomplete', {
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

	}]);
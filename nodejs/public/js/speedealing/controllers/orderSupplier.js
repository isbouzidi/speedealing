"use strict";
/* global angular: true */

angular.module('mean.ordersSupplier').controller('OrderSupplierController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'OrdersSupplier', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, OrdersSupplier) {

		pageTitle.setTitle('Liste des commandes fournisseurs');

		$scope.editable = false;

		$scope.order = {
			lines: [],
			notes: []
		};
		$scope.tickets = [];
		$scope.countTicket = 0;
		$scope.orders = [];
		$scope.gridOptions = {};

		$scope.types = [{name: "Toutes", id: "ALL"}];

		$scope.type = {name: "Toutes", id: "ALL"};

		$scope.init = function() {
			var dict = ["fk_order_supplier_status", "fk_paiement", "fk_bill_supplier_type", "fk_payment_term"];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict,
				}
			}).success(function (data, status) {
				$scope.dict = data;
			});
		};

		$scope.showStatus = function(idx) {
			if (!($scope[idx] && $scope.order[idx]))
				return;
			var selected = $filter('filter')($scope[idx].values, {id: $scope.order[idx]});

			return ($scope.order[idx] && selected && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.remove = function(order) {
			order.$remove();

		};

		$scope.update = function() {
			var order = $scope.order;

			order.$update(function(response) {
				pageTitle.setTitle('Commande ' + order.ref);

				if (response.Status == "NEW")
					$scope.editable = true;
				else
					$scope.editable = false;
			});
		};

		$scope.find = function() {
			OrdersSupplier.query({query: this.type.id, entity: Global.user.entity}, function(orders) {
				$scope.orders = orders;
				$scope.countOrders = orders.length;

				$scope.totalOrders = 0;
				angular.forEach(orders, function(order) {
					$scope.totalOrders += order.total_ttc;
				});

			});
		};

		$scope.findOne = function() {
			OrdersSupplier.get({
				Id: $routeParams.id
			}, function(order) {
				//console.log(order);
				$scope.order = order;

				if (order.Status == "NEW")
					$scope.editable = true;
				else
					$scope.editable = false;

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": order._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				pageTitle.setTitle('Commande ' + $scope.order.ref);
			}, function(err) {
				if (err.status == 401)
					$location.path("401.html");
			});
		};

		$scope.societeAutoComplete = function(val, field) {
			return $http.post('api/societe/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				return res.data;
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
				return res.data;
			});
		};

		/*
		 * NG-GRID for order list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'orders',
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			sortInfo: {fields: ["ref"], directions: ["desc"]},
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'ref', displayName: 'Ref.', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ordersSupplier/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'ref_supplier', displayName: 'Ref. fournisseur'},
				{field: 'supplier.name', displayName: 'Fournisseur', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'supplier.id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				//{field: 'commercial_id.name', displayName: 'Commercial', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "currency"},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};

		$scope.addNew = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/ordersSupplier/create.html',
				controller: "OrderSupplierCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function(order) {
				order = new OrdersSupplier(order);
				order.$save(function(response) {
					$location.path("ordersSupplier/" + response._id);
				});
			}, function() {
			});
		};

		$scope.addNewLine = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/lines',
				controller: "LineController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return {
							qty: 0
						};
					},
					options: function() {
						return {
							supplier: $scope.order.supplier,
							price_level: $scope.order.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(line) {
				$scope.order.lines.push(line);
				$scope.order.$update(function(response) {
					$scope.order = response;
				});
			}, function() {
			});
		};

		$scope.editLine = function(row) {
			var modalInstance = $modal.open({
				templateUrl: '/partials/lines',
				controller: "LineController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return row.entity;
					},
					options: function() {
						return {
							supplier: $scope.order.supplier,
							price_level: $scope.order.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(line) {
				$scope.order.$update(function(response) {
					$scope.order = response;
				});
			}, function() {
			});
		};

		$scope.removeLine = function(row) {
			//console.log(row.entity._id);
			for (var i = 0; i < $scope.order.lines.length; i++) {
				if (row.entity._id === $scope.order.lines[i]._id) {
					$scope.order.lines.splice(i, 1);
					$scope.update();
					break;
				}
			}
		};

		$scope.addNote = function() {
			if (!this.note)
				return;

			var note = {};
			note.note = this.note;
			note.datec = new Date();
			note.author = {};
			note.author.id = Global.user._id;
			note.author.name = Global.user.firstname + " " + Global.user.lastname;

			if (!$scope.order.notes)
				$scope.order.notes = [];

			$scope.order.notes.push(note);
			$scope.update();
			this.note = "";
		};

		/*
		 * NG-GRID for order lines
		 */

		$scope.filterOptionsLines = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsLines = {
			data: 'order.lines',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsLines,
			i18n: 'fr',
			enableColumnResize: true,
			rowHeight: 50,
			columnDefs: [
				{field: 'product.name', width: "60%", displayName: 'Désignation', cellTemplate: '<div class="ngCellText"><span class="blue strong icon-cart">{{row.getProperty(col.field)}}</span> - {{row.getProperty(\'product.label\')}}<pre class="no-padding">{{row.getProperty(\'description\')}}</pre></div>'},
				{field: 'group', displayName: "Groupe", visible: false},
				{field: 'qty', displayName: 'Qté', cellClass: "align-right"},
				{field: 'pu_ht', displayName: 'P.U. HT', cellClass: "align-right", cellFilter: "currency"},
				{field: 'tva_tx', displayName: 'TVA', cellClass: "align-right"},
				//{field: '', displayName: 'Réduc'},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "currency", cellClass: "align-right"},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button icon-pencil" title="Editer" ng-disabled="!editable" ng-click="editLine(row)"></button></button><button class="button orange-gradient icon-trash" title="Supprimer" ng-disabled="!editable" ng-confirm-click="Supprimer la ligne ?" confirmed-click="removeLine(row)"></button></div></div>'}
			]
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

		$scope.changeStatus = function(Status) {
			$scope.order.Status = Status;
			$scope.update();
		};


	}]);

angular.module('mean.ordersSupplier').controller('OrderSupplierCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', function($scope, $http, $modalInstance, $upload, $route, Global) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.order = {
		};

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
			var fields = ["StatusSupplier"];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/order/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data, status) {
					$scope[field] = data;
					//console.log(data);
					$scope.order[field] = data.default;
				});
			});

			$scope.order.commercial_id = {
				id: Global.user._id,
				name: Global.user.firstname + " " + Global.user.lastname
			};
		};

		$scope.create = function() {
			$modalInstance.close(this.order);
		};

		$scope.updateCoord = function(item, model, label) {
			//console.log(item);

			if ($scope.order.supplier.name === "Accueil")
				$scope.order.supplier.isNameModified = true;

			$scope.order.price_level = item.price_level;
			$scope.order.address = item.address.address;
			$scope.order.zip = item.address.zip;
			$scope.order.town = item.address.town;
			$scope.order.mode_reglement_code = item.mode_reglement_code;
			$scope.order.cond_reglement_code = item.cond_reglement_code;
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
				return res.data;
			});
		};

		$scope.supplierAutoComplete = function(val, field) {
			return $http.post('api/societe/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				fournisseur: {"$in": ["SUPPLIER", "SUBCONTRACTOR"]},
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				return res.data;
			});
		};

		$scope.clientAutoComplete = function(val, field) {
			return $http.post('api/societe/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				fournisseur: {"$nin": ["SUPPLIER", "SUBCONTRACTOR"]},
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				return res.data;
			});
		};

	}]);

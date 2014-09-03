angular.module('mean.bills').controller('BillController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Bills', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Bills) {

		pageTitle.setTitle('Liste des factures');

		$scope.editable = false;

		$scope.bill = {
			lines: [],
			notes: []
		};
		$scope.tickets = [];
		$scope.countTicket = 0;
		$scope.bills = [];
		$scope.gridOptionsBills = {};

		$scope.types = [{name: "Toutes", id: "ALL"}];

		$scope.type = {name: "Toutes", id: "ALL"};

		$scope.init = function() {
			var fields = ["Status", "cond_reglement_code", "type", "mode_reglement_code"];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/bill/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data, status) {
					$scope[field] = data;
					//console.log(data);
				});
			});
		};

		$scope.showStatus = function(idx) {
			if (!($scope[idx] && $scope.bill[idx]))
				return;
			var selected = $filter('filter')($scope[idx].values, {id: $scope.bill[idx]});

			return ($scope.bill[idx] && selected && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.remove = function(bill) {
			bill.$remove();

		};

		$scope.update = function() {
			var bill = $scope.bill;

			bill.$update(function(response) {
				pageTitle.setTitle('Facture ' + bill.ref);

				if (response.Status == "DRAFT")
					$scope.editable = true;
				else
					$scope.editable = false;
			});
		};

		$scope.find = function() {
			Bills.query({query: this.type.id, entity: Global.user.entity}, function(bills) {
				$scope.bills = bills;
				$scope.countBills = bills.length;
			});
		};

		$scope.clone = function() {
			$scope.bill.$clone(function(response) {
				$location.path("bills/" + response._id);
			});
		};

		$scope.findOne = function() {
			Bills.get({
				Id: $routeParams.id
			}, function(bill) {
				$scope.bill = bill;

				if (bill.Status == "DRAFT")
					$scope.editable = true;
				else
					$scope.editable = false;

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
				
				$scope.totalOrders = 0;

				angular.forEach(bill.orders, function(order) {
					$scope.totalOrders += order.total_ht;
				});
				
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
				return res.data
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

		$scope.updateAddress = function(data) {
			$scope.bill.address = data.address.address;
			$scope.bill.zip = data.address.zip;
			$scope.bill.town = data.address.town;

			$scope.bill.price_level = data.price_level;

			return true;
		};


		/*
		 * NG-GRID for bill list
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
				{field: 'title.ref', displayName: 'Titre'},
				{field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'dater', displayName: 'Date échéance', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'client.name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'client.id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'commercial_id.name', displayName: 'Commercial', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
				{field: 'total_ttc', displayName: 'Total TTC', cellFilter: "currency"},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};

		$scope.addNewBill = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/bills/create.html',
				controller: "BillCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function(bill) {
				bill = new Bills(bill);
				bill.$save(function(response) {
					$location.path("bills/" + response._id);
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
							price_level: $scope.bill.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(line) {
				$scope.bill.lines.push(line);
				$scope.bill.$update(function(response) {
					$scope.bill = response;
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
							price_level: $scope.bill.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(line) {
				$scope.bill.$update(function(response) {
					$scope.bill = response;
				});
			}, function() {
			});
		};

		$scope.removeLine = function(row) {
			//console.log(row.entity._id);
			for (var i = 0; i < $scope.bill.lines.length; i++) {
				if (row.entity._id === $scope.bill.lines[i]._id) {
					$scope.bill.lines.splice(i, 1);
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
		 * NG-GRID for bill lines
		 */

		$scope.filterOptionsLines = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsLines = {
			data: 'bill.lines',
			enableRowSelection: false,
			sortInfo: {fields: ["group"], directions: ["asc"]},
			filterOptions: $scope.filterOptionsLines,
			i18n: 'fr',
			enableColumnResize: true,
			groups: ['group'],
			groupsCollapsedByDefault: false,
			rowHeight: 50,
			columnDefs: [
				{field: 'product.name', width: "60%", displayName: 'Désignation', cellTemplate: '<div class="ngCellText"><span class="blue strong icon-cart">{{row.getProperty(col.field)}}</span> - {{row.getProperty(\'product.label\')}}<pre class="no-padding">{{row.getProperty(\'description\')}}</pre></div>'},
				{field: 'group', displayName: "Groupe", visible: false},
				{field: 'qty', displayName: 'Qté', cellClass: "align-right"},
				{field: 'pu_ht', displayName: 'P.U. HT', cellClass: "align-right", cellFilter: "currency"},
				{field: 'tva_tx', displayName: 'TVA', cellClass: "align-right", cellFilter: "percent"},
				//{field: '', displayName: 'Réduc'},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "currency", cellClass: "align-right"},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button icon-pencil" title="Editer" ng-disabled="!editable" ng-click="editLine(row)"></button></button><button class="button orange-gradient icon-trash" title="Supprimer" ng-disabled="!editable" ng-confirm-click="Supprimer la ligne ?" confirmed-click="removeLine(row)"></button></div></div>'}
			],
			aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
					"    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.label CUSTOM_FILTERS}}</span><br/><span class=\"anthracite strong\">Total HT: {{aggFunc(row,'total_ht') | currency}}</span></span>" +
					"    <div class=\"{{row.aggClass()}}\"></div>" +
					"</div>" +
					""
		};

		$scope.aggFunc = function(row, idx) {
			var total = 0;
			//console.log(row);
			angular.forEach(row.children, function(cropEntry) {
				if (cropEntry.entity[idx])
					total += cropEntry.entity[idx];
			});
			return total;
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
			$scope.bill.Status = Status;
			$scope.update();
		};


	}]);

angular.module('mean.bills').controller('BillCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', function($scope, $http, $modalInstance, $upload, $route, Global) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.bill = {
			Status: "DRAFT"
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
			var fields = ["Status", "mode_reglement_code", "cond_reglement_code"];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/bill/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data, status) {
					$scope[field] = data;
					//console.log(data);
					$scope.bill[field] = data.default;
				});
			});

			$scope.bill.commercial_id = {
				id: Global.user._id,
				name: Global.user.firstname + " " + Global.user.lastname
			}
		};

		$scope.create = function() {
			$modalInstance.close(this.bill);
		};

		$scope.updateCoord = function(item, model, label) {
			//console.log(item);

			if ($scope.bill.client.name === "Accueil")
				$scope.bill.client.isNameModified = true;

			$scope.bill.price_level = item.price_level;
			$scope.bill.address = item.address.address;
			$scope.bill.zip = item.address.zip;
			$scope.bill.town = item.address.town;
			$scope.bill.mode_reglement_code = item.mode_reglement_code;
			$scope.bill.cond_reglement_code = item.cond_reglement_code;
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

		$scope.societeAutoComplete = function(val, field) {
			return $http.post('api/societe/autocomplete', {
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

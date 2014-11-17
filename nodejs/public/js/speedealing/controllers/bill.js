"use strict";
/* global angular: true */

angular.module('mean.bills').controller('BillController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Bills', function ($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Bills) {
		pageTitle.setTitle('Liste des factures');

		$scope.editable = false;

		$scope.bill = {
			lines: [],
			notes: []
		};
		$scope.tickets = [];
		$scope.dict = {};
		$scope.countTicket = 0;
		$scope.bills = [];
		$scope.gridOptionsBills = {};

		$scope.types = [{name: "Toutes", id: "ALL"}];

		$scope.type = {name: "Toutes", id: "ALL"};

		$scope.init = function () {
			var dict = ["fk_bill_status", "fk_payment_term", "fk_bill_type", "fk_paiement", "fk_tva"];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict,
				}
			}).success(function (data, status) {
				$scope.dict = data;
			});
		};

		$scope.showStatus = function (val, dict) {
			if (!($scope.dict[dict] && $scope.bill[val]))
				return;
			var selected = $filter('filter')($scope.dict[dict].values, {id: $scope.bill[val]});

			return ($scope.bill[val] && selected && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.remove = function (bill) {
			bill.$remove(function () {
				$location.path("/bills");
			});
		};

		$scope.update = function () {
			var bill = $scope.bill;

			for (var i = bill.lines.length; i--; ) {
				// actually delete lines
				if (bill.lines[i].isDeleted) {
					bill.lines.splice(i, 1);
				}
			}

			bill.$update(function (response) {
				pageTitle.setTitle('Facture ' + bill.ref);

				if (response.Status == "DRAFT")
					$scope.editable = true;
				else
					$scope.editable = false;
			});
		};

		$scope.find = function () {
			Bills.query({query: this.type.id, entity: Global.user.entity}, function (bills) {
				$scope.bills = bills;
				$scope.countBills = bills.length;
			});
		};

		$scope.clone = function () {
			$scope.bill.$clone(function (response) {
				$location.path("bills/" + response._id);
			});
		};

		$scope.findOne = function () {
			Bills.get({
				Id: $routeParams.id
			}, function (bill) {
				$scope.bill = bill;

				if (bill.Status == "DRAFT")
					$scope.editable = true;
				else
					$scope.editable = false;

				//on utilise idLine pour deffinier la ligne produit que nous voulons supprimer
				for (var i in $scope.bill.lines) {
					$scope.bill.lines[i].idLine = i;
				}

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": bill._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function (data, status) {
					if (status == 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				pageTitle.setTitle('Facture ' + $scope.bill.ref);

				$scope.totalOrders = 0;

				angular.forEach(bill.orders, function (order) {
					$scope.totalOrders += order.total_ht;
				});

				$scope.totalDeliveries = 0;

				angular.forEach(bill.deliveries, function (delivery) {
					$scope.totalDeliveries += delivery.total_ht;
				});

				$http({method: 'GET', url: '/api/transaction', params: {
						find: {"bill.id": bill._id}
					}
				}).success(function (data, status) {
					if (status === 200) {
						$scope.payments = data;

						$scope.paid = 0;

						for (var i = 0; i < data.length; i++) {
							$scope.paid += data[i].credit;
						}
						;

						$scope.billed = $scope.bill.total_ttc;
						$scope.remainderToPay = $scope.billed - $scope.paid;
					}
				});

			}, function (err) {
				if (err.status == 401)
					$location.path("401.html");
			});
		};

		$scope.productAutoComplete = function (val) {

			return $http.post('api/product/autocomplete', {
				take: 5,
				skip: 0,
				page: 1,
				pageSize: 5,
				price_level: $scope.bill.price_level,
//                supplier: options.supplier,
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				return res.data;
			});
		};

		$scope.checkLine = function (data) {

			if (!data)
				return "La ligne produit ne peut pas être vide";
		};

		$scope.addProduct = function (data, index) {

			//console.log(data);

			for (var i in $scope.bill.lines) {
				if ($scope.bill.lines[i].idLine === index) {
					$scope.bill.lines[i] = {
						pu_ht: data.pu_ht,
						tva_tx: data.product.id.tva_tx,
						discount: data.discount,
						product: {
							id: data.product.id._id,
							name: data.product.id.ref,
							label: data.product.id.label
						},
						description: data.product.id.description,
						isNew: true,
						qty: $scope.bill.lines[i].qty,
						no_package: $scope.bill.lines[i].no_package, // nombre de pieces
						idLine: index
					};

					$scope.calculMontantHT($scope.bill.lines[i]);
				}
			}
		};


		$scope.calculMontantHT = function (line, data, varname) {
			if (varname)
				line[varname] = data;

			line.total_ht = line.qty * (line.pu_ht * (1 - (line.discount / 100)));
			line.total_tva = line.total_ht * line.tva_tx / 100;
			//console.log(data);
		};
		// filter lines to show
		$scope.filterLine = function (line) {
			return line.isDeleted !== true;
		};

		// mark line as deleted
		$scope.deleteLine = function (id) {
			var filtered = $filter('filter')($scope.bill.lines, {idLine: id});
			if (filtered.length) {
				filtered[0].isDeleted = true;
			}
		};

		// up or down a line
		$scope.upDownLine = function (id, mode) {
			//id = parseInt(id);

			var elem = $scope.bill.lines[id];

			if (mode == 'UP') {
				$scope.bill.lines[id] = $scope.bill.lines[id - 1];
				$scope.bill.lines[id - 1] = elem;
			} else {
				$scope.bill.lines[id] = $scope.bill.lines[id + 1];
				$scope.bill.lines[id + 1] = elem;
			}

			$scope.update();
		};

		// add line
		$scope.addLine = function () {
			$scope.bill.lines.push({
				isNew: true,
				idLine: $scope.bill.lines.length + 1
			});

		};

		// cancel all changes
		$scope.cancel = function () {
			for (var i = $scope.bill.lines.length; i--; ) {
				var line = $scope.bill.lines[i];
				// undelete
				if (line.isDeleted) {
					delete line.isDeleted;
				}
				// remove new 
				if (line.isNew) {
					$scope.bill.lines.splice(i, 1);
				}
			}

			$scope.findOne();
		};

		$scope.listBills = function () {
			$location.path('/bill');
		};


		$scope.societeAutoComplete = function (val, field) {
			return $http.post('api/societe/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				return res.data
			});
		};

		$scope.userAutoComplete = function (val) {
			return $http.post('api/user/name/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				return res.data;
			});
		};

		$scope.updateAddress = function (data) {
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

		$scope.addNewBill = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/bills/create.html',
				controller: "BillCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function (bill) {
				bill = new Bills(bill);
				bill.$save(function (response) {
					$location.path("bills/" + response._id);
				});
			}, function () {
			});
		};

		$scope.addNewLine = function () {

			var modalInstance = $modal.open({
				templateUrl: '/partials/lines',
				controller: "LineController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							qty: 0
						};
					},
					options: function () {
						return {
							price_level: $scope.bill.price_level
						};
					}
				}
			});

			modalInstance.result.then(function (line) {
				$scope.bill.lines.push(line);
				$scope.bill.$update(function (response) {
					$scope.bill = response;
				});
			}, function () {
			});
		};

		$scope.editLine = function (row) {
			var modalInstance = $modal.open({
				templateUrl: '/partials/lines',
				controller: "LineController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return row.entity;
					},
					options: function () {
						return {
							price_level: $scope.bill.price_level
						};
					}
				}
			});

			modalInstance.result.then(function (line) {
				$scope.bill.$update(function (response) {
					$scope.bill = response;
				});
			}, function () {
			});
		};

		$scope.addNote = function () {
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

		$scope.aggFunc = function (row, idx) {
			var total = 0;
			//console.log(row);
			angular.forEach(row.children, function (cropEntry) {
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

		$scope.updateInPlace = function (api, field, row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function () {
					$http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
						data: {
							value: row.entity[field]
						}
					}).
							success(function (data, status) {
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

		$scope.changeStatus = function (Status) {
			$scope.bill.Status = Status;
			$scope.update();
		};

		$scope.payment = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/bank/regulationPayment.html',
				controller: "TransactionController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							bill: $scope.bill
						};
					}
				}
			});
			modalInstance.result.then(function (transaction) {
				$scope.payments.push(transaction);
				$scope.count++;
				$scope.findOne();
			}, function () {
			});
		};

		$scope.filterOptionsPayment = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsPayment = {
			data: 'payments',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsPayment,
			enableColumnResize: true,
			showFooter: true,
			footerRowHeight: 65,
			footerTemplate: '<div style="padding: 10px;">\n\
                    <span class="right"><strong>Déjà réglé : \{{paid | currency:bank.currency}}<strong></span><br>\n\
                    <span class="right"><strong>Facturé : \{{billed | currency:bank.currency}}<strong></span><br>\n\
                    <span class="right"><strong>Reste à payer : \{{remainderToPay | currency:bank.currency}}<strong></span>\n\
                    </div>',
			i18n: 'fr',
			columnDefs: [
				{field: 'date_transaction', displayName: 'Paiement', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'trans_type.name', displayName: 'Type'},
				{field: 'bank.libelle', displayName: 'Compte bancaire'},
				{field: 'credit', displayName: 'Montant', cellFilter: 'currency:""'}

			]
		};
	}]);

angular.module('mean.bills').controller('BillCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', function ($scope, $http, $modalInstance, $upload, $route, Global) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.bill = {
			Status: "DRAFT",
			datec: new Date()
		};

		$scope.isActive = function (idx) {
			if (idx == $scope.active)
				return "active";
		};

		$scope.next = function () {
			$scope.active++;
		};

		$scope.previous = function () {
			$scope.active--;
		};

		$scope.goto = function (idx) {
			if ($scope.active == 5)
				return;

			if (idx < $scope.active)
				$scope.active = idx;
		};

		$scope.init = function () {
			var dict = ["fk_bill_status", "fk_payment_term", "fk_bill_type", "fk_paiement"];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict,
				}
			}).success(function (data, status) {
				$scope.dict = data;
			});
		};

		$scope.open = function ($event) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened = true;
		};


		$scope.create = function () {
			$modalInstance.close(this.bill);
		};

		$scope.updateCoord = function (item, model, label) {
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

		$scope.userAutoComplete = function (val) {
			return $http.post('api/user/name/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				return res.data;
			});
		};

		$scope.societeAutoComplete = function (val, field) {
			return $http.post('api/societe/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				return res.data
			});
		};

	}]);

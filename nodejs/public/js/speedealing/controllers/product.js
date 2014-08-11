angular.module('mean.system').controller('ProductController', ['$scope', '$routeParams', '$location', '$route', 'Global', function($scope, $routeParams, $location, $route, Global) {
		$scope.global = Global;

		var crudServiceBaseUrl = "api/product";

		$scope.dataSource = new kendo.data.DataSource({
			transport: {
				read: {
					url: crudServiceBaseUrl,
					type: "GET",
					dataType: "json"
				},
				update: {
					url: crudServiceBaseUrl,
					type: "PUT",
					dataType: "json"
				},
				destroy: {
					url: crudServiceBaseUrl,
					type: "DELETE",
					dataType: "json"
				},
				create: {
					url: crudServiceBaseUrl,
					type: "POST",
					dataType: "json"
				},
				parameterMap: function(options, operation) {
					if (operation !== "read" && options.models) {
						return {models: kendo.stringify(options.models)};
					}
				}
			},
			batch: true,
			autoSync: true,
			pageSize: 50,
			schema: {
				model: {
					id: "_id",
					fields: {
						_id: {editable: false, nullable: true},
						ref: {editable: true, validation: {required: true}},
						qtyMin: {type: "string", validation: {required: true, min: 0}, defaultValue: 0},
						pu_ht: {type: "string", validation: {required: true, min: 0}, defaultValue: 0},
						tms: {type: "date", editable: false, defaultValue: Date().now},
						entity: {type: "string", defaultValue: ""},
						label: {type: "string", defaultValue: ""},
						//Status_ID: {from: "Status.id", defaultValue: "SELL"},
						price_level: {type: "string", defaultValue: "BASE"},
						ref_customer_code: {type: "string"},
						caFamily: {type: "string"},
						barCode: {type: "string"},
						billingMode: {type: "string", defaultvalue: "QTY"},
						compta_buy: {type: "string", defaultValue: ""},
						compta_sell: {type: "string", defaultValue: ""},
						author: {editable: false, defaultValue: {id: "{{user.id}}", name: "{{user.name}}"}},
						Status: {defaultValue: {id: "SELL", name: "En vente", css: "green-gradient"}},
						tva_tx: {type: "string", defaultValue: 20},
						type: {defaultValue: {id: "PRODUCT", name: "Produit", css: "blue-gradient"}}
					}
				}
			},
			error: function(e) {
				// log error
				if (e.xhr.status === 500)
					alert(e.xhr.responseText);
			},
			/*group: [{
			 field: "ref",
			 dir: "asc"
			 }, {
			 field: "price_level",
			 dir: "asc"
			 }]*/
			sort: {field: "tms", dir: "desc"}
		});

		$scope.statusDropDownEditor = function(container, options) {
			$('<input data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoDropDownList({
						autoBind: false,
						dataSource: {
							transport: {
								read: {
									url: "api/product/status/select",
									type: "GET",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.typeDropDownEditor = function(container, options) {
			$('<input data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoDropDownList({
						autoBind: false,
						dataSource: {
							data: [{id: "PRODUCT", name: "Produit", css: "blue-gradient"},
								{id: "SERVICE", name: "Service", css: "green-gradient"}]
						}
					});
		};

		$scope.entityDropDownEditor = function(container, options) {
			$('<input data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoDropDownList({
						autoBind: false,
						dataSource: {
							transport: {
								read: {
									url: "api/user/entity/select",
									type: "GET",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.priceLevelDropDownEditor = function(container, options) {
			$('<input data-text-field="name" data-value-field="name" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoAutoComplete({
						minLength: 1,
						dataTextfield: "name",
						filter: "contains",
						autoBind: false,
						suggest: true,
						dataSource: {
							serverFiltering: true,
							serverPaging: true,
							pageSize: 5,
							transport: {
								read: {
									url: "api/product/price_level/autocomplete",
									type: "POST",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.familyDropDownEditor = function(container, options) {
			$('<input data-text-field="name" data-value-field="name" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoAutoComplete({
						minLength: 1,
						dataTextfield: "name",
						filter: "contains",
						autoBind: false,
						suggest: true,
						dataSource: {
							serverFiltering: true,
							serverPaging: true,
							pageSize: 5,
							transport: {
								read: {
									url: "api/product/family/autocomplete",
									type: "POST",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.refDropDownEditor = function(container, options) {
			$('<input data-text-field="name" required data-value-field="name" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoAutoComplete({
						minLength: 1,
						dataTextfield: "name",
						filter: "contains",
						autoBind: false,
						suggest: true,
						dataSource: {
							serverFiltering: true,
							serverPaging: true,
							pageSize: 5,
							transport: {
								read: {
									url: "api/product/ref/autocomplete",
									type: "POST",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.textareaEditor = function(container, options) {
			$('<textarea rows="3" cols="25" style="vertical-align:top;" data-bind="value: ' + options.field + '"></textarea>').appendTo(container);
		};

		$scope.statusFilter = function(element) {
			element.kendoDropDownList({
				dataTextField: "name",
				dataValueField: "id",
				dataSource: {
					transport: {
						read: {
							url: "api/product/status/select",
							type: "GET",
							dataType: "json"
						}
					}
				},
				optionLabel: "--Status--"
			});
		};

		/*		$scope.clientDropDownEditor = function(container, options) {
		 $('<input id="id"/>')
		 .attr("name", options.field)
		 .appendTo(container)
		 .kendoAutoComplete({
		 minLength: 1,
		 dataTextField: "name",
		 filter: "contains",
		 dataSource: {
		 serverFiltering: true,
		 serverPaging: true,
		 pageSize: 5,
		 transport: {
		 read: {
		 url: "api/societe/autocomplete",
		 type: "POST",
		 dataType: "json"
		 }
		 }
		 }
		 });
		 }
		 
		 $scope.modeDropDownEditor = function(container, options) {
		 $('<input data-ng-model="name" data-bind="value:' + options.field + '"/>')
		 .appendTo(container)
		 .kendoDropDownList({
		 autoBind: true,
		 dataTextField: "name",
		 dataValueField: "id",
		 dataSource: [
		 {id: "NONE", name: ""},
		 {id: "AM", name: "AM"},
		 {id: "PM", name: "PM"},
		 {id: "DAY", name: "En journée"}
		 ]
		 });
		 }
		 
		 $scope.panierMultiSelect = function(container, options) {
		 $('<input data-bind="value:' + options.field + ', source: ' + options.field + '" />')
		 .appendTo(container)
		 .kendoMultiSelect({
		 minLength: 1,
		 placeholder: "Sélectionner les paniers...",
		 autoBind: true,
		 //dataTextField: "name",
		 //dataValueField: "id",
		 dataSource: {
		 serverFiltering: true,
		 serverPaging: true,
		 pageSize: 5,
		 transport: {
		 read: {
		 url: "api/europexpress/tournee/select/panier",
		 type: "POST",
		 dataType: "json"
		 }
		 }
		 }
		 });
		 }*/
	}]);

angular.module('mean.system').controller('ProductBarCodeController', ['$scope', '$routeParams', 'Global', '$http', function($scope, $routeParams, Global, $http) {
		$scope.global = Global;

		$scope.isChecked = {};
		$scope.productsBarCode = {};
		$scope.storehouse = {};
		$scope.selected = {};

		function initProducts() {
			$http({method: 'GET', url: 'api/product', params: {
					withNoPrice: 1,
					barCode: 1
				}
			}).
					success(function(data, status) {
						$scope.products = data;
						for (var i in data) {
							$scope.productsBarCode[data[i]._id] = data[i];
						}
					});
		}

		function numberFormat(number, width) {
			if (isNaN(number))
				number = 0;
			return new Array(width + 1 - (number + '').length).join('0') + number;
		}

		function initEntrepot() {
			$scope.stocks = [];

			$http({method: 'GET', url: 'api/product/storehouse'
			}).
					success(function(entrepot, status) {
						//$scope.products = data;

						for (var i = 0; i < entrepot.length; i++) {
							for (var j = 0; j < entrepot[i].subStock.length; j++) {
								var stock = {};
								stock.client = entrepot[i].societe.name;
								//stock.barCode = entrepot[i].societe.barCode;
								stock.stock = entrepot[i].name;
								//stock.stockCode = entrepot[i].barCode;
								stock.barCode = numberFormat(entrepot[i].barCode, 4);

								var codeBar = stock.barCode;

								stock.subStock = entrepot[i].subStock[j].name;
								stock.subStockCode = entrepot[i].subStock[j].barCode;
								stock.barCode = codeBar + numberFormat(entrepot[i].subStock[j].barCode, 2);
								stock.productId = entrepot[i].subStock[j].productId;
								$scope.stocks.push(stock);

								$scope.isChecked[stock.barCode] = {};

								for (var k = 0; k < entrepot[i].subStock[j].productId.length; k++) {
									$scope.isChecked[stock.barCode][entrepot[i].subStock[j].productId[k]] = true;
								}
							}

						}
					});
		}

		$scope.updateCheck = function(product, stock) {
			$http({method: 'PUT', url: 'api/product/storehouse', data: {
					product: product,
					stock: stock,
					checked: $scope.isChecked[stock.barCode][product._id]
				}
			}).
					success(function(data, status) {
						console.log("ok");
					});
		};

		$scope.initList = function() {
			initProducts();
			initEntrepot();
		};

		$scope.societeAutoComplete = function(val) {
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

		$scope.insert = function() {
			$http({method: 'POST', url: 'api/product/storehouse', data: $scope.storehouse
			}).
					success(function(data, status) {
						//$scope.products = data;
						$scope.initList();
					});
		};


	}]);

angular.module('mean.system').controller('LineController', ['$scope', '$http', '$modalInstance', 'Global', 'object', 'options', function($scope, $http, $modalInstance, Global, object, options) {
		$scope.global = Global;

		$scope.line = object;
		$scope.supplier = options && options.supplier;

		$scope.init = function() {
			var fields = ["tva_tx"];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/product/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data, status) {
					$scope[field] = data;
					//console.log(data);
				});
			});
		};

		$scope.addOrUpdate = function() {
			$scope.line.total_ht = $scope.line.pu_ht * $scope.line.qty;
			$scope.line.total_tva = $scope.line.total_ht * $scope.line.tva_tx / 100;
			$scope.line.total_ttc = $scope.line.total_ht + $scope.line.total_tva;

			$modalInstance.close($scope.line);
		};

		$scope.updateLine = function(data) {
			if (!data.template)
				$scope.line.product.template = "/partials/lines/classic.html";

			if (!$scope.line.description)
				$scope.line.description = data.description;

			$scope.line.minPrice = data.minPrice;

			if (!$scope.line.pu_ht)
				$scope.line.pu_ht = data.price.pu_ht;

			$scope.line.tva_tx = data.price.tva_tx;

			//console.log(data);
		};

		$scope.productAutoComplete = function(val) {
			return $http.post('api/product/autocomplete', {
				take: 5,
				skip: 0,
				page: 1,
				pageSize: 5,
				price_level: options.price_level,
				supplier: options.supplier,
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				//console.log(res.data);
				return res.data;
			});
		};

	}]);

angular.module('mean.system').controller('ProductPriceLevelController', ['$scope', '$location', '$route', '$http', '$timeout', '$modal', 'Global', function($scope, $location, $route, $http, $timeout, $modal, Global) {

		$scope.priceLevel = [];
		$scope.price_level = null;
		$scope.prices_level = [];

		$scope.init = function() {

			$http({method: 'GET', url: '/api/product/price_level/select'
			}).success(function(data, status) {
				$scope.prices_level = data;
				//console.log(data);
			});
		};

		$scope.find = function() {
			$http({method: 'GET', url: '/api/product/price_level', params: {
					price_level: $scope.price_level
				}
			}).success(function(data, status) {
				$scope.priceLevel = data;
			});
		};

		/*
		 * NG-GRID for product priceLevel list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'priceLevel',
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			sortInfo: {fields: ["product.name"], directions: ["asc"]},
			//showFilter:true,
			enableColumnResize: true,
			enableCellSelection: true,
			enableCellEditOnFocus: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'product.name', displayName: 'Ref produit', width: "15%", enableCellEdit: false},
				{field: 'product.id.label', displayName: 'Description', enableCellEdit: false},
				{field: 'price_level', displayName: 'Liste de prix', width: "80px", enableCellEdit: false},
				{field: 'qtyMin', displayName: 'Minimum de commande', cellClass: "align-right", width: "150px", enableCellEdit: false},
				{field: 'pu_ht', displayName: 'Tarif HT', width: "80px", cellClass: "blue align-right", editableCellTemplate: '<input type="number" step="1" ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-blur="update(row)"/>'},
				{field: 'tms', displayName: 'Date MAJ', width: "100px", cellFilter: "date:'dd/MM/yyyy'", enableCellEdit: false},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button red-gradient icon-trash" title="Supprimer" ng-confirm-click="Supprimer le tarif du produit ?" confirmed-click="remove(row)"></button></div></div>'}
			]
		};

		$scope.update = function(row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			var d = new Date();

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function() {
					$http({method: 'PUT', url: 'api/product/price_level', data: row.entity
					}).success(function(data, status) {
						$scope.save.pending = false;
					});
				}, 200);
			}
		};

		$scope.remove = function(row) {
			for (var i = 0; i < $scope.priceLevel.length; i++) {
				if (row.entity._id === $scope.priceLevel[i]._id) {
					$http({method: 'DELETE', url: 'api/product/price_level', data: row.entity
					}).success(function(data, status) {
						$scope.priceLevel.splice(i, 1);
					});
					break;
				}
			}
		};

		$scope.addNewPrice = function() {
			var modalInstance = $modal.open({
				templateUrl: 'addPrice.html',
				controller: "ProductPriceLevelController",
				//windowClass: "steps",
				resolve: {
					object: function() {
						return {
							qty: 0
						};
					},
					options: function() {
						return {
							price_level: $scope.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(price) {
				$scope.priceLevel.push(price);
				//$scope.bill.$update(function(response) {
				//	$scope.bill = response;
				//});
			}, function() {
			});
		};
		
		

	}]);
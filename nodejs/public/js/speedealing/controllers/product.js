"use strict";
/* global angular: true */

angular.module('mean.products').controller('ProductController', ['$scope', '$routeParams', '$location', '$timeout', '$http', '$route', '$modal', 'Global', 'pageTitle', 'Products', function ($scope, $routeParams, $location, $timeout, $http, $route, $modal, Global, pageTitle, Product) {
		$scope.global = Global;
		pageTitle.setTitle('Liste des produits');

		$scope.product = {};
		$scope.products = [];
		$scope.caFamilies = [];
		$scope.dict = {};

		$scope.types = [{name: "A la vente", id: "SELL"},
			{name: "A l'achat", id: "BUY"},
			{name: "Tous", id: "ALL"}];

		$scope.type = {name: "A la vente", id: "SELL"};

		$scope.init = function () {
			/*var fields = ["tva_tx", "Status", "units"];
			 
			 angular.forEach(fields, function(field) {
			 $http({method: 'GET', url: '/api/product/fk_extrafields/select', params: {
			 field: field
			 }
			 }).success(function(data, status) {
			 $scope[field] = data;
			 //console.log(data);
			 });
			 });*/
		};

		$scope.update = function () {
			var product = $scope.product;

			product.$update(function (response) {
				pageTitle.setTitle('Fiche produit ' + product.ref);
			});
		};

		$scope.find = function () {
			var sb = {};
			for (var i = 0; i < $scope.sortOptionsProduct.fields.length; i++) {
				sb[$scope.sortOptionsProduct.fields[i]] = $scope.sortOptionsProduct.directions[i] === "desc" ? -1 : 1;
			}

			var p = {
				fields: "_id Status label ref pu_ht updatedAt caFamily",
				query: this.type.id,
				filter: $scope.filterOptionsProduct.filterText,
				skip: $scope.pagingOptionsProduct.currentPage - 1,
				limit: $scope.pagingOptionsProduct.pageSize,
				sort: sb
			};

			Product.query(p, function (products) {
				$scope.products = products;
				$scope.countProducts = products.length;
			});

			$http({method: 'GET', url: '/api/product/count', params: p
			}).success(function (data, status) {
				$scope.totalCountProduct = data.count;
				$scope.maxPageProduct = Math.ceil(data.count / 1000);
			});
		};

		$scope.findOne = function () {
			Product.get({
				Id: $routeParams.id
			}, function (product) {
				$scope.product = product;

				pageTitle.setTitle('Fiche produit' + $scope.product.ref);

			}, function (err) {
				if (err.status == 401)
					$location.path("401.html");
			});

		};

		$scope.productFamilyAutoComplete = function (val) {
			return $http.post('api/product/family', {
				take: 5,
				skip: 0,
				page: 1,
				pageSize: 5,
				field: "caFamily",
				filter: val
			}).then(function (res) {
				//console.log(res.data);
				return res.data;
			});
		};

		$scope.showProduct = function (id) {

			var scope = $scope; // FIXME unused variable ?

			var ModalInstanceCtrl = function ($scope, $modalInstance, object) {
				$scope.product = {
				};

				$scope.findOne = function () {
					Product.get({
						Id: object.product
					}, function (product) {
						$scope.product = product;

					}, function (err) {
						if (err.status == 401)
							$location.path("401.html");
					});

				};

				var dict = ["fk_tva", "fk_product_status", "fk_units"];

				$http({method: 'GET', url: '/api/dict', params: {
						dictName: dict,
					}
				}).success(function (data, status) {
					$scope.dict = data;
				});

				$scope.productFamilyAutoComplete = function (val) {
					return $http.post('api/product/family', {
						take: 5,
						skip: 0,
						page: 1,
						pageSize: 5,
						field: "caFamily",
						filter: val
					}).then(function (res) {
						//console.log(res.data);
						return res.data;
					});
				};

				$scope.update = function () {
					var product = $scope.product;

					product.$update(function (response) {
					});
				};
			};

			var modalInstance = $modal.open({
				templateUrl: '/partials/product/view.html',
				controller: ModalInstanceCtrl,
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							product: id
						};
					}
				}
			});
			modalInstance.result.then(function (product) {
				//$scope.contacts.push(contacts);
				//$scope.countContact++;
			}, function () {
			});
		};



		/*
		 * NG-GRID for product list
		 */

		$scope.filterOptionsProduct = {
			filterText: "",
			useExternalFilter: true
		};

		// paging
		$scope.totalCountProduct = 0;

		$scope.pagingOptionsProduct = {
			pageSizes: [500, 1000, 2500, 5000],
			pageSize: 1000,
			currentPage: 1
		};

		$scope.$watch('pagingOptionsProduct', function (newVal, oldVal) {
			if (newVal.currentPage !== oldVal.currentPage) {
				$scope.find();
			}
		}, true);

		$scope.$watch('filterOptionsProduct', function (newVal, oldVal) {
			if (newVal.filterText !== oldVal.filterText) {
				$scope.find();
			}
		}, true);

		$scope.$watch('sortOptionsProduct', function (newVal, oldVal) {
			if (newVal.directions[0] !== oldVal.directions[0] && newVal.fields[0] !== oldVal.fields[0]) {
				$scope.find();
			}
		}, true);

		// sorting
		$scope.sortOptionsProduct = {fields: ["ref"], directions: ["asc"]};

		$scope.gridOptionsProduct = {
			data: 'products',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsProduct,
			pagingOptions: $scope.pagingOptionsProduct,
			sortInfo: $scope.sortOptionsProduct,
			useExternalSorting: true,
			enablePaging: true,
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'ref', displayName: 'Produit', width: "200px", cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-click="showProduct(row.getProperty(\'_id\'))" data-tooltip-options=\'{"position":"top"}\' title=\'{{row.getProperty(col.field)}}\'><span class="icon-bag"></span> {{row.getProperty(col.field)}}</a></div>'},
				{field: 'label', displayName: 'Nom'},
				{field: 'pu_ht', displayName: 'Tarif HT', width: '100px', cellClass: "align-right", cellFilter: "number:3"},
				{field: 'status.name', width: '100px', displayName: 'Etat',
					cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')">{{row.getProperty(\'status.name\')}}</small></span></div>'
				},
				{field: 'caFamily', displayName: 'Famille', cellClass: "align-center", width: '150px',
					cellTemplate: '<div class="ngCellText align-center"><span editable-text="row.getProperty(col.field)" buttons="no" e-form="caFamilyBtnForm" e-typeahead="family as family for family in productFamilyAutoComplete($viewValue)" e-typeahead-on-select="updateInPlace(\'/api/product\',col.field, row, $item); caFamilyBtnForm.$cancel();" ><span ng-show="row.getProperty(col.field)"></span> {{row.getProperty(col.field)}}</span> <span class="icon-pencil grey" ng-click="caFamilyBtnForm.$show()" ng-hide="caFamilyBtnForm.$visible"></span></div>'
				},
				{field: 'updatedAt', displayName: 'Dernière MAJ', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'"}
			]
		};

		$scope.updateInPlace = function (api, field, row, newdata) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function () {
					$http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
						data: {
							oldvalue: row.entity[field],
							value: newdata
						}
					})
							.success(function (data, status) {
								if (status == 200) {
									if (data) {
										row.entity = data;
									}
								}
							});

					$scope.save.pending = false;
				}, 200);
			}

			return false;
		};

		$scope.addNew = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/product/create.html',
				controller: "ProductCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function (product) {
				//console.log(product);
				$scope.products.push(product);
				$scope.countProducts++;
			}, function () {
			});
		};


	}]);

angular.module('mean.products').controller('ProductBarCodeController', ['$scope', '$routeParams', 'Global', '$http', function ($scope, $routeParams, Global, $http) {
		$scope.global = Global;

		$scope.isChecked = {};
		$scope.productsBarCode = {};
		$scope.storehouse = {};
		$scope.selected = {};

		function initProducts() {
			$http({method: 'GET', url: 'api/product', params: {
					barCode: 1
				}
			}).
					success(function (data, status) {
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
					success(function (entrepot, status) {
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

		$scope.updateCheck = function (product, stock) {
			$http({method: 'PUT', url: 'api/product/storehouse', data: {
					product: product,
					stock: stock,
					checked: $scope.isChecked[stock.barCode][product._id]
				}
			}).
					success(function (data, status) {
						console.log("ok");
					});
		};

		$scope.initList = function () {
			initProducts();
			initEntrepot();
		};

		$scope.societeAutoComplete = function (val) {
			return $http.post('api/societe/autocomplete', {
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

		$scope.insert = function () {
			$http({method: 'POST', url: 'api/product/storehouse', data: $scope.storehouse
			}).
					success(function (data, status) {
						//$scope.products = data;
						$scope.initList();
					});
		};


	}]);

angular.module('mean.products').controller('LineController', ['$scope', '$http', '$modalInstance', 'Global', 'object', 'options', function ($scope, $http, $modalInstance, Global, object, options) {
		$scope.global = Global;

		$scope.line = object;
		$scope.supplier = options && options.supplier;

		$scope.dict = {};

		$scope.init = function () {

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: "fk_tva",
				}
			}).success(function (data, status) {
				$scope.dict.fk_tva = data;
			});
		};

		var round = function (value, decimals) {
			return Number(Math.round(value + 'e' + (decimals)) + 'e-' + (decimals));
		};

		$scope.addOrUpdate = function () {
			$scope.line.total_ht = round($scope.line.pu_ht * $scope.line.qty, 2);
			$scope.line.total_tva = $scope.line.total_ht * $scope.line.tva_tx / 100;
			$scope.line.total_ttc = $scope.line.total_ht + $scope.line.total_tva;

			$modalInstance.close($scope.line);
		};

		$scope.updateLine = function (data) {

			if (!$scope.line.description)
				$scope.line.description = data.product.id.description;

			$scope.line.minPrice = data.product.id.minPrice;

			if (data.pu_ht)
				$scope.line.pu_ht = data.pu_ht;

			$scope.line.tva_tx = data.product.id.tva_tx;

			$scope.line.product = data.product.id;

			if (!data.template)
				$scope.line.product.template = "/partials/lines/classic.html";

			$scope.line.product.id = data.product.id._id;
			$scope.line.product.name = data.product.id.ref;
			$scope.line.product.family = data.product.id.caFamily;

			//console.log(data);
		};

		$scope.productAutoComplete = function (val) {
			return $http.post('api/product/autocomplete', {
				take: 5,
				skip: 0,
				page: 1,
				pageSize: 5,
				price_level: options.price_level,
				supplier: options.supplier,
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function (res) {
				//console.log(res.data);
				return res.data;
			});
		};

	}]);

angular.module('mean.products').controller('ProductCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Products', function ($scope, $http, $modalInstance, $upload, $route, Global, Product) {
		$scope.global = Global;

		$scope.product = {
			minPrice: 0,
			billingMode: "QTY",
			Status: "SELL",
			tva_tx: 20,
			units: "unit"
		};

		$scope.dict = {};
		$scope.refFound = false;
		$scope.validRef = true;

		$scope.billingModes = [
			{id: "QTY", label: "Quantité"},
			{id: "MONTH", label: "Abonnement mensuel"}
		];

		$scope.init = function () {
			var dict = ["fk_tva", "fk_product_status", "fk_units"];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict,
				}
			}).success(function (data, status) {
				$scope.dict = data;
			});
		};

		$scope.create = function () {
			var product = new Product(this.product);
			product.$save(function (response) {
				//console.log(response);
				$modalInstance.close(response);
				//$location.path("societe/" + response._id);
			});
		};

		$scope.isValidRef = function () {
			var ref = $scope.product.ref.trim().toUpperCase();
			$scope.refFound = false;

			var isValide = true;
			if (!ref || ref.indexOf(" ") > -1)
				isValide = false;

			if (isValide)
				$http({method: 'GET', url: '/api/product/' + ref
				}).success(function (data, status) {
					//console.log(data);
					if (data && data._id) // REF found
						$scope.refFound = true;
				});

			$scope.validRef = isValide;
		};

	}]);


angular.module('mean.products').controller('ProductPriceLevelController', ['$scope', '$location', '$route', '$http', '$timeout', '$modal', 'Global', function ($scope, $location, $route, $http, $timeout, $modal, Global) {

		$scope.priceLevel = [];
		$scope.price_level = null;
		$scope.prices_level = [];

		$scope.init = function () {

			$http({method: 'GET', url: '/api/product/price_level/select'
			}).success(function (data, status) {
				$scope.prices_level = data;
				//console.log(data);
			});
		};

		$scope.find = function () {
			$scope.init();

			$http({method: 'GET', url: '/api/product/price_level', params: {
					price_level: $scope.price_level
				}
			}).success(function (data, status) {
				//console.log(data);
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
			plugins: [new ngGridCsvExportPlugin({delimiter: ';'})],
			showFooter: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'product.name', displayName: 'Ref produit', width: "15%", enableCellEdit: false},
				{field: 'product.id.label', displayName: 'Description', enableCellEdit: false},
				{field: 'price_level', displayName: 'Liste de prix', width: "80px", enableCellEdit: false},
				{field: 'qtyMin', displayName: 'Minimum de commande', cellClass: "align-right", width: "150px", enableCellEdit: false},
				{field: 'pu_ht', displayName: 'Tarif HT', width: "80px", cellClass: "blue align-right", editableCellTemplate: '<input type="number" step="1" ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-blur="update(row)"/>'},
				{field: 'product.id.pu_ht', displayName: 'Base HT', width: "80px", cellClass: "align-right", enableCellEdit: false},
				{field: 'discount', displayName: 'Remise', width: "80px", cellClass: "blue align-right", cellFilter: "percent:3", editableCellTemplate: '<input type="number" step="1" ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-blur="update(row)"/>'},
				{field: 'tms', displayName: 'Date MAJ', width: "100px", cellFilter: "date:'dd/MM/yyyy'", enableCellEdit: false},
				{displayName: "Actions", enableCellEdit: false, width: "60px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button red-gradient icon-trash" title="Supprimer" ng-confirm-click="Supprimer le tarif du produit ?" confirmed-click="remove(row)"></button></div></div>'}
			]
		};

		$scope.update = function (row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			var d = new Date(); // FIXME unused variable ?

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function () {
					$http({method: 'PUT', url: 'api/product/price_level', data: row.entity
					}).success(function (data, status) {
						$scope.save.pending = false;
					});
				}, 200);
			}
		};

		$scope.remove = function (row) {
			for (var i = 0; i < $scope.priceLevel.length; i++) {
				if (row.entity._id === $scope.priceLevel[i]._id) {
					$http({method: 'DELETE', url: 'api/product/price_level', data: row.entity
					}).success(function (data, status) {  // FIXME function in a loop !
						$scope.priceLevel.splice(i, 1);
					});
					break;
				}
			}
		};

		$scope.addNewPrice = function () {
			var modalInstance = $modal.open({
				templateUrl: 'myModalContent.html',
				controller: ModalInstanceCtrl,
				//windowClass: "steps",
				resolve: {
					options: function () {
						return {
							price_level: $scope.price_level
						};
					}
				}
			});

			modalInstance.result.then(function (price) {
				$http({method: 'POST', url: 'api/product/price_level', data: price
				}).success(function (data, status) {
					if (data.price_level === $scope.price_level)
						$scope.priceLevel.push(data);
					else {
						$scope.price_level = data.price_level;
						$scope.find();
					}

				});
			}, function () {
			});
		};

		var ModalInstanceCtrl = function ($scope, $modalInstance, options) {

			$scope.price = {
				product: {
					name: ""
				},
				pu_ht: 0,
				discount: 0,
				qtyMin: 0,
				price_level: options.price_level,
				tms: new Date()
			};

			$scope.productAutoComplete = function (val) {
				return $http.post('api/product/autocomplete', {
					take: 5,
					skip: 0,
					page: 1,
					pageSize: 5,
					filter: {logic: 'and', filters: [{value: val}]
					}
				}).then(function (res) {
					for (var i in res.data) {
						res.data[i] = res.data[i].product.id;
						res.data[i].name = res.data[i].ref;
						//console.log(res.data[i]);
					}
					return res.data;
				});
			};

			$scope.priceLevelAutoComplete = function (val) {
				return $http.post('api/product/price_level/select', {
					take: 5,
					skip: 0,
					page: 1,
					pageSize: 5,
					filter: {logic: 'and', filters: [{value: val}]
					}
				}).then(function (res) {
					return res.data;
				});
			};

			$scope.ok = function () {
				$modalInstance.close($scope.price);
			};

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
		};

	}]);
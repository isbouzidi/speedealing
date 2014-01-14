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
						barCode: {type: "string"},
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

		function initProducts() {
			$http({method: 'GET', url: 'api/product', params: {
					productOnly: 1,
					type: 'PRODUCT'
				}
			}).
					success(function(data, status) {
				$scope.products = data;
				for(var i in data) {
					$scope.productsBarCode[data[i]._id] = data[i];
				}
			});
		}

		function numberFormat(number, width) {
			if(isNaN(number))
				number=0;
			return new Array(width + 1 - (number + '').length).join('0') + number;
		}

		function initEntrepot() {
			$scope.stocks = [];

			$http({method: 'GET', url: 'api/product/storehouse'
			}).
					success(function(entrepot, status) {
				//$scope.products = data;

				for (var i = 0; i < entrepot.length; i++) {
					var stock = {};
					stock.client = entrepot[i].societe.name;
					//stock.barCode = entrepot[i].societe.barCode;
					stock.stock = entrepot[i].name;
					//stock.stockCode = entrepot[i].barCode;
					stock.barCode = numberFormat(entrepot[i].barCode, 4);

					var codeBar = stock.barCode;

					for (var j = 0; j < entrepot[i].subStock.length; j++) {
						stock.subStock = entrepot[i].subStock[j].name;
						stock.subStockCode = entrepot[i].subStock[j].barCode;
						stock.barCode = codeBar + numberFormat(entrepot[i].subStock[j].barCode, 2);
						stock.productId = entrepot[i].subStock[j].productId;
						$scope.stocks.push(stock);
						
						$scope.isChecked[stock.barCode] = {};
						
						for (var k = 0; k< entrepot[i].subStock[j].productId.length; k++) {
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
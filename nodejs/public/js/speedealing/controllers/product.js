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

		var entrepot = [
			{
				"name": "FLEYS",
				"codeBar": "S001",
				"codeClient": {
					"codeBar": "C00100",
					"name": "FLEYS"
				},
				"subStock": []
			},
			{
				"name": "BIOLOGISTIC",
				"codeBar": "S002",
				"codeClient": {
					"codeBar": "C00101",
					"name": "BIOLOGISTIC"
				},
				"subStock": []
			},
			{
				"name": "GEODIS",
				"codeBar": "S003",
				"codeClient": {
					"codeBar": "C00102",
					"name": "GEODIS"
				},
				"subStock": [
					{
						"name": "",
						"barCode": "K000"
					}
				]
			},
			{
				"name": "SPIE",
				"codeBar": "S004",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": [
					{
						"name": "SPIE MATRA",
						"barCode": "K001"
					},
					{
						"name": "SPIE REG",
						"barCode": "K002"
					}
				]
			},
			{
				"name": "UNISYS",
				"codeBar": "S005",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "NEXTIRAONE",
				"codeBar": "S006",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "INFINERA",
				"codeBar": "S007",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "EAF",
				"codeBar": "S008",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "APX",
				"codeBar": "S009",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "BYBOX",
				"codeBar": "S010",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "CIENA",
				"codeBar": "S011",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "ORACLE",
				"codeBar": "S012",
				"codeClient": {
					"codeBar": "C00103",
					"name": "DHLSOL"
				},
				"subStock": []
			},
			{
				"name": "IBM",
				"codeBar": "S013",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": []
			},
			{
				"name": "TOSHIBA",
				"codeBar": "S014",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": []
			},
			{
				"name": "NCR",
				"codeBar": "S015",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": []
			},
			{
				"name": "SIEMENS",
				"codeBar": "S016",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": [
					{
						"name": "VALISE",
						"barCode": "K003"
					},
					{
						"name": "SIEMENS",
						"barCode": "K004"
					}
				]
			},
			{
				"name": "WINCOR",
				"codeBar": "S017",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": [
					{
						"name": "WINCOR FR",
						"barCode": "K005"
					},
					{
						"name": "ARVATO DE",
						"barCode": "K006"
					},
					{
						"name": "WINCOR/ARVATO",
						"barCode": "K007"
					}
				]
			},
			{
				"name": "EURO IMPACT",
				"codeBar": "S018",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": []
			},
			{
				"name": "ROUX",
				"codeBar": "S019",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": []
			},
			{
				"name": "STACI",
				"codeBar": "S020",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": [
					{
						"name": "STACI",
						"barCode": "K008"
					},
					{
						"name": "BAT",
						"barCode": "K009"
					}
				]
			},
			{
				"name": "MOTOBYCAT",
				"codeBar": "S021",
				"codeClient": {
					"codeBar": "C00104",
					"name": "LM2S"
				},
				"subStock": []
			}
		];

		function initProducts() {
			$http({method: 'GET', url: 'api/product', params: {
					productOnly: 1,
					type: 'PRODUCT'
				}
			}).
					success(function(data, status) {
				$scope.products = data;
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
					console.log(entrepot[i]);
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
					}

				}
			});
		}


		var links = {
			"P0010": [
				{stock: "S001", subStock: "K000"},
				{stock: "S002", subStock: "K000"},
				{stock: "S003", subStock: "K000"},
				{stock: "S004", subStock: "K001"},
				{stock: "S004", subStock: "K002"},
				{stock: "S005", subStock: "K000"}
			],
			"P0020": [{stock: "S001", subStock: "K000"}]
					//"P0030","P0040","P0110","P0120","P0130","P0140","P0100","P0141","P0122","P0142","P0120","P0220","P0310","P0312","P0313","P0320","P0330","P0340","P0341","P0350","P0319","P0360"
		};

		$scope.isChecked = function(product, stock) {
			// stock.stock
			// stock.subStock
			// product
			var productId = product._id;
			
			for (var i in stock.productId) {
				if (stock.productId[i].length == 0)
					return false;

				if (stock.productId[i] == productId)
					return true;
			}
			return false;
		};
		
		$scope.updateCheck = function(product, stock) {
			// stock.stock
			// stock.subStock
			// product
			var productId = product._id;
			console.log($scope.checked[product._id][stock.barCode]);
			return;
			
			for (var i in stock.productId) {
				if (stock.productId[i].length == 0)
					return false;

				if (stock.productId[i] == productId)
					return true;
			}
			return false;
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
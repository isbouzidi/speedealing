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
						author: {editable: false, defaultValue: {id: "{{user.id}}", name: "{{user.name}}"}},
						Status: {defaultValue: {id: "SELL", name: "En vente", css: "green-gradient"}},
						tva_tx: {type: "string", defaultValue: 19.6},
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
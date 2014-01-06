angular.module('mean.system').controller('UserRhAbsenceController', ['$scope', '$routeParams', '$location', '$route', 'Global', function($scope, $routeParams, $location, $route, Global) {
		$scope.global = Global;

		var crudServiceBaseUrl = "api/user/absence";

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
			autoSync: false,
			pageSize: 50,
			schema: {
				model: {
					id: "_id",
					fields: {
						_id: {editable: false, nullable: true},
						datec: {type: "date", editable: false, defaultValue: Date().now},
						dateStart: {type: "date", defaultValue: Date().now},
						dateEnd: {type: "date", defaultValue: Date().now},
						nbDay: {type: "number" ,validation: {min: 0}},
						author: {editable: false, defaultValue: {id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname}},
						user: { validation: {required: true}, nullable: false, defaultValue: {id: null, name: null}},
						Status: {defaultValue: {id: "REQUEST", name: "Demande", css: "blue-gradient"}}
					}
				}
			},
			error: function(e) {
				// log error
				if (e.xhr.status === 500)
					alert(e.xhr.responseText);
			},
			sort: {field: "dateEnd", dir: "desc"}
		});

		$scope.statusDropDownEditor = function(container, options) {
			$('<input data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoDropDownList({
				autoBind: false,
				dataSource: {
					transport: {
						read: {
							url: "api/user/absence/status/select",
							type: "GET",
							dataType: "json"
						}
					}
				}
			});
		};

		$scope.dateTimeEditor = function(container, options) {
			$('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '" data-format="' + options.format + '"/>')
					.appendTo(container)
					.kendoDateTimePicker({});
		};



		$scope.userEditor = function(container, options) {
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
							url: "api/user/name/autocomplete",
							type: "POST",
							dataType: "json"
						}
					}
				}
			});
		};

		/*$scope.statusFilter = function(element) {
			element.kendoDropDownList({
				dataTextField: "name",
				dataValueField: "id",
				dataSource: {
					transport: {
						read: {
							url: "api/user/absence/status/select",
							type: "GET",
							dataType: "json"
						}
					}
				},
				optionLabel: "--Status--"
			});
		};*/

	}]);
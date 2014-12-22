"use strict";
/* global angular: true */

angular.module('mean.europexpress').controller('EEPlanningController', ['$scope', '$routeParams', '$location', '$route', '$modal', 'Global', '$http', 'EEPlanning', function ($scope, $routeParams, $location, $route, $modal, Global, $http, Object) {
		$scope.global = Global;
		$scope.showEdit = {};

		$scope.cpt = 0;
		$scope.hsupp = 0;

		$scope.dateDay = function (d) {
			var y = parseInt($routeParams.id2);
			var w = parseInt($routeParams.id1);

			var days = 2 + d + (w - 1) * 7 - (new Date(y, 0, 1)).getDay();
			return new Date(y, 0, days, 8, 0, 0);
		};

		$scope.find = function () {
			$scope.hsupp = 0;

			if ($routeParams.id1 == null)
				return $scope.today();

			//console.log($routeParams);
			Object.query({week: $routeParams.id1, year: $routeParams.id2}, function (tournees) {
				$scope.tournees = tournees;
				$scope.cpt = $scope.tournees.length;

				// somme des heures Supp de la semaine
				for (var i = 0; i < $scope.cpt; i++)
					$scope.hsupp += tournees[i].hSupp;
			});
		};

		$scope.createWeek = function () {
			$http({method: 'POST', url: 'api/europexpress/planning/newWeek', data: {
					year: $routeParams.id2,
					week: $routeParams.id1}
			}).
					success(function (data, status) {
						$scope.find();
					});
		};

		$scope.enableEdit = function (id) {
			$scope.showEdit[id] = true;
		};

		$scope.today = function () {
			var d = new Date();
			d.setHours(0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			var week = Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7).toString();
			$location.path('module/europexpress/planning.html/' + week + '/' + d.getFullYear());
		};

		$scope.next = function () {
			var year = parseInt($routeParams.id2);
			var week = parseInt($routeParams.id1);

			if (week === 52) {
				year++;
				week = 0;
			}
			week++;

			//console.log('module/europexpress/planning.html/' + week + '/' + year);

			$location.path('module/europexpress/planning.html/' + week + '/' + year);
		};

		$scope.previous = function () {
			var year = parseInt($routeParams.id2);
			var week = parseInt($routeParams.id1);

			if (week === 1) {
				year--;
				week = 53;
			}
			week--;

			$location.path('module/europexpress/planning.html/' + week + '/' + year);
		};

		$scope.week = $routeParams.id1 + '/' + $routeParams.id2;

		$scope.disableEdit = function () {
			for (var i in $scope.showEdit)
				$scope.showEdit[i] = false;
		};

		$scope.findOne = function (id) {
			Object.get({
				planningId: id
			}, function (aday) {
				$scope.aday = aday;
			});
		};

		$scope.addNewLine = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/europexpress/planning_popup.html',
				controller: "EEPlanningLineController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							week: $scope.week,
							details: [
								{},
								{mode: {id: "NONE", name: "Inactif"}, date: $scope.dateDay(0)},
								{mode: {id: "NONE", name: "Inactif"}, date: $scope.dateDay(1)},
								{mode: {id: "NONE", name: "Inactif"}, date: $scope.dateDay(2)},
								{mode: {id: "NONE", name: "Inactif"}, date: $scope.dateDay(3)},
								{mode: {id: "NONE", name: "Inactif"}, date: $scope.dateDay(4)},
								{mode: {id: "NONE", name: "Inactif"}, date: $scope.dateDay(5)}
							]
						};
					}
				}
			});

			modalInstance.result.then(function (tournee) {
				tournee = new Object(tournee);
				tournee.$save(function (response) {
					$scope.find();
				});
			}, function () {
			});
		};

		$scope.editLine = function (row) {
			var modalInstance = $modal.open({
				templateUrl: '/partials/europexpress/planning_popup.html',
				controller: "EEPlanningLineController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return row;
					}
				}
			});

			modalInstance.result.then(function (tournee) {
				//console.log(tournee);
				tournee.$update(function (response) {
				});
			}, function () {//on cancel
				$scope.find();
			});
		};

		$scope.removeLine = function (row) {
			//console.log(row);
			row.$remove();

			for (var i = 0; i < $scope.tournees.length; i++) {
				if (row._id === $scope.tournees[i]._id) {
					$scope.tournees.splice(i, 1);
					break;
				}
			}
		};
	}]);

angular.module('mean.europexpress').controller('EEPlanningLineController', ['$scope', '$http', '$modalInstance', 'Global', 'object', function ($scope, $http, $modalInstance, Global, object) {
		$scope.global = Global;

		$scope.tournee = object;
		$scope.dayList = [1, 2, 3, 4, 5, 6];

		$scope.modeList = [{id: "NONE", name: "Inactif"},
			{id: "AM", name: "AM"},
			{id: "PM", name: "PM"},
			{id: "DAY", name: "En journée"}];

		$scope.panierList = ["Panier jour", "Panier nuit", "Casse-croute"];

		//console.log(object);

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};

		$scope.addOrUpdate = function () {
			$modalInstance.close($scope.tournee);
		};

		$scope.updateMode = function (idx) {
			if ($scope.tournee.details[idx].mode.id == 'NONE') {
				$scope.tournee.details[idx].driver = null;
				$scope.tournee.details[idx].sousTraitant = null;
				$scope.tournee.details[idx].formation = null;
			}
		};


		/**
		 * AutoComplete User Driver
		 */

		$scope.driverAutoComplete = function (val) {
			return $http.post('api/user/name/autocomplete?lastname=1&status=ENABLE&status=NOCONNECT', {
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

		/**
		 * AutoComplete Sous-Traitant
		 */

		$scope.subcontractorAutoComplete = function (val) {
			return $http.post('api/societe/autocomplete?fournisseur=SUBCONTRACTOR', {
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

angular.module('mean.europexpress').controller('EETourneeController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EEPlanning', function ($scope, $routeParams, $location, $route, Global, Object) {
		$scope.global = Global;

		var crudServiceBaseUrl = "api/europexpress/tournee";

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
				parameterMap: function (options, operation) {
					if (operation !== "read" && options.models) {
						return {models: kendo.stringify(options.models)};
					}
				}
			},
			error: function (e) {
				// log error
				alert(e.xhr.responseText);
			},
			batch: true,
			pageSize: 50,
			schema: {
				model: {
					id: "_id",
					fields: {
						_id: {editable: false, nullable: true},
						storehouse: {editable: true, validation: {required: true}},
						datec: {type: "date", editable: true},
						client: {editable: true, defaultValue: {id: null, name: ""}},
						forfait: {editable: true, type: "boolean", defaultValue: false},
						enabled: {editable: true, type: "boolean", defaultValue: true},
						Mond_mode: {editable: true, defaultValue: {id: "NONE", name: ""}},
						Mond_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Mond_panier: {editable: true, defaultValue: []},
						Tues_mode: {editable: true, defaultValue: {id: "NONE", name: ""}},
						Tues_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Tues_panier: {editable: true, defaultValue: []},
						Wedn_mode: {editable: true, defaultValue: {id: "NONE", name: ""}},
						Wedn_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Wedn_panier: {editable: true, defaultValue: []},
						Thur_mode: {editable: true, defaultValue: {id: "NONE", name: ""}},
						Thur_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Thur_panier: {editable: true, defaultValue: []},
						Frid_mode: {editable: true, defaultValue: {id: "NONE", name: ""}},
						Frid_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Frid_panier: {editable: true, defaultValue: []},
						Satu_mode: {editable: true, defaultValue: {id: "NONE", name: ""}},
						Satu_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Satu_panier: {editable: true, defaultValue: []}
					}
				}
			},
			sort: {field: "storehouse", dir: "asc"}
		});

		$scope.clientDropDownEditor = function (container, options) {
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

		$scope.modeDropDownEditor = function (container, options) {
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

		$scope.panierMultiSelect = function (container, options) {
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
		}
	}]);

angular.module('mean.europexpress').controller('EETransportController', ['$scope', '$routeParams', '$location', '$route', '$modal', 'Global', 'EETransport', function ($scope, $routeParams, $location, $route, $modal, Global, Object) {
		$scope.global = Global;

		$scope.gridOptionsTransports = {};

		$scope.types = [
			{name: "3 derniers mois", id: "THREEMONTH"},
			{name: "Tous", id: "ALL"}];

		$scope.type = {name: "3 derniers mois", id: "THREEMONTH"};

		/*var crudServiceBaseUrl = "api/europexpress/courses";

		$scope.dataSource = new kendo.data.DataSource({
			serverSorting: true,
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
				parameterMap: function (options, operation) {
					if (operation !== "read" && options.models) {
						return {models: kendo.stringify(options.models)};
					}
					if (operation === "read") {
						return {
							$top: options.take,
							$skip: options.skip,
							$sort: options.sort
						}

					}
				}
			},
			error: function (e) {
				// log error
				alert(e.xhr.responseText);
			},
			batch: true,
			pageSize: 50,
			schema: {
				model: {
					id: "_id",
					fields: {
						_id: {editable: false, nullable: true},
						ref: {editable: false, defaultValue: ""},
						bordereau: {editable: true},
						type: {editable: true, defaultValue: {id: "COURSE", name: "Course", css: "green-gradient"}},
						typeCss: {defaultValue: {id: "COURSE", name: "Course", css: "green-gradient"}},
						ref_client: {type: "string"},
						client: {editable: true, defaultValue: {id: null, name: ""}},
						contact: {editable: false, defaultValue: {id: null, name: ""}},
						from: {editable: false, defaultValue: {zip: "", town: ""}},
						to: {editable: false, defaultValue: {zip: "", town: ""}},
						ETA: {editable: true, defaultValue: {date: null, contact: ""}},
						datec: {type: "date"},
						total_soustraitant: {type: "number", editable: false, defaultValue: null},
						date_livraison: {type: "date", editable: true},
						date_enlevement: {type: "date", editable: true},
						commission: {type: "number", editable: false, defaultValue: 0},
						fournisseur: {editable: true, defaultValue: {id: null, name: ""}},
						Status: {editable: false, defaultValue: {id: "NEW", name: "Nouveau", css: "grey-gradient"}},
						StatusCss: {defaultValue: {id: "NEW", name: "Nouveau", css: "grey-gradient"}},
						total_ht: {type: "number", editable: false, defaultValue: 0},
						boutons: {editable: false}
					}
				}
			},
			sort: {field: "date_livraison", dir: "desc"}
		});

		// cache certain champ dans le popup
		$scope.kendoEdit = function (e) {
			//console.log(e);
			e.container.find('label[for="from"]').hide();
			e.container.find('label[for="to"]').hide();
			e.container.find('label[for="total_soustraitant"]').hide();
			e.container.find('label[for="total_soustraitant"]').hide();
			//e.container.find('div[data-container-for="from"]').hide();
			e.container.find('label[for="undefined"]').hide();
			e.container.find('.button-group').hide();
		};*/

		$scope.dateTimeEditor = function (container, options) {
			$('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '" data-format="' + options.format + '"/>')
					.appendTo(container)
					.kendoDateTimePicker({});
		};

		/*$scope.clientDropDownEditor = function (container, options) {
			$('<input required id="id"/>')
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
		};

		$scope.fournisseurDropDownEditor = function (container, options) {
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
									url: "api/societe/autocomplete?fournisseur=SUBCONTRACTOR",
									type: "POST",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.typeDropDownEditor = function (container, options) {
			$('<input data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoDropDownList({
						autoBind: false,
						dataSource: {
							transport: {
								read: {
									url: "api/europexpress/courses/type/select",
									type: "GET",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.societeFilter = function (element) {
			element.kendoAutoComplete({
				dataTextField: "name",
				dataValueField: "name",
				dataSource: {
					serverFiltering: true,
					serverPaging: true,
					pageSize: 5,
					transport: {
						read: {
							url: "api/chaumeil/planning/societe/autocomplete",
							type: "POST",
							dataType: "json"
						}
					}
				}
			});
		};*/

		$scope.find = function () {
			Object.query({query: this.type.id, entity: Global.user.entity}, function (courses) {
				$scope.transports = courses;
				$scope.countTransports = courses.length;
			});
		};

		/*
		 * NG-GRID for transport list
		 */

		$scope.filterOptionsTransports = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsTransports = {
			data: 'transports',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsTransports,
			sortInfo: {fields: ["ref"], directions: ["desc"]},
			//showFilter:true,
			showGroupPanel: true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'ref', displayName: 'Ref.', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/module/europexpress/transport_edit.html/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: "typeCss.name", displayName: "Type", cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'typeCss.css\')}} glossy ">{{row.getProperty(\'typeCss.name\')}}</small></div>'},
				{field: 'client.name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'client.id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				//{field: 'ref_client', displayName: 'Ref Client'},
				{field: "from.zip", displayName: "Depart", cellTemplate: '<div class="ngCellText">{{row.getProperty(\'from.zip\')}} {{row.getProperty(\'from.town\')}}</div>'},
				{field: 'date_enlevement', displayName: 'Date Enl.', cellTemplate: '<div class="ngCellText" ng-class="{red: row.getProperty(col.field) == 10 }">{{row.getProperty(col.field) | date:\'dd-MM-yyyy HH:mm\'}}</div>'},
				{field: "to.zip", displayName: "Destination", cellTemplate: '<div class="ngCellText">{{row.getProperty(\'to.zip\')}} {{row.getProperty(\'to.town\')}}</div>'},
				{field: 'date_livraison', displayName: 'Date Liv.', cellTemplate: '<div class="ngCellText" ng-class="{red: row.getProperty(col.field) == 10 }">{{row.getProperty(col.field) | date:\'dd-MM-yyyy HH:mm\'}}</div>'},
				{field: 'fournisseur.name', displayName: 'Sous-Traitant'},
				{field: 'total_soustraitant', displayName: 'Montant ST', cellFilter: "currency", cellClass: "align-right"},
				//{field: 'StatusCss.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'StatusCss.css\')}} glossy">{{row.getProperty(\'StatusCss.name\')}}</small></div>'},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "currency", cellClass: "align-right"},
				{field: 'commission', displayName: 'Comission', cellFilter: "currency", cellClass: "align-right"},
				{field: 'bordereau', displayName: 'Bordereau'},
				//{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><a class="button icon-pencil" title="Editer" ng-disabled="!editable" ng-href="#!/module/europexpress/transport_edit.html/{{row.getProperty(\'_id\')}}"></a><a class="button icon-download" ng-href="api/europexpress/courses/pdf/{{row.getProperty(\'ref\')}}" target="_blank"></a><button class="button red-gradient icon-trash" disabled title="Supprimer"></button></div></div>'}
			]
		};

		/*   {field: "date_enlevement", editor: dateTimeEditor, title: "Date Enl.", format: "{0:dd/MM/yyyy HH:mm}", template: "#if (kendo.toString(date_enlevement, \"dd/MM/yyyy\") == kendo.toString(new Date(), \"dd/MM/yyyy\")) {# <span class=\"red\">#=kendo.toString(date_enlevement, \"dd/MM/yyyy HH:mm\")#</span> #} else {# #=kendo.toString(date_enlevement, \"dd/MM/yyyy HH:mm\")# #}#", filterable: {
		 ui: "datetimepicker"
		 }
		 },
		 
		 {field: "date_livraison", editor: dateTimeEditor, title: "Date Liv.", format: "{0:dd/MM/yyyy HH:mm}", template: "#if (kendo.toString(date_livraison, \"dd/MM/yyyy\") == kendo.toString(new Date(), \"dd/MM/yyyy\")) {# <span class=\"red\">#=kendo.toString(date_livraison, \"dd/MM/yyyy HH:mm\")#</span> #} else {# #=kendo.toString(date_livraison, \"dd/MM/yyyy HH:mm\")# #}#", filterable: {
		 ui: "datetimepicker"
		 }
		 },
		 
		 
		 {template:"<span class=\"button-group\"><a class=\"button icon-pencil\" ng-href=\"\\#!/module/europexpress/transport_edit.html/#=_id#/\"></a><a class=\"button icon-download\" ng-href=\"api/europexpress/courses/pdf/#=_id#\" target=\"_blank\"></a></span>", "width": "80px"}
		 ]'*/

		$scope.addNewMessagerie = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/europexpress/create_messagerie.html',
				controller: "EETransportCreateController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							type: {
								id: "MESSAGERIE",
								name: "Messagerie"
							},
							Status: {
								id: "LIV"
							},
							from: {
								zip: "",
								town: ""
							},
							to: {
								zip: "",
								town: ""
							}
						};
					}
				}
			});

			modalInstance.result.then(function (course) {
				course = new Object(course);
				course.$save(function (response) {
					$scope.transports.push(response);
					$scope.countTransports++;
				});
			}, function () {
			});
		};

		$scope.addNew = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/europexpress/create_transport.html',
				controller: "EETransportCreateController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							type: {
								id: "COURSE",
								name: "Course"
							},
							Status: {
								id: "LIV"
							},
							from: {
								zip: "",
								town: ""
							},
							to: {
								zip: "",
								town: ""
							}
						};
					}
				}
			});

			modalInstance.result.then(function (course) {
				course = new Object(course);
				course.$save(function (response) {
					//$scope.transports.push(response);
					//$scope.countTransports++;
					$location.path("module/europexpress/transport_edit.html/" + course._id);
				});
			}, function () {
			});
		};

	}]);

angular.module('mean.europexpress').controller('EETransportCreateController', ['$scope', '$routeParams', '$location', '$route', '$modalInstance', 'Global', 'EETransport', '$http', '$timeout', 'object', function ($scope, $routeParams, $location, $route, $modalInstance, Global, Object, $http, $timeout, object) {
		$scope.global = Global;

		$scope.course = object;

		$scope.validBorderau = true;

		$scope.init = function () {
			$http({method: 'GET', url: 'api/europexpress/courses/type/select'
			}).success(function (data, status) {
				$scope.type = data;
				//console.log(data);
			});
		};

		$scope.create = function () {
			$modalInstance.close($scope.course);
		};

		$scope.$watch('course.datec', function (date)
		{
			var time = new Date(date);
			if (new Date($scope.dateC).getTime() != time.getTime())
				$scope.dateC = time;
		});

		$scope.selectStatus = function () {
			$http({method: 'GET', url: 'api/europexpress/courses/status/select'
			}).
					success(function (data, status) {
						$scope.status = data;
					});
		};

		$scope.clientAutoComplete = function (val) {
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

		$scope.fournisseurAutoComplete = function (val) {
			return $http.post('api/societe/autocomplete?fournisseur=SUBCONTRACTOR', {
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

		$scope.calculPrice = function () {
			if ($scope.course.type.id !== "MESSAGERIE")
				return;

			if ($scope.course.total_soustraitant == null)
				$scope.course.total_soustraitant = 0;

			if (!$scope.course.poids || !$scope.course.to.zip)
				return;

			$http({method: 'GET', url: 'api/product/price_level', params: {
					price_level: $scope.course.client.price_level.toUpperCase(),
					ref: "MESS" + $scope.course.to.zip.substr(0, 2),
					qty: $scope.course.poids
				}
			}).
					success(function (data, status) {
						/*
						 * 2 cas de figures :
						 *  - si poids inf ou egale a 100 on applique tranche de poids
						 *  - si poids supp a 100 : arrondi a la dizaine supp puis divise par 100 et multiplie par le poids
						 *  ex : 261 => 270 : 2.7 x poids
						 *  
						 *  order enable : price value is the first value of array data
						 */

						if (data.length == 0)
							return;

						if ($scope.course.poids <= 100) {
							$scope.course.total_ht = data[0].pu_ht;
						} else {
							var poids = $scope.course.poids;
							// arrondi a la dizaine supp.
							if (poids % 10) {
								poids = (Math.floor(poids / 10) + 1) * 10;
							}
							$scope.course.total_ht = Math.round(poids / 100 * data[0].pu_ht * 100) / 100;
						}
					});
		};


		$scope.checkBordereau = function () {

			if ($scope.course.bordereau)
				$http({method: 'GET', url: '/api/europexpress/courses/uniqId', params: {
						bordereau: $scope.course.bordereau
					}
				}).success(function (data, status) {
					$scope.validBorderau = true;
					if (data.bordereau) { // already exist
						$scope.validBorderau = false;
					}
				});
			else
				$scope.validBordereau = false;
		};

	}]);

angular.module('mean.europexpress').controller('EETransportEditController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EETransport', '$http', '$timeout', function ($scope, $routeParams, $location, $route, Global, Object, $http, $timeout) {
		$scope.global = Global;

		$scope.cancel = function () {
			$location.path('module/europexpress/transport.html');
		};

		$scope.update = function (id) {
			var course = $scope.course;

			course.$update(function () {
				$location.path('module/europexpress/transport.html');
			});
		};

		$scope.findOne = function () {
			Object.get({
				id: $routeParams.id
			}, function (course) {
				$scope.course = course;
				$scope.refreshContact();
				$timeout(function () {
					angular.element('select').change();
				}, 300);
			});
		};

		$scope.$watch('course.datec', function (date)
		{
			var time = new Date(date);
			if (new Date($scope.dateC).getTime() != time.getTime())
				$scope.dateC = time;
		});

		$scope.$watch('course.date_enlevement', function (date)
		{
			if (date == null)
				return;
			var time = new Date(date);
			if (new Date($scope.dateEnlevement).getTime() != time.getTime())
				$scope.dateEnlevement = time;
		});

		$scope.$watch('course.date_livraison', function (date)
		{
			if (date == null)
				return;
			var time = new Date(date);
			if (new Date($scope.dateLivraison).getTime() != time.getTime())
				$scope.dateLivraison = time;
		});

		$scope.$watch('course.ETA.date', function (date)
		{
			if (date == null)
				return;
			var time = new Date(date);
			if (new Date($scope.ETADate).getTime() != time.getTime())
				$scope.ETADate = time;
		});

		$scope.selectType = function () {
			$http({method: 'GET', url: 'api/europexpress/courses/type/select'
			}).
					success(function (data, status) {
						$scope.types = data;
					});
		};

		$scope.selectStatus = function () {
			$http({method: 'GET', url: 'api/europexpress/courses/status/select'
			}).
					success(function (data, status) {
						$scope.status = data;
					});
		};

		$scope.selectTarifs = function () {
			$http({method: 'GET', url: 'api/europexpress/courses/tarif/select'
			}).
					success(function (data, status) {
						$scope.tarifs = data;
					});
		};

		$scope.clientAutoComplete = function (val) {
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

		$scope.fournisseurAutoComplete = function (val) {
			return $http.post('api/societe/autocomplete?fournisseur=SUBCONTRACTOR', {
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

		$scope.refreshContact = function () {
			if ($scope.course.client.id == null) {
				$scope.contacts = [];
				return;
			}

			$http({method: 'GET', url: 'api/contact/societe', params: {
					societe: $scope.course.client.id}
			}).
					success(function (data, status) {
						$scope.contacts = data;
					});
		};

		$scope.calculPrice = function () {
			if ($scope.course.type.id !== "MESSAGERIE")
				return;

			if ($scope.course.total_soustraitant == null)
				$scope.course.total_soustraitant = 0;

			if (!$scope.course.poids || !$scope.course.to.zip)
				return;

			$http({method: 'GET', url: 'api/product/price_level', params: {
					price_level: $scope.course.client.price_level.toUpperCase(),
					ref: "MESS" + $scope.course.to.zip.substr(0, 2),
					qty: $scope.course.poids
				}
			}).
					success(function (data, status) {
						/*
						 * 2 cas de figures :
						 *  - si poids inf ou egale a 100 on applique tranche de poids
						 *  - si poids supp a 100 : arrondi a la dizaine supp puis divise par 100 et multiplie par le poids
						 *  ex : 261 => 270 : 2.7 x poids
						 *  
						 *  order enable : price value is the first value of array data
						 */

						if (data.length == 0)
							return;

						if ($scope.course.poids <= 100) {
							$scope.course.total_ht = data[0].pu_ht;
						} else {
							var poids = $scope.course.poids;
							// arrondi a la dizaine supp.
							if (poids % 10) {
								poids = (Math.floor(poids / 10) + 1) * 10;
							}
							$scope.course.total_ht = Math.round(poids / 100 * data[0].pu_ht * 100) / 100;
						}
					});
		};

	}]);

angular.module('mean.europexpress').controller('EEStockController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EEPlanning', function ($scope, $routeParams, $location, $route, Global, Object) {
		$scope.global = Global;

		var crudServiceBaseUrl = "api/europexpress/stock";

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
					dataType: "json",
					complete: function (e) {
						$("#grid").data("kendoGrid").dataSource.read();
					}
				},
				parameterMap: function (options, operation) {
					if (operation !== "read" && options.models) {
						return {models: kendo.stringify(options.models)};
					}
				}
			},
			error: function (e) {
				// log error
				alert(e.xhr.responseText);
			},
			batch: true,
			pageSize: 50,
			schema: {
				model: {
					id: "_id",
					fields: {
						_id: {editable: false, nullable: true},
						barCode: {editable: true, validation: {required: true}},
						qty: {type: "number", defaultValue: 1, validation: {required: true, min: 1}},
						datec: {type: "date", editable: true, defaultValue: new Date()},
						product: {editable: false, defaultValue: {id: null}},
						'product.name': {editable: false, defaultValue: "Non defini"},
						author: {editable: true, defaultValue: {id: Global.user._id, name: Global.user.name}},
						typeMove: {editable: false, defaultValue: {id: null, css: "", name: ""}},
						//penality: {editable: false, type: "boolean"},
						storehouse: {editable: false, defaultValue: "Aucun"},
						sub_storehouse: {editable: false, defaultValue: ""},
						client: {editable: false, defaultValue: {id: null, name: ""}}
					}
				}
			},
			sort: {field: "datec", dir: "desc"}
		});

		$scope.statusDropDownEditor = function (container, options) {
			$('<input data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoDropDownList({
						autoBind: false,
						dataSource: {
							transport: {
								read: {
									url: "api/europexpress/select",
									type: "GET",
									dataType: "json"
								}
							}
						}
					});
		};


		$scope.dateTimeEditor = function (container, options) {
			$('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '" data-format="' + options.format + '"/>')
					.appendTo(container)
					.kendoDateTimePicker({});
		};

		$scope.societeDropDownEditor = function (container, options) {
			$('<input required data-text-field="name" data-value-field="id" data-bind="value:' + options.field + '"/>')
					.appendTo(container)
					.kendoAutoComplete({
						minLength: 3,
						dataTextField: "name",
						filter: "contains",
						dataSource: {
							serverFiltering: true,
							serverPaging: true,
							pageSize: 5,
							transport: {
								read: {
									url: "api/societe/autocomplete",
									type: "GET",
									dataType: "json"
								}
							}
						}
					});
		};

		$scope.textareaEditor = function (container, options) {
			$('<textarea rows="5" cols="30" style="vertical-align:top;" data-bind="value: ' + options.field + '"></textarea>').appendTo(container);
		};

		$scope.userDropDownEditor = function (container, options) {
			$('<input required id="id"/>')
					.attr("name", options.field)
					.appendTo(container)
					.kendoAutoComplete({
						minLength: 2,
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

	}]);

angular.module('mean.europexpress').controller('EEVehiculeController', ['$scope', '$routeParams', '$location', '$route', '$upload', '$http', '$domUtilityService', 'Global', 'EEVehicule', function ($scope, $routeParams, $location, $route, $upload, $http, $domUtilityService, Global, Object) {
		$scope.global = Global;

		$scope.form = {};

		$scope.findOne = function () {
			Object.get({
				id: $routeParams.id
			}, function (vehicule) {
				$scope.vehicule = vehicule;

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": vehicule._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function (data, status) {
					if (status == 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				$http({method: 'GET', url: 'api/europexpress/buy', params:
							{
								find: {"vehicule.id": vehicule._id},
								fields: "title ref datec Status total_ht"
							}
				}).success(function (data, status) {
					if (status == 200)
						$scope.requestBuy = data;

					$scope.TotalBuy = 0;
					angular.forEach($scope.requestBuy, function (row) {
						if (row.Status.id == "PAYED")
							$scope.TotalBuy += row.total_ht;
					});
					$scope.countBuy = $scope.requestBuy.length;
				});

				$scope.checklist = 0;
				for (var i in vehicule.checklist)
					if (vehicule.checklist[i])
						$scope.checklist++;

			});
		};

		$scope.update = function () {
			var vehicule = $scope.vehicule;

			vehicule.$update(function (response) {
				$scope.checklist = 0;
				for (var i in response.checklist)
					if (response.checklist[i])
						$scope.checklist++;
			});
		};

		var iconsFilesList = {};

		/**
		 * Get fileType for icon
		 */
		$scope.getFileTypes = function () {
			$http({method: 'GET', url: 'dict/filesIcons'
			}).
					success(function (data, status) {
						if (status == 200) {
							iconsFilesList = data;
						}
					});
		};


		$scope.addNote = function () {
			if (!$scope.note)
				return

			$http({method: 'POST', url: 'api/europexpress/vehicules/note', data: {
					id: $scope.vehicule._id,
					note: $scope.note
				}
			}).
					success(function (data, status) {
						if (status == 200) {
							$scope.vehicule.notes.push(data);
							$scope.note = "";
						}
					});
		};

		$scope.addEntretien = function (id) {
			$http({method: 'POST', url: 'api/europexpress/vehicules/entretien', data: {
					id: $scope.vehicule._id,
					desc: $scope.form.desc,
					date: $scope.form.date,
					km: $scope.form.km
				}
			}).
					success(function (data, status) {
						if (status == 200) {
							$scope.vehicule.entretiens.push(data);
							$scope.vehicule.kms = data.km;
							$scope.form = {};
						}
					});
		};

		$scope.onFileSelect = function ($files) {
			//$files: an array of files selected, each file has name, size, and type.
			for (var i = 0; i < $files.length; i++) {
				var file = $files[i];
				if ($scope.vehicule)
					$scope.upload = $upload.upload({
						url: 'api/europexpress/vehicules/file/' + $scope.vehicule._id,
						method: 'POST',
						// headers: {'headerKey': 'headerValue'},
						// withCredential: true,
						data: {myObj: $scope.myModelObj},
						file: file,
						// file: $files, //upload multiple files, this feature only works in HTML5 FromData browsers
						/* set file formData name for 'Content-Desposition' header. Default: 'file' */
						//fileFormDataName: myFile, //OR for HTML5 multiple upload only a list: ['name1', 'name2', ...]
						/* customize how data is added to formData. See #40#issuecomment-28612000 for example */
						//formDataAppender: function(formData, key, val){} 
					}).progress(function (evt) {
						console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
					}).success(function (data, status, headers, config) {
						// file is uploaded successfully
						//$scope.myFiles = "";
						//console.log(data);
						if (!data.update) // if not file update, add file to files[]
							$scope.vehicule.files.push(data.file);
					});
				//.error(...)
				//.then(success, error, progress); 
			}
		};

		$scope.suppressFile = function (id, fileName, idx) {
			$http({method: 'DELETE', url: 'api/europexpress/vehicules/file/' + id + '/' + fileName
			}).
					success(function (data, status) {
						if (status == 200) {
							$scope.vehicule.files.splice(idx, 1);
						}
					});
		};

		$scope.fileType = function (name) {
			if (typeof iconsFilesList[name.substr(name.lastIndexOf(".") + 1)] == 'undefined')
				return iconsFilesList["default"];

			return iconsFilesList[name.substr(name.lastIndexOf(".") + 1)];
		};

		$scope.countDown = function (date, reverse) {
			var today = new Date();
			var day = new Date(date);
			//console.log(date);
			var seconds_left = today - day;

			if (reverse && seconds_left > 0)
				seconds_left = 0;
			else
				seconds_left = Math.round(seconds_left / 1000);

			var days = parseInt(seconds_left / 86400);
			seconds_left = seconds_left % 86400;

			var hours = parseInt(seconds_left / 3600);
			seconds_left = seconds_left % 3600;

			var minutes = parseInt(seconds_left / 60);
			if (reverse)
				minutes = Math.abs(minutes);

			minutes = ('0' + minutes).slice(-2);

			//return day;
			return {days: days, hours: hours, minutes: minutes};
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

		/*
		 * NG-GRID for ticket list
		 */

		$scope.filterOptionsBuy = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsBuyer = {
			data: 'requestBuy',
			enableRowSelection: false,
			sortInfo: {fields: ["ref"], directions: ["desc"]},
			filterOptions: $scope.filterOptionsBuy,
			i18n: 'fr',
			enableColumnResize: true,
			//$location.path('ticket/'+rowItem.entity._id); //ouvre le ticket
			columnDefs: [
				{field: 'title', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a ng-href="/api/europexpress/buy/pdf/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', displayName: 'Id'},
				{field: 'Status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
				{field: 'datec', displayName: 'Date création', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"}
			]
		};

	}]);

angular.module('mean.europexpress').controller('EEFacturationController', ['$scope', '$routeParams', '$http', '$location', 'Global', function ($scope, $routeParams, $http, $location, Global) {

		$scope.find = function () {
			if ($routeParams.id1 == null)
				return $scope.today();

			//console.log($routeParams);
			/*Object.query({week: $routeParams.id1, year: $routeParams.id2}, function(tournees) {
			 $scope.tournees = tournees;
			 $scope.cpt = $scope.tournees.length;
			 
			 // somme des heures Supp de la semaine
			 for (var i = 0; i < $scope.cpt; i++)
			 $scope.hsupp += tournees[i].hSupp;
			 });*/

			$http({method: 'POST', url: 'api/europexpress/billing', data: {
					month: parseInt($routeParams.id1) - 1,
					year: parseInt($routeParams.id2)
				}
			}).success(function (data, status) {
				if (status == 200) {
					$scope.result = data;

					$scope.countCourses = {};
					$scope.TotalCourses = {};


					$scope.countCourses.course = data.course.length;
					$scope.countCourses.messagerie = data.messagerie.length;
					$scope.countCourses.affretement = data.affretement.length;

					$scope.countCoursesST = data.allST.length;

					$scope.TotalCourses.course = 0;
					$scope.TotalCourses.messagerie = 0;
					$scope.TotalCourses.affretement = 0;
					$scope.TotalCoursesST = 0;
					$scope.TotalCoursesCE = 0;

					angular.forEach(data.course, function (row) {
						$scope.TotalCourses.course += row.total_ht;
					});

					angular.forEach(data.messagerie, function (row) {
						$scope.TotalCourses.messagerie += row.total_ht;
					});

					angular.forEach(data.affretement, function (row) {
						$scope.TotalCourses.affretement += row.total_ht;
					});

					angular.forEach(data.allST, function (row) {
						$scope.TotalCoursesST += row.total_soustraitant;
					});

					angular.forEach(data.allST, function (row) {
						if (row.chargesExt)
							$scope.TotalCoursesCE += row.chargesExt;
					});

				}
			});

		};

		$scope.showCreate = function () {
			if (!Global.user.rights.europexpressCourses || !Global.user.rights.europexpressCourses.createBills)
				return false;

			var d = new Date();
			d.setHours(0, 0, 0);

			if (d.getMonth() == parseInt($routeParams.id1) && d.getFullYear() == parseInt($routeParams.id2))
				return true;
		};

		$scope.createBills = function () {
			$http({method: 'GET', url: 'api/europexpress/billing', params: {
					month: parseInt($routeParams.id1) - 1,
					year: parseInt($routeParams.id2),
					entity: $scope.global.user.entity
				}
			}).success(function (data, status) {
				if (status == 200) {
					console.log(data);
				}
			});
		};

		$scope.today = function () {
			var d = new Date();
			d.setHours(0, 0, 0);
			$location.path('module/europexpress/facturation.html/' + (d.getMonth()) + '/' + d.getFullYear());
		};

		$scope.next = function () {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 12) {
				year++;
				month = 0;
			}
			month++;

			$location.path('module/europexpress/facturation.html/' + month + '/' + year);
		};

		$scope.previous = function () {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 1) {
				year--;
				month = 13;
			}
			month--;

			$location.path('module/europexpress/facturation.html/' + month + '/' + year);
		};

		$scope.month = $routeParams.id1 + '/' + $routeParams.id2;

		/*
		 * NG-GRID for courses list
		 */

		$scope.filterOptionsCourses = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsCourses = function (type) {
			return {
				data: 'result.' + type,
				enableRowSelection: false,
				sortInfo: {fields: ["client.name"], directions: ["asc"]},
				filterOptions: $scope.filterOptionsCourses,
				//$location.path('ticket/'+rowItem.entity._id); //ouvre le ticket
				showGroupPanel: false,
				//jqueryUIDraggable: true,
				i18n: 'fr',
				groups: ['client.name'],
				//groupsCollapsedByDefault: false,
				enableColumnResize: true,
				//plugins: [new ngGridFlexibleHeightPlugin()],
				columnDefs: [
					{field: 'client.name', width: "25%", displayName: 'Client', cellTemplate: '<div class="ngCellText"><a ng-href="#!/module/europexpress/transport_edit.html/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
					{field: 'ref', width: "10%", displayName: 'Id'},
					{field: 'to.town', width: "15%", displayName: 'Dest.'},
					{field: 'Status.name', width: "12%", displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
					{field: 'date_enlevement', width: "15%", displayName: 'Date d\'enlevement', cellFilter: "date:'dd-MM-yyyy HH:mm'"},
					{field: 'total_ht', width: "20%", displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"}
				],
				aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
						"    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.label CUSTOM_FILTERS}} : {{row.totalChildren()}} {{entryMaybePlural(row)}}</span> <span class=\"red strong\">Total HT: {{aggFunc(row,'total_ht') | euro}}</span></span>" +
						"    <div class=\"{{row.aggClass()}}\"></div>" +
						"</div>" +
						""
			};
		};

		$scope.aggFunc = function (row, idx) {
			var total = 0;
			//console.log(row);
			angular.forEach(row.children, function (cropEntry) {
				if (cropEntry.entity[idx])
					total += cropEntry.entity[idx];
			});
			return total.toString();
		};
		$scope.entryMaybePlural = function (row) {
			if (row.children.length > 1)
			{
				return "commandes";
			}
			else
				return "commande";
		};

		/*
		 * NG-GRID for courses sous-traitant list
		 */

		$scope.filterOptionsCoursesST = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsCoursesST = {
			data: 'result.allST',
			enableRowSelection: false,
			sortInfo: {fields: ["fournisseur.name"], directions: ["asc"]},
			filterOptions: $scope.filterOptionsCoursesST,
			//$location.path('ticket/'+rowItem.entity._id); //ouvre le ticket
			showGroupPanel: true,
			//jqueryUIDraggable: true,
			//plugins: [new ngGridFlexibleHeightPlugin()],
			enableColumnResize: true,
			i18n: 'fr',
			groups: ['type', 'fournisseur.name'],
			//groupsCollapsedByDefault: false,
			columnDefs: [
				{field: 'fournisseur.name', width: "25%", displayName: 'Sous-traitant', cellTemplate: '<div class="ngCellText"><a ng-href="/api/europexpress/buy/pdf/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', width: "15%", displayName: 'Id'},
				{field: 'type', width: "15%", displayName: 'Type'},
				{field: 'Status.name', width: "11%", displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
				{field: 'date_enlevement', width: "15%", displayName: 'Date d\'enlevement', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"},
				{field: 'total_soustraitant', width: "15%", displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"},
				{field: 'chargesExt', width: "15%", displayName: 'Charges extenes', cellFilter: "euro", cellClass: "align-right"}
			],
			aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
					"    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.label CUSTOM_FILTERS}} : {{row.totalChildren()}} {{entryMaybePlural(row)}}</span> <span class=\"red strong\">Total HT: {{aggFunc(row,'total_soustraitant') | euro}}</span> / <span class=\"strong\">Total HT charges externes: {{aggFunc(row,'chargesExt') | euro}}</span></span>" +
					"    <div class=\"{{row.aggClass()}}\"></div>" +
					"</div>" +
					""
		};


	}]);

angular.module('mean.europexpress').controller('EEGazoilCardController', ['$scope', 'pageTitle', '$routeParams', '$http', '$location', '$modal', 'EEGazoilCard', function ($scope, pageTitle, $routeParams, $http, $location, $modal, Object) {

		pageTitle.setTitle('Cartes Gazoil');

		$scope.paiements = [];
		$scope.paiement = {};
		$scope.Total = 0;
		$scope.count = 0;


		$scope.create = function () {
			var object = new Object(this.paiement);
			object.$save(function (response) {
				$scope.paiements.push(response);
				total();
			});
		};

		var total = function () {
			$scope.Total = 0;
			$scope.count = 0;

			$scope.count = $scope.paiements.length;
			for (var i = 0; i < $scope.paiements.length; i++) {
				$scope.Total += $scope.paiements[i].total_ht;
			}
		};

		$scope.remove = function (object) {
			object.$remove();

			for (var i in $scope.paiements) {
				if ($scope.paiements[i] == object) {
					$scope.paiements.splice(i, 1);
				}
			}
		};

		$scope.update = function () {
			var object = $scope.paiement;

			object.$update(function () {

			});
		};

		$scope.find = function () {
			Object.query(function (paiements) {
				$scope.paiements = paiements;
				total();
			});
		};

		$scope.addNew = function () {

			var modalInstance = $modal.open({
				templateUrl: 'myModalContent.html',
				controller: ModalInstanceCtrl,
				resolve: {
					object: function () {
						return $scope.paiement;
					}
				}
			});

			modalInstance.result.then(function (paiement) {
				$scope.paiement = paiement;
				$scope.create();
				$scope.paiement = {};
			}, function () {
			});
		};

		$scope.edit = function (row) {

			var modalInstance = $modal.open({
				templateUrl: 'myModalContent.html',
				controller: ModalInstanceCtrl,
				resolve: {
					object: function () {
						return row.entity;
					}
				}
			});

			modalInstance.result.then(function (paiement) {
				$scope.paiement = paiement;
				$scope.update();
				$scope.paiement = {};
			}, function () {
			});
		};

		var ModalInstanceCtrl = function ($scope, $modalInstance, object) {

			$scope.paiement = object;
			if (object.card)
				$scope.cardSelect = {
					id: object.card,
					vehicule: object.vehicule
				};

			$scope.datec = new Date(object.datec);


			$scope.cardAutoComplete = function (val) {
				return $http.post('api/europexpress/card/autocomplete', {
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

			$scope.refreshVehicule = function () {
				$scope.paiement.vehicule = this.cardSelect.vehicule;
				$scope.paiement.card = this.cardSelect.id;
			};

			$scope.open = function ($event) {
				$event.preventDefault();
				$event.stopPropagation();

				$scope.opened = true;
			};


			$scope.ok = function () {
				$modalInstance.close($scope.paiement);
			};

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
		};


		/*
		 * NG-GRID for courses sous-traitant list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'paiements',
			enableRowSelection: false,
			sortInfo: {fields: ["datec"], directions: ["desc"]},
			filterOptions: $scope.filterOptions,
			//$location.path('ticket/'+rowItem.entity._id); //ouvre le ticket
			showGroupPanel: false,
			//jqueryUIDraggable: true,
			i18n: 'fr',
			enableColumnResize: true,
			//groups: ['fournisseur.name'],
			//groupsCollapsedByDefault: false,
			columnDefs: [
				{field: 'card', displayName: 'Carte'},
				{field: 'vehicule.name', displayName: 'Véhicule'},
				{field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'qty', displayName: 'Volume (l)', cellClass: "align-right", cellFilter: "number:0"},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"},
				{displayName: '', width: "30px", cellTemplate: '<div class="ngCellText"><button class="icon-pencil" title="Editer" ng-click="edit(row)"></button></div>'}
			]
		};

	}]);

angular.module('mean.europexpress').controller('EEMouvementStockController', ['$scope', 'pageTitle', '$routeParams', '$http', '$location', '$timeout', function ($scope, pageTitle, $routeParams, $http, $location, $timeout) {
		$scope.radio = {entrepot: undefined};

		var typeMove_list = {
			"type": "select",
			"enable": true,
			"default": "130",
			"status": true,
			"label": "Type",
			"values": {
				"010": {
					"enable": true,
					"label": "Surf. dediee",
					"cssClass": "grey-gradient",
					"billing": "month"
				},
				"020": {
					"enable": true,
					"label": "Stock. etageres",
					"cssClass": "grey-gradient",
					"billing": "month"
				},
				"030": {
					"enable": true,
					"label": "Surf. palette",
					"cssClass": "grey-gradient",
					"billing": "month"
				},
				"040": {
					"enable": true,
					"label": "Surf. annexe PUDO",
					"cssClass": "grey-gradient",
					"billing": "month"
				},
				"110": {
					"enable": true,
					"label": "Entrée PUDO",
					"cssClass": "green-gradient",
					"billing": "clic"
				},
				"120": {
					"label": "Sortie PUDO",
					"enable": true,
					"cssClass": "blue-gradient",
					"billing": "clic"
				},
				"130": {
					"enable": true,
					"label": "Entrée FSL",
					"cssClass": "green-gradient",
					"billing": "clic"
				},
				"140": {
					"label": "Sortie FSL",
					"enable": true,
					"cssClass": "blue-gradient",
					"billing": "clic"
				},
				"100": {
					"enable": true,
					"label": "GIDR",
					"cssClass": "orange-gradient",
					"billing": "clic"
				},
				"141": {
					"enable": true,
					"label": "Deplac. Astreinte FSL",
					"cssClass": "red-gradient",
					"billing": "clic"
				},
				"122": {
					"label": "Astr. samedi matin PUDO",
					"enable": true,
					"cssClass": "red-gradient",
					"billing": "clic"
				},
				"142": {
					"label": "Astr. samedi matin FSL",
					"enable": true,
					"cssClass": "red-gradient",
					"billing": "clic"
				},
				"210": {
					"enable": true,
					"label": "Forf. ouv. Samedi",
					"cssClass": "grey-gradient",
					"billing": "month"
				},
				"220": {
					"enable": true,
					"label": "Forf. Astreinte",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"310": {
					"enable": true,
					"label": "Clic prep. 1-15",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"312": {
					"enable": true,
					"label": "Clic prep. 16-30",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"313": {
					"enable": true,
					"label": "Clic prep. +31",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"320": {
					"enable": true,
					"label": "Clic badge",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"330": {
					"enable": true,
					"label": "Tps gestion. clic = 1/2h",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"340": {
					"enable": true,
					"label": "Inventaires au clic",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"341": {
					"enable": true,
					"label": "Inventaire au forfait",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"350": {
					"enable": true,
					"label": "Destruction palette",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"319": {
					"enable": true,
					"label": "PFP Conditionnement",
					"cssClass": "grey-gradient",
					"billing": "clic"
				},
				"360": {
					"enable": true,
					"label": "Entrée palette/colis",
					"cssClass": "grey-gradient",
					"billing": "clic"
				}
			}
		};

		$scope.productsBarCode = {};
		$scope.productsTab = [];

		$scope.today = function () {
			var d = new Date();
			d.setHours(0, 0, 0);
			$location.path('module/europexpress/mouvementstock.html/' + (d.getMonth()) + '/' + d.getFullYear());
		};

		$scope.next = function () {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 12) {
				year++;
				month = 0;
			}
			month++;

			$location.path('module/europexpress/mouvementstock.html/' + month + '/' + year);
		};

		$scope.previous = function () {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 1) {
				year--;
				month = 13;
			}
			month--;

			$location.path('module/europexpress/mouvementstock.html/' + month + '/' + year);
		};

		$scope.month = $routeParams.id1 + '/' + $routeParams.id2;

		function numberFormat(number, width) {
			if (isNaN(number))
				number = 0;
			return new Array(width + 1 - (number + '').length).join('0') + number;
		}

		function initProducts() {
			$http({method: 'GET', url: 'api/product', params: {
					withNoPrice: 1,
					barCode: 1
				}
			}).
					success(function (data, status) {
						$scope.products = data;
						for (var i = 0; i < data.length; i++) {
							$scope.productsBarCode[data[i]._id] = data[i];
						}
					});
		}

		function getTotaux(cb) {
			var totaux = {};

			if ($routeParams.id1 == null)
				return;

			$http({method: 'GET', url: 'api/europexpress/stock/total/' + $routeParams.id1 + '/' + $routeParams.id2
			}).
					success(function (data, status) {
						for (var i in data) {
							totaux[data[i]._id] = data[i].total;
						}
						//console.log(totaux);
						cb(totaux);
					});
		}

		$scope.entrepotsList = function () {
			if ($routeParams.id1 == null)
				return $scope.today();

			initProducts();
			//getTotaux();

			$scope.entrepots = [];

			$http({method: 'GET', url: 'api/product/storehouse'
			}).success(function (entrepot, status) {
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
						$scope.entrepots.push(stock);
					}

				}
			});
		};

		$scope.find = function () {
			getTotaux(function (totaux) {
				$scope.productsTab = [];
				angular.forEach($scope.radio.entrepot.productId, function (code) {
					var product = angular.copy($scope.productsBarCode[code]);
console.log(product);
					if (product == null)
						return;

					product.barCode = $scope.radio.entrepot.barCode + product.barCode;
					product.qty = totaux[product.barCode];

					product.typeMove = {};

					product.typeMove.id = product.barCode.slice(-3);
					if (typeMove_list.values[product.typeMove.id]) {
						product.typeMove.name = typeMove_list.values[product.typeMove.id].label;
						product.typeMove.css = typeMove_list.values[product.typeMove.id].cssClass;
					} else { // Value not present in extrafield
						product.typeMove.name = product.typeMove.id;
						product.typeMove.css = "";
					}

					//console.log(product);
					$scope.productsTab.push(product);
				});
			});
		};

		$scope.update = function (row) {
			console.log(row);
			
			if (!row.entity.qtyAdd) {
			//	console.log("pas de quantite");
				return;
			}
			
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			var d = new Date();

			if (d.getMonth() + 1 != parseInt($routeParams.id1)) { // ce n'est pas dans le meme mois
				// on utilise alors le dernier jour du mois
				d = new Date($routeParams.id2, $routeParams.id1, 0);
			}

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function () {
					$http({method: 'POST', url: 'api/europexpress/stock', data: {
							barCode: row.entity.barCode,
							qty: row.entity.qtyAdd,
							datec: d
						}
					}).success(function (data, status) {
						//console.log(data);
						if (!row.entity.qty)
							row.entity.qty = 0;

						row.entity.qty += data.qty;
						row.entity.qtyAdd = null;
					});
					$scope.save.pending = false;
				}, 500);
			}
		};

		/*
		 * NG-GRID for mouvement de stock list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'productsTab',
			enableRowSelection: false,
			sortInfo: {fields: ["ref"], directions: ["asc"]},
			filterOptions: $scope.filterOptions,
			showGroupPanel: false,
			//jqueryUIDraggable: true,
			//plugins: [new ngGridFlexibleHeightPlugin()],
			i18n: 'fr',
			enableCellSelection: true,
			enableCellEditOnFocus: true,
			enableColumnResize: true,
			//groups: ['fournisseur.name'],
			//groupsCollapsedByDefault: false,
			columnDefs: [
				//	{field: ' fournisseur.name', width: "25%", displayName: 'Sous-traitant', cellTemplate: '<div class="ngCellText"><a ng-href="/api/europexpress/buy/pdf/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: '_id', displayName: 'id', visible: false, enableCellEdit: false},
				{field: 'typeMove.name', displayName: 'Ref', enableCellEdit: false, cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy " ng-class="row.getProperty(\'typeMove.css\')">{{row.getProperty(\'typeMove.name\')}}</small></div>'},
				{field: 'ref', displayName: 'Ref Produit', enableCellEdit: false},
				{field: 'barCode', displayName: 'Code barre', enableCellEdit: false},
				{field: 'billingMode', displayName: 'Mode fact.', enableCellEdit: false},
				{field: 'label', displayName: 'Description', enableCellEdit: false},
				{field: 'qty', displayName: 'Quantité total', cellClass: "align-right", enableCellEdit: false},
				{field: 'qtyAdd', displayName: 'Ajouter', enableCellEdit: true, editableCellTemplate: '<input type="number" step="0.01" ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-blur="update(row)"/>', }
				//	{field: 'Status.name', width: "11%", displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
				//	{field: 'date_enlevement', width: "15%", displayName: 'Date d\'enlevement', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"},
				//	{field: 'total_soustraitant', width: "20%", displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"}
			]
		};



	}]);

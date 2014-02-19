angular.module('mean.europexpress').controller('EEPlanningController', ['$scope', '$routeParams', '$location', '$route', 'Global', '$http', 'EEPlanning', function($scope, $routeParams, $location, $route, Global, $http, Object) {
		$scope.global = Global;
		$scope.showEdit = {};

		$scope.cpt = 0;
		$scope.hsupp = 0;

		$scope.dateDay = function(day) {
			var year = parseInt($routeParams.id2);
			var week = parseInt($routeParams.id1);

			var d = new Date(year, 0, 0);

			d.setDate(d.getDate() + ((week - 1) * 7) - 1 + day);

			return d;

		}

		$scope.find = function() {
			if ($routeParams.id1 == null)
				return $scope.today();

			//console.log($routeParams);
			Object.query({week: $routeParams.id1, year: $routeParams.id2}, function(tournees) {
				$scope.tournees = tournees;
				$scope.cpt = $scope.tournees.length;

				// somme des heures Supp de la semaine
				for (var i = 0; i < $scope.cpt; i++)
					$scope.hsupp += tournees[i].hSupp;
			});
		};

		$scope.enableEdit = function(id) {
			$scope.showEdit[id] = true;
		};

		$scope.today = function() {
			var d = new Date();
			d.setHours(0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			var week = Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7).toString();
			$location.path('module/europexpress/planning.html/' + week + '/' + d.getFullYear());
		};

		$scope.next = function() {
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

		$scope.previous = function() {
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

		$scope.disableEdit = function() {
			for (var i in $scope.showEdit)
				$scope.showEdit[i] = false;
		};

		/**
		 * AutoComplete User Driver
		 */

		$scope.driverAutoComplete = function(val) {
			return $http.post('api/user/name/autocomplete', {
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

		/**
		 * AutoComplete Sous-Traitant
		 */

		$scope.subcontractorAutoComplete = function(val) {
			return $http.post('api/societe/autocomplete?fournisseur=SUBCONTRACTOR', {
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

		$scope.update = function(id) {
			var article = $scope.aday;

			article.$update(function() {
				$route.reload();
				//$location.path('articles/' + article._id);
			});
		};

		$scope.findOne = function(id) {
			Object.get({
				planningId: id
			}, function(aday) {
				$scope.aday = aday;
			});
		};

		$scope.refresh = function() {
			/*angular.element('#refresh').confirm({
			 message: 'Are you really really sure?',
			 onConfirm: function()
			 {
			 /* Custom code here */

			// Return false to prevent default action
			/*	return false;
			 }
			 });*/

			$http({method: 'POST', url: 'api/europexpress/planning/refresh', data: {
					year: $routeParams.id2,
					week: $routeParams.id1}
			}).
					success(function(data, status) {
				$route.reload();
			}).
					error(function(data, status) {
				console.log("Request failed");
			});

		};

		$scope.disableRefresh = function() {
			var d = new Date();
			d.setHours(0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			var todayWeek = Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7).toString();

			var year = parseInt($routeParams.id2);
			var week = parseInt($routeParams.id1);

			return (year < d.getFullYear() || week < todayWeek);
		};

		/* $scope.create = function() {
		 var article = new Articles({
		 title: this.title,
		 content: this.content
		 });
		 article.$save(function(response) {
		 $location.path("articles/" + response._id);
		 });
		 
		 this.title = "";
		 this.content = "";
		 };
		 
		 $scope.remove = function(article) {
		 article.$remove();  
		 
		 for (var i in $scope.articles) {
		 if ($scope.articles[i] == article) {
		 $scope.articles.splice(i, 1);
		 }
		 }
		 };
		 
		 $scope.find = function() {
		 Articles.query(function(articles) {
		 $scope.articles = articles;
		 });
		 };
		 
		 $scope.findOne = function() {
		 Articles.get({
		 articleId: $routeParams.articleId
		 }, function(article) {
		 $scope.article = article;
		 });
		 };*/
	}]);

angular.module('mean.europexpress').controller('EETourneeController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EEPlanning', function($scope, $routeParams, $location, $route, Global, Object) {
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
				parameterMap: function(options, operation) {
					if (operation !== "read" && options.models) {
						return {models: kendo.stringify(options.models)};
					}
				}
			},
			error: function(e) {
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

		$scope.clientDropDownEditor = function(container, options) {
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
		}
	}]);

angular.module('mean.europexpress').controller('EETransportController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EETransport', function($scope, $routeParams, $location, $route, Global, Object) {
		$scope.global = Global;

		var crudServiceBaseUrl = "api/europexpress/courses";

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
				parameterMap: function(options, operation) {
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
			error: function(e) {
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
		$scope.kendoEdit = function(e) {
			//console.log(e);
			e.container.find('label[for="from"]').hide();
			e.container.find('label[for="to"]').hide();
			e.container.find('label[for="total_soustraitant"]').hide();
			e.container.find('label[for="total_soustraitant"]').hide();
			//e.container.find('div[data-container-for="from"]').hide();
			e.container.find('label[for="undefined"]').hide();
			e.container.find('.button-group').hide();
		};

		$scope.dateTimeEditor = function(container, options) {
			$('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '" data-format="' + options.format + '"/>')
					.appendTo(container)
					.kendoDateTimePicker({});
		};

		$scope.clientDropDownEditor = function(container, options) {
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

		$scope.fournisseurDropDownEditor = function(container, options) {
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

		$scope.typeDropDownEditor = function(container, options) {
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

		$scope.societeFilter = function(element) {
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
		};

	}]);

angular.module('mean.europexpress').controller('EETransportEditController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EETransport', '$http', '$timeout', function($scope, $routeParams, $location, $route, Global, Object, $http, $timeout) {
		$scope.global = Global;

		$scope.cancel = function() {
			$location.path('module/europexpress/transport.html');
		};

		$scope.update = function(id) {
			var course = $scope.course;

			course.$update(function() {
				$location.path('module/europexpress/transport.html');
			});
		};

		$scope.findOne = function() {
			Object.get({
				id: $routeParams.id
			}, function(course) {
				$scope.course = course;
				$scope.refreshContact();
				$timeout(function() {
					angular.element('select').change();
				}, 300);
			});
		};

		$scope.$watch('course.datec', function(date)
		{
			var time = new Date(date);
			if (new Date($scope.dateC).getTime() != time.getTime())
				$scope.dateC = time;
		});

		$scope.$watch('course.date_enlevement', function(date)
		{
			if (date == null)
				return;
			var time = new Date(date);
			if (new Date($scope.dateEnlevement).getTime() != time.getTime())
				$scope.dateEnlevement = time;
		});

		$scope.$watch('course.date_livraison', function(date)
		{
			if (date == null)
				return;
			var time = new Date(date);
			if (new Date($scope.dateLivraison).getTime() != time.getTime())
				$scope.dateLivraison = time;
		});

		$scope.$watch('course.ETA.date', function(date)
		{
			if (date == null)
				return;
			var time = new Date(date);
			if (new Date($scope.ETADate).getTime() != time.getTime())
				$scope.ETADate = time;
		});

		$scope.selectType = function() {
			$http({method: 'GET', url: 'api/europexpress/courses/type/select'
			}).
					success(function(data, status) {
				$scope.types = data;
			});
		};

		$scope.selectStatus = function() {
			$http({method: 'GET', url: 'api/europexpress/courses/status/select'
			}).
					success(function(data, status) {
				$scope.status = data;
			});
		};

		$scope.selectTarifs = function() {
			$http({method: 'GET', url: 'api/europexpress/courses/tarif/select'
			}).
					success(function(data, status) {
				$scope.tarifs = data;
			});
		};

		$scope.clientAutoComplete = function(val) {
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

		$scope.fournisseurAutoComplete = function(val) {
			return $http.post('api/societe/autocomplete?fournisseur=SUBCONTRACTOR', {
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

		$scope.refreshContact = function() {
			if ($scope.course.client.id == null) {
				$scope.contacts = [];
				return;
			}

			$http({method: 'GET', url: 'api/societe/contact/select', params: {
					societe: $scope.course.client.id}
			}).
					success(function(data, status) {
				$scope.contacts = data;
				$timeout(function() {
					angular.element('select').change();
				}, 300);
			});
		};

		$scope.calculPrice = function() {
			if ($scope.course.type.id !== "MESSAGERIE")
				return;

			if (!$scope.course.poids || !$scope.course.to.zip)
				return;

			$http({method: 'GET', url: 'api/product', params: {
					price_level: $scope.course.client.price_level.toUpperCase(),
					ref: "MESS" + $scope.course.to.zip.substr(0, 2),
					qty: $scope.course.poids
				}
			}).
					success(function(data, status) {
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

angular.module('mean.europexpress').controller('EEStockController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EEPlanning', function($scope, $routeParams, $location, $route, Global, Object) {
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
					complete: function(e) {
						$("#grid").data("kendoGrid").dataSource.read();
					}
				},
				parameterMap: function(options, operation) {
					if (operation !== "read" && options.models) {
						return {models: kendo.stringify(options.models)};
					}
				}
			},
			error: function(e) {
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

		$scope.statusDropDownEditor = function(container, options) {
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


		$scope.dateTimeEditor = function(container, options) {
			$('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '" data-format="' + options.format + '"/>')
					.appendTo(container)
					.kendoDateTimePicker({});
		};

		$scope.societeDropDownEditor = function(container, options) {
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

		$scope.textareaEditor = function(container, options) {
			$('<textarea rows="5" cols="30" style="vertical-align:top;" data-bind="value: ' + options.field + '"></textarea>').appendTo(container);
		};

		$scope.userDropDownEditor = function(container, options) {
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

angular.module('mean.europexpress').controller('EEVehiculeController', ['$scope', '$routeParams', '$location', '$route', '$upload', '$http', '$domUtilityService', 'Global', 'EEVehicule', function($scope, $routeParams, $location, $route, $upload, $http, $domUtilityService, Global, Object) {
		$scope.global = Global;

		$scope.form = {};

		$scope.findOne = function() {
			Object.get({
				id: $routeParams.id
			}, function(vehicule) {
				$scope.vehicule = vehicule;

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": vehicule._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				$http({method: 'GET', url: 'api/europexpress/buy', params:
							{
								find: {"vehicule.id": vehicule._id},
								fields: "title ref datec Status total_ht"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.requestBuy = data;

					$scope.TotalBuy = 0;
					angular.forEach($scope.requestBuy, function(row) {
						if (row.Status.id == "PAYED")
							$scope.TotalBuy += row.total_ht;
					});
					$scope.countBuy = $scope.requestBuy.length;
				});

			});
		};

		var iconsFilesList = {};

		/**
		 * Get fileType for icon
		 */
		$scope.getFileTypes = function() {
			$http({method: 'GET', url: 'dict/filesIcons'
			}).
					success(function(data, status) {
				if (status == 200) {
					iconsFilesList = data;
				}
			});
		};


		$scope.addNote = function() {
			if (!$scope.note)
				return

			$http({method: 'POST', url: 'api/europexpress/vehicules/note', data: {
					id: $scope.vehicule._id,
					note: $scope.note
				}
			}).
					success(function(data, status) {
				if (status == 200) {
					$scope.vehicule.notes.push(data);
					$scope.note = "";
				}
			});
		};

		$scope.addEntretien = function(id) {
			$http({method: 'POST', url: 'api/europexpress/vehicules/entretien', data: {
					id: $scope.vehicule._id,
					desc: $scope.form.desc,
					date: $scope.form.date,
					km: $scope.form.km
				}
			}).
					success(function(data, status) {
				if (status == 200) {
					$scope.vehicule.entretiens.push(data);
					$scope.vehicule.kms = data.km;
					$scope.form = {};
				}
			});
		};

		$scope.onFileSelect = function($files) {
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
					}).progress(function(evt) {
						console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
					}).success(function(data, status, headers, config) {
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

		$scope.suppressFile = function(id, fileName, idx) {
			$http({method: 'DELETE', url: 'api/europexpress/vehicules/file/' + id + '/' + fileName
			}).
					success(function(data, status) {
				if (status == 200) {
					$scope.vehicule.files.splice(idx, 1);
				}
			});
		};

		$scope.fileType = function(name) {
			if (typeof iconsFilesList[name.substr(name.lastIndexOf(".") + 1)] == 'undefined')
				return iconsFilesList["default"];

			return iconsFilesList[name.substr(name.lastIndexOf(".") + 1)];
		};

		$scope.countDown = function(date, reverse) {
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

angular.module('mean.europexpress').controller('EEFacturationController', ['$scope', '$routeParams', '$http', '$location', function($scope, $routeParams, $http, $location) {

		$scope.find = function() {
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
			}).success(function(data, status) {
				if (status == 200) {
					$scope.result = data;

					$scope.countCourses = data.courses.length;
					$scope.countCoursesST = data.courses.length;
					$scope.TotalCourses = 0;
					$scope.TotalCoursesST = 0;
					angular.forEach(data.courses, function(row) {
						$scope.TotalCourses += row.total_ht;
						$scope.TotalCoursesST += row.total_soustraitant;
					});


				}
			});

		};

		$scope.today = function() {
			var d = new Date();
			d.setHours(0, 0, 0);
			$location.path('module/europexpress/facturation.html/' + (d.getMonth() + 1) + '/' + d.getFullYear());
		};

		$scope.next = function() {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 12) {
				year++;
				month = 0;
			}
			month++;

			$location.path('module/europexpress/facturation.html/' + month + '/' + year);
		};

		$scope.previous = function() {
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

		$scope.gridOptionsCourses = {
			data: 'result.courses',
			enableRowSelection: false,
			sortInfo: {fields: ["client.cptBilling.name"], directions: ["asc"]},
			filterOptions: $scope.filterOptionsCourses,
			//$location.path('ticket/'+rowItem.entity._id); //ouvre le ticket
			showGroupPanel: false,
			//jqueryUIDraggable: true,
			i18n: 'fr',
			groups: ['client.cptBilling.name'],
			groupsCollapsedByDefault: false,
			columnDefs: [
				{field: 'client.cptBilling.name', width: "25%", displayName: 'Client', cellTemplate: '<div class="ngCellText"><a ng-href="/api/europexpress/buy/pdf/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', width: "25%", displayName: 'Id'},
				{field: 'Status.name', width: "11%", displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
				{field: 'date_enlevement', width: "15%", displayName: 'Date d\'enlevement', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"},
				{field: 'total_ht', width: "20%", displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"}
			],
			aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
					"    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.totalChildren()}} {{entryMaybePlural(row)}} {{row.label CUSTOM_FILTERS}}</span> <span class=\"red strong\">Total HT: {{aggFunc(row,'total_ht') | euro}}</span></span>" +
					"    <div class=\"{{row.aggClass()}}\"></div>" +
					"</div>" +
					""
		};

		$scope.aggFunc = function(row, idx) {
			var total = 0;
			//console.log(row);
			angular.forEach(row.children, function(cropEntry) {
				total += cropEntry.entity[idx];
			});
			return total.toString();
		};
		$scope.entryMaybePlural = function(row) {
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
			data: 'result.courses',
			enableRowSelection: false,
			sortInfo: {fields: ["fournisseur.name"], directions: ["asc"]},
			filterOptions: $scope.filterOptionsCoursesST,
			//$location.path('ticket/'+rowItem.entity._id); //ouvre le ticket
			showGroupPanel: false,
			//jqueryUIDraggable: true,
			i18n: 'fr',
			groups: ['fournisseur.name'],
			groupsCollapsedByDefault: false,
			columnDefs: [
				{field: 'fournisseur.name', width: "25%", displayName: 'Sous-traitant', cellTemplate: '<div class="ngCellText"><a ng-href="/api/europexpress/buy/pdf/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', width: "25%", displayName: 'Id'},
				{field: 'Status.name', width: "11%", displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
				{field: 'date_enlevement', width: "15%", displayName: 'Date d\'enlevement', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"},
				{field: 'total_soustraitant', width: "20%", displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right"}
			],
			aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
					"    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.totalChildren()}} {{entryMaybePlural(row)}} {{row.label CUSTOM_FILTERS}}</span> <span class=\"red strong\">Total HT: {{aggFunc(row,'total_soustraitant') | euro}}</span></span>" +
					"    <div class=\"{{row.aggClass()}}\"></div>" +
					"</div>" +
					""
		};


	}]);
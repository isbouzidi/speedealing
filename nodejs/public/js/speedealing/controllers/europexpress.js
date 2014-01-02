angular.module('mean.europexpress').controller('EEPlanningController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EEPlanning', function($scope, $routeParams, $location, $route, Global, Object) {
		$scope.global = Global;
		$scope.showEdit = {};

		$scope.cpt = 0;

		$scope.find = function() {
			if ($routeParams.id1 == null)
				return $scope.today();

			//console.log($routeParams);
			Object.query({week: $routeParams.id1, year: $routeParams.id2}, function(tournees) {
				$scope.tournees = tournees;
				$scope.cpt = $scope.tournees.length;
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
			var week = parseInt($routeParams.id1)
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
			var week = parseInt($routeParams.id1)
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

		$scope.driverAutoCompleteEditor = {
			minLength: 1,
			dataTextField: "name",
			dataValueField: "id",
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
		};

		$scope.sousTraitantAutoCompleteEditor = {
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
						Mond_mode: {editable: true, defaultValue: {id:"NONE", name:""}},
						Mond_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Mond_panier: {editable: true, defaultValue: []},
						Tues_mode: {editable: true, defaultValue: {id:"NONE", name:""}},
						Tues_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Tues_panier: {editable: true, defaultValue: []},
						Wedn_mode: {editable: true, defaultValue: {id:"NONE", name:""}},
						Wedn_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Wedn_panier: {editable: true, defaultValue: []},
						Thur_mode: {editable: true, defaultValue: {id:"NONE", name:""}},
						Thur_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Thur_panier: {editable: true, defaultValue: []},
						Frid_mode: {editable: true, defaultValue: {id:"NONE", name:""}},
						Frid_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Frid_panier:{editable: true, defaultValue: []},
						Satu_mode:{editable: true, defaultValue: {id:"NONE", name:""}},
						Satu_hNuit: {editable: true, type: "number", defaultValue: 0, validation: {min: 0}},
						Satu_panier:{editable: true, defaultValue: []}
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
				minLength : 1,
				placeholder: "Sélectionner les paniers...",
				autoBind: true,
				//dataTextField: "name",
				//dataValueField: "id",
				dataSource:{
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
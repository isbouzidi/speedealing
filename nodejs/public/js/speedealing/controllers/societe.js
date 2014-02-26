angular.module('mean.societes').controller('SocieteListController', ['$scope', '$location','pageTitle', 'Societes', function($scope, $location,pageTitle, Societe) {
		
		pageTitle.setTitle('Liste des sociétés');
		
		$scope.types = [{name: "Client/Prospect", id: "CUSTOMER"},
			{name: "Fournisseur", id: "SUPPLIER"},
			{name: "Sous-traitants", id: "SUBCONTRATOR"},
			{name: "Non determine", id: "SUSPECT"}];

		$scope.type = {name: "Client/Prospect", id: "CUSTOMER"};


		$scope.create = function() {
			var societe = new Societe({
				title: this.title,
				content: this.content
			});
			societe.$save(function(response) {
				$location.path("societe/" + response._id);
			});

			this.title = "";
			this.content = "";
		};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.update = function() {
			var societe = $scope.societe;

			societe.$update(function() {
				$location.path('societe/' + societe._id);
			});
		};

		$scope.find = function() {
			Societe.query({query: this.type.id}, function(societes) {
				$scope.societes = societes;
				$scope.countSocietes = societes.length;
			});
		};

		$scope.findOne = function() {
			Societe.get({
				Id: $routeParams.Id
			}, function(societe) {
				$scope.societe = societe;
			});
		};

		/*
		 * NG-GRID for societe list
		 */

		$scope.filterOptionsSociete = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsSociete = {
			data: 'societes',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsSociete,
			sortInfo: {fields: ["name"], directions: ["asc"]},
			plugins: [new ngGridFlexibleHeightPlugin()],
			i18n: 'fr',
			columnDefs: [
				{field: 'name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societe/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'commercial_id.name', displayName: 'Commerciaux', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
				{field: 'zip', displayName: 'Code Postal'},
				{field: 'town', displayName: 'Ville'},
				{field: 'idprof3', displayName: 'APE'},
				{field: 'Tag', displayName: 'Catégories', cellTemplate: '<div class="ngCellText"><small ng-repeat="category in row.getProperty(col.field)" class="tag anthracite-gradient glossy small-margin-right">{{category}}</small></div>'},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'prospectLevel.name', displayName: 'Potentiel', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'prospectLevel.css\')}} glossy">{{row.getProperty(\'prospectLevel.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};

		/**
		 * Highcharts Pie
		 */

		$scope.pieChartConfig = {
			options: {
				chart: {
					margin: 0,
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false
				},
				legend: {
					layout: "vertical", backgroundColor: Highcharts.theme.legendBackgroundColor || "#FFFFFF", align: "left", verticalAlign: "bottom", x: 0, y: 20, floating: true, shadow: true,
					enabled: false
				},
				tooltip: {
					enabled: true,
					formatter: function() {
						return '<b>' + this.point.name + '</b>: ' + Math.round(this.percentage*100)/100 + ' %';
					}
				},
				navigator: {
					margin: 30
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: true,
							color: '#FFF',
							connectorColor: '#FFF',
							distance: 30,
							formatter: function() {
								return '<b>' + this.point.name + '</b><br> ' + Math.round(this.percentage) + ' %';
							}
						}
					}
				}
			},
			title: {
				text: null
			},
			series: [{
					type: "pie",
					name: "Quantité",
					size: 100,
					data: [{"name": "Client -3 mois", "y": 4, "sliced": true, "selected": true}, ["Client fid\u00e8le", 6], ["Client r\u00e9current", 3], ["Prospect chaud", 5], ["Prospect froid", 8], ["Ne pas contacter", 3]]
				}]
		};


	}]);
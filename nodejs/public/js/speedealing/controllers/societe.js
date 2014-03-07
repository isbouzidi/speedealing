angular.module('mean.societes').controller('SocieteListController', ['$scope', '$location', '$http', 'pageTitle', 'Global', 'Societes', function($scope, $location, $http, pageTitle, Global, Societe) {

		pageTitle.setTitle('Liste des sociétés');
		initCharts();

		$scope.types = [{name: "Client/Prospect", id: "CUSTOMER"},
			{name: "Fournisseur", id: "SUPPLIER"},
			{name: "Sous-traitants", id: "SUBCONTRACTOR"},
			{name: "Non determine", id: "SUSPECT"},
			{name: "Tous", id:"ALL"}];

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
				//$location.path('societe/' + societe._id);
			});
		};

		$scope.find = function() {
			Societe.query({query: this.type.id}, function(societes) {
				$scope.societes = societes;
				$scope.countSocietes = societes.length;
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
			//showFilter:true,
			i18n: 'fr',
			columnDefs: [
				{field: 'name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
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

		function initCharts() {
			$http({method: 'GET', url: '/core/ajax/viewgraph.php?json=graphPieStatus&class=Societe'
			}).success(function(data, status) {
				console.log(data);
				$scope.pieChartConfig.series[0] = {
					data: data,
					type: "funnel",
					name: "Quantité",
					//size: 100
				};
			});

			$http({method: 'GET', url: '/core/ajax/viewgraph.php', params: {
					json: "graphBarStatus",
					class: "Societe",
					name: Global.user.name
				}
			}).success(function(data, status) {
				console.log(data);
				$scope.barChartConfig.series = [];


				$scope.barChartConfig.series[0] = {
					data: data,
					name: "admin"
				};
			});
		}


		/**
		 * Highcharts Pie
		 */

		$scope.pieChartConfig = {
			options: {
				chart: {
					type: 'funnel',
					//margin: 0,
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					marginRight: 120
				},
				legend: {
					enabled: false
				},
				tooltip: {
					enabled: true,
					formatter: function() {
						return '<b>' + this.point.name + '</b>: ' + Math.round(this.percentage * 100) / 100 + ' %';
					}
				},
				//navigator: {
				//	margin: 30
				//},
				plotOptions: {
					/*pie: {
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
					 },*/
					series: {
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b> ({point.y:,.0f})',
							color: '#FFF',
							connectorColor: '#FFF',
							softConnector: true
						},
						neckWidth: '30%',
						neckHeight: '25%'

								//-- Other available options
								// height: pixels or percent
								// width: pixels or percent
					}
				}
			},
			title: {
				text: null
			},
			series: []
		};

		$scope.barChartConfig = {
			options: {
				chart: {
					renderTo: 'bar-status',
					defaultSeriesType: "column",
					zoomType: "x",
					marginBottom: 30
				},
				credits: {
					enabled: false
				},
				xAxis: {
					categories: ['Ne pas contacter', 'Non déterminé', 'Prospect froid', 'Prospect chaud', 'Client -3 mois', 'Client récurrent', 'Client fidèle'],
					maxZoom: 1
							//labels: {rotation: 90, align: "left"}
				},
				yAxis: {
					title: {text: "Total"},
					allowDecimals: false,
					min: 0
				},
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'top',
					x: -5,
					y: 5,
					floating: true,
					borderWidth: 1,
					backgroundColor: Highcharts.theme.legendBackgroundColor || '#FFFFFF',
					shadow: true
				},
				tooltip: {
					enabled: true,
					formatter: function() {
						//return this.point.name + ' : ' + this.y;
						return '<b>' + this.x + '</b><br/>' +
								this.series.name + ': ' + this.y;
					}
				}
			},
			title: {
				//text: "<?php echo $langs->trans("SalesRepresentatives"); ?>"
				text: null
			},
			series: []
		};


	}]);

angular.module('mean.societes').controller('SocieteViewController', ['$scope', '$location', '$http', '$routeParams', 'pageTitle', 'Global', 'Societes', function($scope, $location, $http, $routeParams, pageTitle, Global, Societe) {
		pageTitle.setTitle('Fiche société');
		$scope.vehicule={};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.update = function() {
			var societe = $scope.societe;

			societe.$update(function() {
				//$location.path('societe/' + societe._id);
			});
		};

		$scope.findOne = function() {
			Societe.get({
				Id: $routeParams.id
			}, function(societe) {
				$scope.societe = societe;
				pageTitle.setTitle('Fiche ' + $scope.societe.name);
			});
		};


	}]);
angular.module('mean.societes').controller('SocieteController', ['$scope', '$location', '$http', '$routeParams', '$modal', 'pageTitle', 'Global', 'Societes', function($scope, $location, $http, $routeParams, $modal, pageTitle, Global, Societe) {

		pageTitle.setTitle('Liste des sociétés');

		$scope.types = [{name: "Client/Prospect", id: "CUSTOMER"},
			{name: "Fournisseur", id: "SUPPLIER"},
			{name: "Sous-traitants", id: "SUBCONTRACTOR"},
			{name: "Non determine", id: "SUSPECT"},
			{name: "Tous", id: "ALL"}];

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
				pageTitle.setTitle('Fiche ' + societe.name);
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
				Id: $routeParams.id
			}, function(societe) {
				$scope.societe = societe;
				pageTitle.setTitle('Fiche ' + $scope.societe.name);
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

		$scope.initCharts = function() {
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

		$scope.addNew = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/societes/create.html',
				controller: "SocieteCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function(societe) {
				$scope.societes.push(societe);
				$scope.countSocietes++;
			}, function() {
			});
		};


	}]);

angular.module('mean.societes').controller('SocieteCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Societes', function($scope, $http, $modalInstance, $upload, $route, Global, Societes) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.validSiret = false;
		$scope.societe = {};
		$scope.siretFound = "";

		$scope.isActive = function(idx) {
			if (idx == $scope.active)
				return "active";
		};

		$scope.next = function() {
			$scope.active++;
		};

		$scope.previous = function() {
			$scope.active--;
		};

		$scope.goto = function(idx) {
			if ($scope.active == 5)
				return;

			if (idx < $scope.active)
				$scope.active = idx;
		};

		$scope.init = function() {
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
				//console.log(data);
				$scope.societe.Status = data.default;
			});
			
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "fournisseur"
				}
			}).success(function(data, status) {
				$scope.fournisseur = data;
				//console.log(data);
				$scope.societe.fournisseur = "NO";
			});
			
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "prospectlevel"
				}
			}).success(function(data, status) {
				$scope.potential = data;
				//console.log(data);
				$scope.societe.prospectlevel = data.default;
			});
			
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "typent_id"
				}
			}).success(function(data, status) {
				$scope.typent = data;
				//console.log(data);
				$scope.societe.typent_id = data.default;
			});
			
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "effectif_id"
				}
			}).success(function(data, status) {
				$scope.effectif = data;
				//console.log(data);
				$scope.societe.effectif_id = data.default;
			});
			
			$scope.societe.commercial_id = {
				id : Global.user._id,
				name : Global.user.firstname + " " + Global.user.lastname
			}
			
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "forme_juridique_code"
				}
			}).success(function(data, status) {
				$scope.forme_juridique = data;
				//console.log(data);
				$scope.societe.forme_juridique_code = data.default;
			});
			
			$scope.societe.price_level = "BASE";
			$scope.societe.capital = 0;
		};
		
		$scope.create = function() {
			var societe = new Societes(this.societe);
			societe.$save(function(response) {
				//console.log(response);
				$modalInstance.close(response);
				//$location.path("societe/" + response._id);
			});
		};

		
		$scope.userAutoComplete = function(val) {
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
		
		$scope.priceLevelAutoComplete = function(val) {
			return $http.post('api/product/price_level/autocomplete', {
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

		$scope.isValidSiret = function() {
			var siret = $scope.societe.idprof2;
			$scope.siretFound = "";
			$scope.societe.idprof1 = "";

			var isValide;
			if (!siret || siret.length != 14 || isNaN(siret))
				isValide = false;
			else {
				// Donc le SIRET est un numérique à 14 chiffres
				// Les 9 premiers chiffres sont ceux du SIREN (ou RCS), les 4 suivants
				// correspondent au numéro d'établissement
				// et enfin le dernier chiffre est une clef de LUHN. 
				var somme = 0;
				var tmp;
				for (var cpt = 0; cpt < siret.length; cpt++) {
					if ((cpt % 2) == 0) { // Les positions impaires : 1er, 3è, 5è, etc... 
						tmp = siret.charAt(cpt) * 2; // On le multiplie par 2
						if (tmp > 9)
							tmp -= 9;	// Si le résultat est supérieur à 9, on lui soustrait 9
					}
					else
						tmp = siret.charAt(cpt);
					somme += parseInt(tmp);
				}
				if ((somme % 10) == 0) {
					isValide = true; // Si la somme est un multiple de 10 alors le SIRET est valide 
					$scope.societe.idprof1 = siret.substr(0,9);
				} else {
					isValide = false;
				}
			}

			if (isValide)
				$http({method: 'GET', url: '/api/societe/uniqId', params: {
						idprof2: siret
					}
				}).success(function(data, status) {
					$scope.validSiret = isValide;
					if (data.name) { // already exist
						$scope.siretFound = data;
					}
				});
			else 
				$scope.validSiret = isValide;
		};
	}]);
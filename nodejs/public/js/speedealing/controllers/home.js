angular.module('mean.system').controller('IndexHomeController', ['$scope', '$location', '$http', 'Global', 'pageTitle', function($scope, $location, $http, Global, pageTitle) {
		$scope.global = Global;

		pageTitle.setTitle('Accueil');

		$scope.dateNow = new Date();
		$scope.userConnection = [];
		$scope.indicateurs = {};
		$scope.familles = {};

		if (Global.user.url) {
			return $location.path(Global.user.url.substr(2)); // Go to default url
		}

		$scope.connection = function() {
			$http({method: 'GET', url: 'api/user/connection'
			}).success(function(users, status) {
				$scope.userConnection = users;
			});
		};

		$scope.indicateur = function() {
			$scope.indicateurs.hsupp = 0;
			$scope.indicateurs.abs = 0;

			$http({method: 'GET', url: 'api/user/absence/count'
			}).success(function(cpt, status) {
				$scope.indicateurs.abs = cpt.sum;
			});

			$http({method: 'GET', url: 'api/europexpress/planning/countHSupp'
			}).success(function(cpt, status) {
				$scope.indicateurs.hsupp = cpt.sum;
			});
		};

		$scope.familleCA = function() {
			$http({method: 'GET', url: 'api/europexpress/courses/stats'
			}).success(function(ca, status) {
				//console.log(ca);
				$scope.familles = ca;
			});
		};

		$scope.initCharts = function() {
			$http({method: 'GET', url: '/api/europexpress/billing/ca', params: {
					name: Global.user.name,
					entity: Global.user.entity
				}
			}).success(function(data, status) {
				$scope.caChartConfig.series = data;
			});
		}

		$scope.caChartConfig = {
			options: {
				chart: {
					type: 'spline',
					zoomType: "x",
					marginBottom: 20
				},
				credits: {
					enabled: false
				},
				xAxis: {
					categories: ['Jan', 'Fev', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec'],
					maxZoom: 1
							//labels: {rotation: 90, align: "left"}
				},
				yAxis: {
					title: {text: "Total HT"},
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
				labels: {
					items: [{
							html: 'Répartition du CA par famille',
							style: {
								left: '85px',
								top: '-10px',
								color: 'white'
							}
						}]
				},
				tooltip: {
					enabled: true,
					formatter: function() {
						if (this.point.name) // the pie chart
							return '<b>' + this.point.name + '</b>' +
									' : ' + Math.round(this.y);

						else
							return '<b>' + this.x + '</b><br/>' +
									this.series.name + ' : ' + Math.round(this.y);
					}
				}
			},
			title: {
				text: null
			},
			series: []
		};


	}]);
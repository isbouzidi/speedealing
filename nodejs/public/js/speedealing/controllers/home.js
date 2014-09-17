angular.module('mean.system').controller('IndexHomeController', ['$scope', '$rootScope', '$modal', '$location', '$http', '$anchorScroll', 'Global', 'pageTitle', '$timeout', 'Users', 'Reports', function ($scope, $rootScope, $modal, $location, $http, $anchorScroll, Global, pageTitle, $timeout, Users, Reports) {
		$scope.global = Global;

		pageTitle.setTitle('Accueil');

		$scope.dateNow = new Date();
		$scope.userConnection = [];
		$scope.indicateurs = {};
		$scope.limitReport = 0;
		$scope.isTaskRealised = false;

		$scope.familles = {
			//	prev : {},
			//	real : {}
		};
		$scope.total_ca = {
			prev: 0,
			real: 0
		};

		$scope.total_cost = {
			prev: 0,
			real: 0
		};

		$scope.months = new Array("Janv.", "Fév.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.");

		$scope.thisMonth = $scope.months[new Date().getMonth()];
		$scope.lastMonth = $scope.months[new Date().getMonth() - 1];

		if (Global.user.url) {
			return $location.path(Global.user.url.substr(2)); // Go to default url
		}

		$scope.connection = function () {
			$http({method: 'GET', url: 'api/user/connection', params: {entity: Global.user.entity}
			}).success(function (users, status) {
				$scope.userConnection = users;
			});
		};

		$scope.indicateur = function () {
			$scope.indicateurs.hsupp = 0;
			$scope.indicateurs.abs = 0;

			$http({method: 'GET', url: 'api/user/absence/count'
			}).success(function (cpt, status) {
				$scope.indicateurs.abs = cpt.sum;
			});

			$http({method: 'GET', url: 'api/europexpress/planning/countHSupp'
			}).success(function (cpt, status) {

				$scope.indicateurs.hsupp = cpt;
			});
		};

		$scope.indicatorHSupp = function () {
			if (!$scope.indicateurs.hsupp[0])
				return 0;

			//var d = new Date();
			//var oldHSupp = $scope.indicateurs.hsupp[0] / new Date(d.getFullYear(), d.getMonth(), 0).getDate();
			//console.log(oldHSupp);

			return ($scope.indicateurs.hsupp[1] - $scope.indicateurs.hsupp[0]) / $scope.indicateurs.hsupp[0] * 100;
		};

		$scope.familleCA = function () {
			/*$http({method: 'GET', url: 'api/europexpress/billing/ca'
			 }).success(function(ca, status) {
			 console.log(ca);
			 $scope.familles.prev = ca;
			 });*/

			$http({method: 'GET', url: 'api/bill/caFamily'
			}).success(function (ca, status) {
				//console.log(ca);
				$scope.familles = ca;

				$scope.total_ca.real = 0;
				angular.forEach(ca, function (data) {
					$scope.total_ca.real += data.total_ht;
				});

			});
		};

		$scope.familleCOST = function () {
			/*$http({method: 'GET', url: 'api/europexpress/billing/ca'
			 }).success(function(ca, status) {
			 console.log(ca);
			 $scope.familles.prev = ca;
			 });*/

			$http({method: 'GET', url: 'api/billSupplier/costFamily'
			}).success(function (cost, status) {
				//console.log(ca);
				$scope.famillesCost = cost;

				$scope.total_cost.real = 0;
				angular.forEach(cost, function (data) {
					$scope.total_cost.real += data.total_ht;
				});

			});
		};

		$scope.initCharts = function () {
			$http({method: 'GET', url: '/api/europexpress/billing/ca', params: {
					name: Global.user.name,
					entity: Global.user.entity
				}
			}).success(function (data, status) {
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
				yAxis: [{// Primary yAxis
						title: {text: "Total produits HT"},
						allowDecimals: false,
						min: 0
					},
					{// Secondary yAxis
						gridLineWidth: 0,
						title: {
							text: 'Total CA HT',
							style: {
								color: '#4572A7'
							}
						},
						allowDecimals: false,
						min: 0,
						labels: {
							/*formatter: function() {
							 return this.value +' k';
							 },*/
							style: {
								color: '#4572A7'
							}
						},
						opposite: true

					}],
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'top',
					x: -65,
					y: -10,
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
					formatter: function () {
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

		$scope.findAbsences = function () {
			Users.absences.query({query: 'NOW', entity: Global.user.entity}, function (absences) {
				$scope.absences = absences;
			});
		};

		$scope.absenceAddTick = function (user) {
			user.closed = true;
			//console.log(user);
			user.$update();
			$scope.absences.splice($scope.absences.indexOf(user), 1);
		};

		$scope.late = function (date) {
			if (new Date(date) <= new Date)
				return "red";
		};

		$scope.findReports = function () {

			$scope.limitReport = $scope.limitReport + 10;

			$http({method: 'GET', url: '/api/reports/listReports', params: {
					user: Global.user._id,
					entity: Global.user.entity,
					limit: $scope.limitReport
				}
			}).success(function (data, status) {
				$scope.reports = data;
			});
		};

		$scope.showReport = function (id) {

			$rootScope.idReport = id;
			var modalInstance = $modal.open({
				templateUrl: '/partials/reports/fiche.html',
				controller: "ReportController",
				windowClass: "steps"
			});
		};

		$scope.findTasks = function () {
			$http({method: 'GET', url: '/api/reports/listTasks', params: {
					user: Global.user._id
				}
			}).success(function (data, status) {
				$scope.listTasks = data;
			});
		};

		$scope.taskRealised = function (id) {

			$http({method: 'PUT', url: '/api/reports/TaskRealised', params: {
					id: id
				}
			}).success(function (status) {
				$scope.findTasks();
				$scope.isTaskRealised = true;
				$scope.idTaskRealised = id;

				$scope.timer = $timeout(function () {

					$scope.isTaskRealised = false;
				}, 5000);
			});

		};

		$scope.cancelTaskReealised = function () {

			$timeout.cancel($scope.timer);

			$http({method: 'PUT', url: '/api/reports/cancelTaskRealised', params: {
					id: $scope.idTaskRealised
				}
			}).success(function (status) {
				$scope.findTasks();
				$scope.isTaskRealised = false;
			});
		};
	}]);
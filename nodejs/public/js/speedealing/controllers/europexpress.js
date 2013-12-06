angular.module('mean.europexpress').controller('EEPlanningController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'EEPlanning', function($scope, $routeParams, $location, $route, Global, Object) {
		$scope.global = Global;
		$scope.showEdit = {};

		$scope.cpt = 0;

		$scope.find = function() {
			if($routeParams.id1 == null)
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
			$location.path('europexpress/planning/' + week + '/' + d.getFullYear());
		};

		$scope.next = function() {
			var year = parseInt($routeParams.id2);
			var week = parseInt($routeParams.id1)
			if (week === 52) {
				year++;
				week = 0;
			}
			week++;
			
			console.log('europexpress/planning/' + week + '/' + year);

			$location.path('europexpress/planning/' + week + '/' + year);
		};
		
		$scope.previous = function() {
			var year = parseInt($routeParams.id2);
			var week = parseInt($routeParams.id1)
			if (week === 1) {
				year--;
				week = 53;
			}
			week--;

			$location.path('europexpress/planning/' + week + '/' + year);
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
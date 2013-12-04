angular.module('mean.europexpress').controller('EEPlanningController', ['$scope', '$routeParams', '$location', 'Global', 'EEPlanning', function($scope, $routeParams, $location, Global, Object) {
		$scope.global = Global;
		$scope.showEdit = {};
		
		$scope.cpt = 0;

		$scope.find = function() {
			//console.log($routeParams);
			Object.query({week: $routeParams.id1, year: $routeParams.id2}, function(tournees) {
				$scope.tournees = tournees;
				$scope.cpt = $scope.tournees.length;
			});
		};

		$scope.enableEdit = function(id) {
			$scope.showEdit[id] = true;
		};

		$scope.isCollapsed = false;

		/*$scope.week = function() {
			var d = new Date();
			d.setHours(0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7).toString() + '/' + d.getFullYear();
		};*/
		
		$scope.week = $routeParams.id1 + '/' + $routeParams.id2;

		$scope.disableEdit = function() {
			for(var i in $scope.showEdit)
				$scope.showEdit[i] = false;
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
		 
		 $scope.update = function() {
		 var article = $scope.article;
		 if (!article.updated) {
		 article.updated = [];
		 }
		 article.updated.push(new Date().getTime());
		 
		 article.$update(function() {
		 $location.path('articles/' + article._id);
		 });
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
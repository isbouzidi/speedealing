angular.module('mean.europexpress').controller('EEPlanningController', ['$scope', '$routeParams', '$location', 'Global', 'Articles', function($scope, $routeParams, $location, Global, Articles) {
		$scope.global = Global;
		$scope.showEdit = {};

		$scope.phones = [
			{'_id': 1,
				'name': 'Nexus S',
				'snippet': 'Fast just got faster with Nexus S.'},
			{'_id': 2,
				'name': 'Motorola XOOM™ with Wi-Fi',
				'snippet': 'The Next, Next Generation tablet.'},
			{'_id': 3,
				'name': 'MOTOROLA XOOM™',
				'snippet': 'The Next, Next Generation tablet.'}
		];

		$scope.cpt = $scope.phones.length;

		$scope.enableEdit = function(id) {
			$scope.showEdit[id] = true;
		};
		
		$scope.isCollapsed = false;

		$scope.week = week();
				
		function week() {
			var d = new Date();
			d.setHours(0, 0, 0);
			d.setDate(d.getDate() + 4 - (d.getDay() || 7));
			return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
		};

		$scope.disableEdit = function(id) {
			$scope.showEdit[id] = false;
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
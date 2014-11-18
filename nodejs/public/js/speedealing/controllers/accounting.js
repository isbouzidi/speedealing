"use strict";
/* global angular: true */

angular.module('mean.accounting').controller('AccountingController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Accounting', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Accounting) {

		pageTitle.setTitle('Journal des ventes');
		$scope.editable = false;

		var months = new Array("Janv.", "Fév.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.");

		$scope.month = months[parseInt($routeParams.id1) - 1] + ' ' + $routeParams.id2;
		$scope.params = {
			month: parseInt($routeParams.id1),
			year: parseInt($routeParams.id2)
		};

		$scope.gridOptions = {};
		$scope.journal = [];
		$scope.sum = {
			debit: 0,
			credit: 0
		};

		$scope.today = function() {
			var d = new Date();
			d.setHours(0, 0, 0);
			$location.path('module/accounting/index.html/' + (d.getMonth()) + '/' + d.getFullYear());
		};

		$scope.find = function() {
			if ($routeParams.id1 == null)
				return $scope.today();

			$scope.sum = {
				debit: 0,
				credit: 0
			};
			
			$scope.editable = false;

			Accounting.query({entity: Global.user.entity, year: parseInt($routeParams.id2), month: parseInt($routeParams.id1)}, function(journal) {
				$scope.journal = journal;
				$scope.count = journal.length;

				angular.forEach(journal, function(data) {
					$scope.sum.credit += data.credit;
					$scope.sum.debit += data.debit;
					if(data.compte == null)
						$scope.editable=true;
				});

			});
		};

		$scope.next = function() {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 12) {
				year++;
				month = 0;
			}
			month++;

			$location.path('module/accounting/index.html/' + month + '/' + year);
		};

		$scope.previous = function() {
			var year = parseInt($routeParams.id2);
			var month = parseInt($routeParams.id1);

			if (month === 1) {
				year--;
				month = 13;
			}
			month--;

			$location.path('module/accounting/index.html/' + month + '/' + year);
		};


		/*
		 * NG-GRID for bill list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'journal',
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			//sortInfo: {fields: ["datec"], directions: ["asc"]},
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			rowTemplate: '<div style="height: 100%" ng-class="{\'orange-bg\': (row.getProperty(\'compte\') == null || row.getProperty(\'compte\') == \'\')}"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
					'<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
					'<div ng-cell></div>' +
					'</div></div>',
			columnDefs: [
				{field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'journal', displayName: 'Journal'},
				{field: 'compte', displayName: 'Compte'},
				{field: 'piece', displayName: 'Numero de pièce', cellClass: "align-right"},
				{field: 'libelle', displayName: 'Libelle', width: "300px"},
				{field: 'debit', displayName: 'Débit', cellFilter: "currency", cellClass: "align-right"},
				{field: 'credit', displayName: 'Crédit', cellFilter: "currency", cellClass: "align-right"},
				{field: 'monnaie', displayName: 'Monnaie', width: "80px"}
			]
		};

	}]);

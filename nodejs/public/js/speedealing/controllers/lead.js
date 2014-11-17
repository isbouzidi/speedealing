"use strict";
/* global angular: true */

angular.module('mean.lead').controller('LeadCreateController', ['$scope', '$http', '$modalInstance', 'Global', 'Lead', 'object', function ($scope, $http, $modalInstance, Global, Lead, object) {

		$scope.global = Global;

		$scope.dict = {};

		$scope.lead = {
			entity: Global.user.entity,
			societe: {
				name: object.societe.name,
				id: object.societe.id
			}
		};

		$scope.init = function () {
			var dict = ['fk_lead_status', 'fk_lead_type', 'fk_prospectlevel'];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict,
				}
			}).success(function (data, status) {
				$scope.dict = data;
			});
		};

		$scope.createLead = function () {

			var lead = new Lead(this.lead);

			lead.$save(function (response) {
				$modalInstance.close(response);

			});

		};

		$scope.open = function ($event) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened = true;
		};


	}]);
angular.module('mean.lead').controller('LeadController', ['$scope', '$http', '$routeParams', '$modal', '$filter', 'dialogs', 'pageTitle', 'Global', 'object', 'Lead', function ($scope, $http, $routeParams, $modal, $filter, $dialogs, pageTitle, Global, object, Lead) {

		$scope.findOne = function () {

			Lead.get({
				Id: object.lead
			}, function (lead) {
				$scope.lead = lead;
			});
		};
	}]);
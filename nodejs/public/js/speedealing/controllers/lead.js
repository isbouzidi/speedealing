angular.module('mean.lead').controller('LeadCreateController', ['$scope', '$http', '$modalInstance', 'Global', 'Lead','object', function($scope, $http, $modalInstance, Global, Lead, object) {

		$scope.global = Global;

		$scope.lead = {
			entity : Global.user.entity,
			societe: {
				name: object.societe.name,
				id: object.societe.id
			}
		};

		$scope.init = function() {

			$http({method: 'GET', url: '/api/report/fk_extrafields/lead', params: {
					field: "Status"
				}
			}).success(function(data) {

				$scope.status = data;
			});

		};

		$scope.createLead = function() {

			var lead = new Lead(this.lead);

			lead.$save(function(response) {
				$modalInstance.close(response);

			});

		};

	}]);
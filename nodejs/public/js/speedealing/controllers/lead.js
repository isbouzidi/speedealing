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
			var fields = [
                "Status", 
                "type"
            ];
            
            angular.forEach(fields, function(field) {
                $http({method: 'GET', url: 'api/lead/fk_extrafields/select', params: {
                        field: field
                    }
                }).success(function(data) {
                    
                    $scope[field] = data;
                });
            });

			

			$http({method: 'GET', url: '/api/lead/dict/select', params: {
                field: "prospectlevel"
            }
            }).success(function(data) {

                $scope.potential = data;

            });
		};

		$scope.createLead = function() {

			var lead = new Lead(this.lead);

			lead.$save(function(response) {
				$modalInstance.close(response);

			});

		};

}]);
angular.module('mean.lead').controller('LeadController', ['$scope', '$http', '$routeParams', '$modal', '$filter', 'dialogs', 'pageTitle', 'Global', 'object', 'Lead', function($scope, $http, $routeParams, $modal, $filter, $dialogs, pageTitle, Global, object, Lead) {
        
    $scope.findOne = function(){
            
            Lead.get({
                Id: object.lead
            }, function(lead) {
                $scope.lead = lead;
            });
        };
	}]);
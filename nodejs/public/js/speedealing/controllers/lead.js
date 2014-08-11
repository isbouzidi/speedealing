angular.module('mean.lead').controller('LeadCreateController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$modalInstance', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Lead', function($scope, $location, $http, $routeParams, $modal, $modalInstance, $filter, $upload, $timeout, pageTitle, Global, Lead) {

    $scope.global = Global;

    $scope.init = function() {

        $scope.leads= {}; 
        $http({method: 'GET', url: '/api/report/dict_fk/select', params: {
                field: "prospectlevel"
            }
        }).success(function(data) {

            $scope.potential = data;

        });
        
        $http({method: 'GET', url: '/api/report/fk_extrafields/lead', params: {
                        field: "Status"
                    }
                }).success(function(data) {
                    
                    $scope.status = data;
                });

    };
    
    $scope.createLead = function(){
        
        $scope.leads.societe = {
            name: $scope.global.contactNameSociete,
            id: $scope.global.contactIdSociete
        };

        var lead = new Lead(this.leads);

        lead.$save(function(response) {
            $modalInstance.close(response);
            
         });

    };
    
}]);
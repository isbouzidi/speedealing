angular.module('mean.reports').controller('ReportController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Reports', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Reports) {
    
        $scope.global = Global;
}]);

angular.module('mean.reports').controller('ReportCreateController', ['$scope', '$http', '$modalInstance', '$modal', '$upload', '$route', 'Global', 'Reports', function($scope, $http, $modalInstance, $modal, $upload, $route, Global, Reports) {

    $scope.global = Global;
    $scope.report = {}
    $scope.init = function(){
        $scope.items = [{
                id: 'DISCOVERY',
                name: 'Découverte'},
            {
                id: 'PRE-SIGN',
                name: 'Pré-Signature'},
            {
                id: 'Contract',
                name: 'Suivi/Contrat Signé'
            }];   
    };
    
    $scope.addNewContact = function() {
        
            var modalInstance = $modal.open({
                    templateUrl: '/partials/contacts/create.html',
                    controller: "ContactCreateController",
                    windowClass: "steps"
            });

            modalInstance.result.then(function(contacts) {
                    $scope.contacts.push(contacts);
                    $scope.countContact++;
            }, function() {
            });
    };
    
    $scope.updateReportTemplate = function(){
        
        var category = $scope.report.category.id;
        
        switch(category){
            case 'DISCOVERY' :
                $scope.report.template = "/partials/reports/discovery.html";
                break;
            case 'PRE-SIGN':
                $scope.report.template = "/partials/reports/pre-sign.html";
                break;
            case 'Contract':
                $scope.report.template = "/partials/reports/contract.html";
                break;
            default : 
                $scope.report.template = "";
        };
    };
}]);
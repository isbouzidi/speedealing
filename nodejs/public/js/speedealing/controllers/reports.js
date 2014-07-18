angular.module('mean.reports').controller('ReportController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Reports', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Reports) {

        $scope.global = Global;
    }]);

angular.module('mean.reports').controller('ReportCreateController', ['$scope', '$http', '$modalInstance', '$modal', '$upload', '$route', 'Global', 'Reports', function($scope, $http, $modalInstance, $modal, $upload, $route, Global, Reports) {

        $scope.global = Global;
        $scope.report = {};
        $scope.report.contacts = [];
        
        
        $scope.init = function() {
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

        $scope.updateReportTemplate = function() {

            var category = $scope.report.category.id;

            switch (category) {
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
            }
            ;
        };

        $scope.contactAutoComplete = function(val) {
            
            return $http.post('api/report/autocomplete', {
                val: val
            }).then(function(res) {
                //console.log(res.data);

                return res.data;
            });

        };
        
        $scope.addContact = function(){
            
            var add = {
                    id: $scope.report.contact._id, 
                    name: $scope.report.contact.name, 
                    poste: $scope.report.contact.poste
                };
            
            $scope.report.contacts.push(add);
            $scope.report.contact = "";
            console.log($scope.report);
        };
        
        $scope.delete = function($index){
            
            $scope.report.contacts.splice($index, 1);
        };
            
    }]);
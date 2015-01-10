angular.module('mean.vehicule').controller('VehiculeController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Vehicule', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, Vehicule) {

        $scope.global = Global;

        $scope.init = function () {
            
        };

        $scope.find = function () {

            Vehicule.query(function (vehicule) {
                $scope.vehicule = vehicule;
                $scope.count = vehicule.length;
            });
        };

        $scope.filterOptionsVehicule = {
            filterText: "",
            useExternalFilter: false
        };
        $scope.gridOptions = {
            data: 'vehicule',
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            filterOptions: $scope.filterOptionsVehicule,
            columnDefs: [
                {field: 'immat', displayName: 'Immatriculation', cellTemplate: '<div class="ngCellText"><a ng-click="findVehicule(row.getProperty(\'_id\'))" class="with-tooltip" data-tooltip-options=\'{"position":"right"}\'><span class="icon-plane"></span> {{row.getProperty(col.field)}}</a></div>'},
                {field: 'desc', displayName: 'Déscription'},
                {field: 'affectation.name', displayName: 'Affectation'},
                {field: 'date_CT', displayName: 'Date controle', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'kms', displayName: 'Km actuel'},
                {field: 'kmLastRev', displayName: 'Km dernier controle'},
                {field: 'date_mise_circu', displayName: 'Date 1ere circulation', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'badgeAuto', displayName: 'Badge autoroute'},
                {field: 'phone', displayName: 'Telephone'},
                {field: 'gazoilCard', displayName: 'Carte gasoil'},
                {field: 'gazoilCardPIN', displayName: 'code carte gasoil'},
                {field: 'StatGeoloc', displayName: 'Géolocalisation'}
            ]
        };

        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/vehicule/create.html',
                controller: "VehiculeCreateController",
                windowClass: "steps"
            });

            modalInstance.result.then(function (vehicule) {
                $scope.vehicule.push(vehicule);
                $scope.count++;
            }, function () {
            });
        };
        
        $scope.findVehicule = function (id) {
            $routeParams.vehicule = id;
            var modalInstance = $modal.open({
                templateUrl: '/partials/vehicule/fiche.html',
                controller: "VehiculeController",
                windowClass: "steps"
            });
        };
        
        $scope.findOne = function () {
            
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "EuropExpress"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                    
            });
            
            Vehicule.get({
                Id: $routeParams.vehicule
            }, function (vehicule) {
                $scope.vehicule = vehicule;
            });
        };
        
        $scope.update = function () {

            var vehicule = $scope.vehicule;

            vehicule.$update(function () {
                
            }, function (errorResponse) {
            });
        };
    }]);

angular.module('mean.vehicule').controller('VehiculeCreateController', ['$scope', '$location', '$http', '$routeParams', '$modalInstance', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Vehicule', function ($scope, $location, $http, $routeParams, $modalInstance, $modal, $filter, $timeout, pageTitle, Global, Vehicule) {
        
        $scope.global = Global;
        $scope.opened = [];
        $scope.active = 1;
        $scope.extrafield = {};
        $scope.vehicule = {};
        
        $scope.isActive = function(idx) {
            if (idx === $scope.active)
                return "active";
        };
        
        $scope.init = function(){                        
            
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "EuropExpress"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                    
            });
        };
        
        $scope.create = function(){
            
            if($scope.vehicule.statusVehicule.id)
                $scope.vehicule.statusVehicule = $scope.vehicule.statusVehicule.id;
            
            if($scope.affectation){
                $scope.vehicule.affectation = {};
                $scope.vehicule.affectation.id = null;
                $scope.vehicule.affectation.name = $scope.affectation;
            };                
            
            var vehicule = new Vehicule(this.vehicule);
                
            vehicule.$save(function(response) {
               $modalInstance.close(response);

            });
        };
                
        $scope.open = function ($event, idx) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.opened[idx] = true;
        };        
    }]);
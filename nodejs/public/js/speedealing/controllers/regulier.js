angular.module('mean.regulier').controller('RegulierController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Regulier', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, Regulier) {

        $scope.global = Global;
        
        $scope.filterDates = [
            {text: "3 mois", value: 90},
            {text: "Tous", value: null}
        ];
        
        $scope.filterDate = {text: "3 mois", value: 90};
        $scope.find = function () {
            
            var myDate;
            
            if($scope.filterDate.value !== null){
                myDate = new Date();
                var dayOfMonth = myDate.getDate();
                myDate.setDate(dayOfMonth - $scope.filterDate.value);
            }else{
                myDate = null;
            }
                
            var cond = {
                find: myDate
            };
            Regulier.query(cond, function (regulier) {
                $scope.regulier = regulier;
                $scope.count = regulier.length;
            });
        };

        $scope.filterOptionsRegulier = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.gridOptions = {
            data: 'regulier',
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            filterOptions: $scope.filterOptionsRegulier,
            columnDefs: [                
                {field: 'driver.name', displayName: 'Chauffeur', cellTemplate: '<div class="ngCellText"><a ng-click="findRegulier(row.getProperty(\'_id\'))" class="with-tooltip" data-tooltip-options=\'{"position":"right"}\'><span class="icon-user"></span> {{row.getProperty(col.field)}}</a></div>'},
                {field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'storehouse.name', displayName: 'Tournée'},
                {field: 'immatriculation', displayName: 'Véhicule'},
                {field: 'import', displayName: 'Import'},
                {field: 'export', displayName: 'Export'},
                {field: 'workload', displayName: 'Workload'},
                {field: 'ctrembour', displayName: 'Contre remb'}
            ]
        };
        
        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/regulier/create.html',
                controller: "RegulierCreateController",
                windowClass: "steps"
            });
            modalInstance.result.then(function (regulier) {
                $scope.regulier.push(regulier);
                $scope.count++;
            }, function () {
            });
        };
        
        $scope.findRegulier = function (id) {
            $routeParams.regulier = id;
            var modalInstance = $modal.open({
                templateUrl: '/partials/regulier/fiche.html',
                controller: "RegulierController",
                windowClass: "steps"
            });
        };
        
        $scope.findOne = function () {
            
            Regulier.get({
                Id: $routeParams.regulier
            }, function (regulier) {
                $scope.regulier = regulier;
            });
        };
        
        $scope.userAutoComplete = function (val) {
            return $http.post('api/user/name/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                return res.data;
            });
        };
        
        $scope.vehicleAutoComplete = function (val) {
            
            return $http.post('api/vehicule/autocomplete', {
                filter: val
            }).then(function (res) {
                console.log(res.data);
                return res.data;
            });
        };
        
        $scope.update = function () {

            var regulier = $scope.regulier;

            regulier.$update(function () {
                
            }, function (errorResponse) {
            });
        };
    }]); 

angular.module('mean.regulier').controller('RegulierCreateController', ['$scope', '$location', '$http', '$routeParams', '$modalInstance', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Regulier', function ($scope, $location, $http, $routeParams, $modalInstance, $modal, $filter, $timeout, pageTitle, Global, Regulier) {

        $scope.global = Global;
        $scope.active = 1;
        var regulier =  {};
        
        $scope.isActive = function(idx) {
            if (idx === $scope.active)
                return "active";
        };
        
        $scope.init = function(){
            
        };
        
        $scope.create = function(){
            if($scope.storehouse){
                $scope.regulier.storehouse = {};
                $scope.regulier.storehouse.id = null;
                $scope.regulier.storehouse.name = $scope.storehouse;
            };                
            
            var regulier = new Regulier(this.regulier);
                
            regulier.$save(function(response) {
               $modalInstance.close(response);

            });
        };
        
        $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.opened = true;
        };
        
        $scope.vehicleAutoComplete = function (val) {
            
            return $http.post('api/vehicule/autocomplete', {
                filter: val
            }).then(function (res) {
                console.log(res.data);
                return res.data;
            });
        };
        
        $scope.userAutoComplete = function (val) {
            return $http.post('api/user/name/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                return res.data;
            });
        };
    }]); 
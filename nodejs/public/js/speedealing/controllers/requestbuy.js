angular.module('mean.requestBuy').controller('RequestBuyController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'RequestBuy', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, RequestBuy) {

        $scope.global = Global;
        $scope.requestBuy = {};
        
        $scope.init = function () {

        };

        $scope.find = function () {

            RequestBuy.query(function (requestBuy) {
                $scope.requestBuy = requestBuy;
                $scope.count = requestBuy.length;
            });
        };

        $scope.filterOptionsRequestBuy = {
            filterText: "",
            useExternalFilter: false
        };
        
        $scope.gridOptions = {
            data: 'requestBuy',
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            enableColumnResize: true,
            filterOptions: $scope.filterOptionsRequestBuy,
            columnDefs: [
                {field: 'ref', displayName: 'Numéro', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-click="findRequestBuy(row.getProperty(\'_id\'))" data-tooltip-options=\'{"position":"right"}\'><span class="icon-plane"></span> {{row.getProperty(col.field)}}</a></div>'},
                {field: 'title', displayName: 'Designation'},
                {field: 'date_livraison', displayName: 'Date commande', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'fournisseur.name', displayName: 'Fournisseur'},
                {field: 'ref_fournisseur', displayName: 'Ref CMD Fournisseur'},
                {field: 'products', displayName: 'Achats', cellFilter: 'chaumeilProductFilter'},
                {field: 'total_ht', displayName: 'Montant HT'},
                {field: 'client.name', displayName: 'Client'},
                {field: 'vehicule.name', displayName: 'Véhicule'},
                {field: 'author.name', displayName: 'Demandé par'},
                {field: 'status.name', displayName: 'Etat',
                    cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')">{{row.getProperty(\'status.name\')}}</small>'
                 }
            ]
        };
        
        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/requestBuy/create.html',
                controller: "CreateRequestBuyController",
                windowClass: "steps"
            });

            modalInstance.result.then(function (requestBuy) {
                $scope.requestBuy.push(requestBuy);
                $scope.count++;
            }, function () {
            });
        };
        
        $scope.findRequestBuy = function (id) {
            $routeParams.requestBuy = id;
            var modalInstance = $modal.open({
                templateUrl: '/partials/requestBuy/fiche.html',
                controller: "RequestBuyController",
                windowClass: "steps"
            });
        };
        
        $scope.findOne = function () {
            
            RequestBuy.get({
                Id: $routeParams.requestBuy
            }, function (requestBuy) {
                $scope.requestBuy = requestBuy;
                
                if(requestBuy.products)
                    $scope.products = requestBuy.products;
            });
            
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "EuropExpress"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                    
            });
        };
        
        $scope.update = function () {
            
            var requestBuy = $scope.requestBuy;
            
            requestBuy.$update(function () {
                
            }, function (errorResponse) {
            });
        };
        
        $scope.supplierAutoComplete = function (val, field) {
            return $http.post('api/societe/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                fournisseur: ["SUPPLIER", "SUBCONTRACTOR"],
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                return res.data;
            });
        };
        
        $scope.supplierAutoComplete = function (val, field) {
            return $http.post('api/societe/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                fournisseur: ["SUPPLIER", "SUBCONTRACTOR"],
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                return res.data;
            });
        };
        
        $scope.societeAutoComplete = function (val, field) {
            return $http.post('api/societe/autocomplete', {
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
        
        $scope.vehiculeAutoComplete = function (val) {
            
            return $http.post('api/vehicule/autocomplete', {
                filter: val
            }).then(function (res) {
                
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
        
        $scope.productAutoComplete = function (val) {
            
            var products = [];
            return $http.post('api/product/ref/autocomplete?type=BUY', {
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

angular.module('mean.requestBuy').controller('CreateRequestBuyController', ['$scope', '$location', '$http', '$routeParams', '$modalInstance', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'RequestBuy', function ($scope, $location, $http, $routeParams, $modalInstance, $modal, $filter, $timeout, pageTitle, Global, RequestBuy) {
        
        $scope.global = Global;
        $scope.active = 1;
        $scope.opened = [];
        $scope.requestBuy = {};
        $scope.requestBuy.products = [];
        
        
        $scope.isActive = function(idx) {
            if (idx === $scope.active)
                return "active";
        };
        
        $scope.init = function () {
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "EuropExpress"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                    
            });
            
            $scope.requestBuy.author = {
                id: Global.user.id,
                name: Global.user.name
            };
        };
        
        $scope.create = function(){
            
            if($scope.requestBuy.Status)
                $scope.requestBuy.Status = $scope.requestBuy.Status.id;
            
            var requestBuy = new RequestBuy(this.requestBuy);
            
            requestBuy.$save(function(response) {
               $modalInstance.close(response);

            });
        };
                
        $scope.supplierAutoComplete = function (val, field) {
            return $http.post('api/societe/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                fournisseur: ["SUPPLIER", "SUBCONTRACTOR"],
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                return res.data;
            });
        };                
        
        $scope.societeAutoComplete = function (val, field) {
            return $http.post('api/societe/autocomplete', {
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
        
        $scope.vehiculeAutoComplete = function (val) {
            
            return $http.post('api/vehicule/autocomplete', {
                filter: val
            }).then(function (res) {
                
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
        
        $scope.productAutoComplete = function (val) {
            
            var products = [];
            var p = {};
            return $http.post('api/product/ref/autocomplete?type=BUY', {
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
                
        $scope.open = function ($event, idx) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.opened[idx] = true;
        };        
    }]);

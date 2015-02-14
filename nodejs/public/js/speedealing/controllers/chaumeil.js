angular.module('mean.chaumeil').controller('PlanningProdController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Chaumeil', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, Chaumeil) {

        $scope.global = Global;
        $scope.hstep = 1;
        $scope.mstep = 15;
        $scope.ismeridian = false;
        $scope.planningProd = {
            date_livraison: new Date().setHours(8,0,0,0)            
        };
        
        $scope.entity = [
            {"id": "chaumeil", "city": "Chaumeil"},
            {"id": "clermont", "city": "Clermont"}
        ];
        
        $scope.etat = [
            {id: "NEW", text : "Nouveau"},
            {id: "ENCOMPO", text : "En compo"},
            {id: "ENCOURS", text : "En cours"},
            {id: "BAT", text : "BAT en cours"},
            {id: "WAITING_PROD", text : "En attente Prod."},
            {id: "WAITING_COMM", text : "En attente Comm."},
            {id: "ACC", text : "Accueil"},
            {id: "EXP", text : "Expedié"},
            {id: "LIV", text : "Recu"},
            {id: "CANCELED", text : "Annulé"},
            {id: "REJECTED", text : "Rejeté"},
            {id: "", text : "Tous"}
        ];
        
        $scope.livraison = [
            {text: "aujourd'hui", value: 0},
            {text: "5 jours", value: 5},
            {text: "Tous", value: null}
        ];
        
        $scope.filterEtat = {id: "NEW", text : "Nouveau"};
        $scope.filterLivraison = {text: "aujourd'hui", value: 0};
                
        $scope.init = function () {

        };
        
        $scope.isDateEqual = function(date){
            
            if(date){
                var date2 = new Date();
                var date1 = new Date(date);
                var diff = {}                           // Initialisation du retour
                var tmp = date2 - date1;
             
                tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates
                diff.sec = tmp % 60;                    // Extraction du nombre de secondes
             
                tmp = Math.floor((tmp-diff.sec)/60);    // Nombre de minutes (partie entière)
                diff.min = tmp % 60;                    // Extraction du nombre de minutes
             
                tmp = Math.floor((tmp-diff.min)/60);    // Nombre d'heures (entières)
                diff.hour = tmp % 24;                   // Extraction du nombre d'heures
                 
                tmp = Math.floor((tmp-diff.hour)/24);   // Nombre de jours restants
                diff.day = tmp;
                
                if(diff.day == 0){
                    if(date2.getHours() > diff.hour){
                        return true
                    }                    
                }                
            }
            return false;                                                
        };
        
        $scope.find = function () {
            
            var myDate;
            
            if($scope.filterLivraison.value !== null){
                myDate = new Date();
                var dayOfMonth = myDate.getDate();
                myDate.setDate(dayOfMonth - $scope.filterLivraison.value);
            }else{
                myDate = null;
            }
                
            var cond = {
                findDelivery: myDate,
                findStatus: $scope.filterEtat.id
            };
            
            Chaumeil.query(cond, function (planningProd) {
                $scope.planningProd = planningProd;
                $scope.count = planningProd.length;
            });
            
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "Chaumeil"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                   
            });
        };

        $scope.filterOptionsplanningProd = {
            filterText: "",
            useExternalFilter: false
        };
        
        $scope.gridOptions = {
            data: 'planningProd',
            multiSelect: true,
            i18n: 'fr',
            enableColumnResize: true,
            filterOptions: $scope.filterOptionsplanningProd,
            columnDefs: [
                {field: 'datec', displayName: 'Date commande', cellTemplate: '<div class="ngCellText"><a ng-click="findPlannig(row.getProperty(\'_id\'))" class="with-tooltip" data-tooltip-options=\'{"position":"right"}\'><span class="icon-calendar"></span> {{row.getProperty(col.field) | date:"dd/MM/yyyy"}}</a></div>'},
                {field: 'order.name', displayName: 'Commande'},
                {field: 'order.ref_client', displayName: 'Ref client'},
                {field: 'jobTicket', displayName: 'Job ticket'},
                {field: 'societe.name', displayName: 'Societe'},
                {field: 'description', displayName: 'Déscription'},
                {field: 'qty', displayName: 'Qte'},
                {field: 'qtyPages', displayName: 'Qte copies'},
                {field: 'date_livraison', displayName: 'Livraison',cellTemplate: 
                '<div ng-class="{blue: isDateEqual(row.entity.date_livraison) }"><div class="ngCellText">{{row.getProperty(col.field)| date:"dd/MM/yyyy HH:mm"}}</div></div>'},
                {field: 'status.name', displayName: 'Etat', headerClass: "blue",
                    cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')" editable-select="row.getProperty(\'Status\')" buttons="no" e-form="StatusBtnForm" onbeforesave="updateInPlace(\'/api/chaumeil\',\'Status\', row, $data)" e-ng-options="c.id as c.text for c in etat">{{row.getProperty(\'status.name\')}}</small> <span class="icon-pencil grey" ng-click="StatusBtnForm.$show()" ng-hide="StatusBtnForm.$visible"></span></div>'
                },
                {field: 'step', displayName: 'Etape', headerClass: "blue",
                    cellTemplate: '<div class="ngCellText align-center"><span editable-select="row.getProperty(col.field)" buttons="no" e-form="StepBtnForm" onbeforesave="updateInPlace(\'/api/chaumeil\',\'step\', row, $data)" e-ng-options="s as s for s in extrafield.fields.planningStep.values">{{row.getProperty(\'step\')}}</span> <span class="icon-pencil grey" ng-click="StepBtnForm.$show()" ng-hide="StepBtnForm.$visible"></span></div>'
                }
            ]
        };
        
        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/chaumeil/create.html',
                controller: "CreatePlanningProdController",
                windowClass: "steps"
            });

            modalInstance.result.then(function (planningProd) {
                $scope.planningProd.push(planningProd);
                $scope.count++;
            }, function () {
            });
        };
        
        $scope.findPlannig = function (id) {
            $routeParams.planning = id;
            var modalInstance = $modal.open({
                templateUrl: '/partials/chaumeil/fiche.html',
                controller: "PlanningProdController",
                windowClass: "steps"
            });
        };
        
        $scope.findOne = function () {
            
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "Chaumeil"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                   
            });
            
            Chaumeil.get({
                Id: $routeParams.planning
            }, function (planningProd) {
                $scope.planningProd = planningProd;
                
            });
        };
                
        $scope.update = function () {

            var planningProd = $scope.planningProd;

            planningProd.$update(function () {
                
            }, function (errorResponse) {
            });
        };
        
        $scope.updateInPlace = function (api, field, row, newdata) {
            
            if (!$scope.save) {
                $scope.save = {promise: null, pending: false, row: null};
            }
            $scope.save.row = row.rowIndex;

            if (!$scope.save.pending) {
                $scope.save.pending = true;
                $scope.save.promise = $timeout(function () {
                    $http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
                        data: {
                            oldvalue: row.entity[field],
                            value: newdata
                        }
                    }).
                            success(function (data, status) {
                                if (status == 200) {
                                    if (data) {
                                        row.entity = data;
                                    }
                                }
                            });

                    $scope.save.pending = false;
                }, 200);
            }

            return false;
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

    }]);

angular.module('mean.chaumeil').controller('CreatePlanningProdController', ['$scope', '$location', '$http', '$routeParams', '$modalInstance', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Chaumeil', function ($scope, $location, $http, $routeParams,  $modalInstance, $modal, $filter, $timeout, pageTitle, Global, Chaumeil) {

        $scope.global = Global;
        $scope.active = 1;
        $scope.opened = [];
        $scope.planningProd = {};
        $scope.planningProd = {
            order: {
                name: null,
                id: null,
                ref_client: null
            }
        };
        $scope.hstep = 1;
        $scope.mstep = 15;
        $scope.ismeridian = false;

        $scope.isActive = function(idx) {
            if (idx === $scope.active)
                return "active";
        };
        
        $scope.entity = [
                {"id": "chaumeil", "city": "Chaumeil"},
                {"id": "clermont", "city": "Clermont"}
            ];
        
        $scope.open = function ($event, idx) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.opened[idx] = true;
        };
        
        $scope.init = function () {
            $http({method: 'GET', url: '/api/extrafield', params: {
                extrafieldName: "Chaumeil"
            }
            }).success(function (data) {
                    $scope.extrafield = data;                    
            });
            
        };
        
        $scope.create = function(){
            console.log(this.planningProd);
            var planningProd = new Chaumeil(this.planningProd);
                
            planningProd.$save(function(response) {
               $modalInstance.close(response);

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
    }]);
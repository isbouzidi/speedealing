angular.module('mean.delivery').controller('DeliveryController', ['$scope', '$q', '$location', '$http', '$routeParams', '$rootScope', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Deliveries', function($scope, $q, $location, $http, $routeParams, $rootScope, $modal, $filter, $upload, $timeout, pageTitle, Global, Deliveries) {

        pageTitle.setTitle('Liste bons de livraison');

        $scope.editable = false;

        $scope.delivery = {
            lines: [],
            notes: []
        };
        
        $scope.qty = [];
        $scope.tickets = [];
        $scope.countTicket = 0;
        $scope.deliveries = [];
        
        $scope.gridOptionsDeliveries = {};

        $scope.types = [{name: "Toutes", id: "ALL"}];

        $scope.type = {name: "Toutes", id: "ALL"};

        $scope.init = function() {
            $scope.pu=[];
            var fields = ["Status", "cond_reglement_code", "type", "mode_reglement_code"];

            angular.forEach(fields, function(field) {
                $http({method: 'GET', url: '/api/delivery/fk_extrafields/select', params: {
                        field: field
                    }
                }).success(function(data, status) {
                    $scope[field] = data;
                    //console.log(data);
                });
            });

            var fields = ["tva_tx"];


            $http({method: 'GET', url: '/api/product/fk_extrafields/select', params: {
                    field: 'tva_tx'
                }
            }).success(function(data, status) {
                $scope.tva_tx = data;

            });

        };
        $scope.productAutoComplete = function(val) {

            return $http.post('api/product/autocomplete', {
                take: 5,
                skip: 0,
                page: 1,
                pageSize: 5,
                price_level: $scope.delivery.price_level,
//                supplier: options.supplier,
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function(res) {
                return res.data;
            });
        };
        
        $scope.checkLine = function(data){
            
            if(!data)
                return "La ligne produit ne peut pas être vide";
        };
        
        $scope.addProduct = function(data, index) {
            
            //angular.copy($scope.delivery.lines[index], data);
            //$scope.delivery.lines[index] = data;
            //$scope.delivery.lines[index].pu_ht = data.price.pu_ht;
            
            
            for(var i in $scope.delivery.lines){
                if($scope.delivery.lines[i].idLine === index){
                    $scope.delivery.lines[i] = { 
                    pu_ht: data.price.pu_ht,
                    product: {
                        id: data.id,
                        name: data.name,
                        label: data.label
                    },
                    isNew: true,
                    idLine: index
                };
                }
            }
        };
        
        
        $scope.calculMontantHT = function(qty, pu, index){
            //alert('test : '+ $scope.qty[index]);
            $scope.delivery.lines[index].total_ht = qty * pu;
        };
        // filter lines to show
        $scope.filterLine = function(line) {

            return line.isDeleted !== true;
        };

        // mark line as deleted
        $scope.deleteLine = function(id) {
            var filtered = $filter('filter')($scope.delivery.lines, {idLine: id});
                if (filtered.length) {
                  filtered[0].isDeleted = true;
                }
            
//            for(var i = 0; i < $scope.delivery.lines.length; i++){
//                if($scope.delivery.lines[i].idLine === id)
//                    if($scope.delivery.lines[i].isNew)
//                        $scope.delivery.lines.splice(i, 1);
//                    else
//                        $scope.delivery.lines[i].isDeleted = true;            
//            }
        };

        // add line
        $scope.addLine = function() {
            $scope.delivery.lines.push({
                isNew: true,
                idLine: $scope.delivery.lines.length + 1
            });
        
        };

        // cancel all changes
        $scope.cancel = function() {
            for (var i = $scope.delivery.lines.length; i--; ) {
                var line = $scope.delivery.lines[i];
                // undelete
                if (line.isDeleted) {
                    delete line.isDeleted;
                }
                // remove new 
                if (line.isNew) {
                    $scope.delivery.lines.splice(i, 1);
                }
            }
            ;
        };
        
        // save edits
        $scope.saveTable = function() {


            for (var i = $scope.delivery.lines.length; i--; ) {
                var line = $scope.delivery.lines[i];
                // actually delete line
                if (line.isDeleted) {
                    $scope.delivery.lines.splice(i, 1);
                }
                // mark as not new 
                if (line.isNew) {
                    line.isNew = false;
                }

                line.total_ht = line.pu_ht * line.qty;
                line.total_tva = line.total_ht * line.tva_tx / 100;
                line.total_ttc = line.total_ht + line.total_tva;

                $scope.delivery.total_ht = $scope.delivery.total_ht + line.total_ht;
                $scope.delivery.total_ttc = $scope.delivery.total_ttc + line.total_ttc;
                
            }
            
            //send to server to update
            $scope.update();
            
        };

        $scope.listDelivries = function() {
            $location.path('/delivery');
        };

        $scope.showStatus = function(idx) {
            if (!($scope[idx] && $scope.delivery[idx]))
                return;
            var selected = $filter('filter')($scope[idx].values, {id: $scope.delivery[idx]});

            return ($scope.delivery[idx] && selected && selected.length) ? selected[0].label : 'Non défini';
        };

        $scope.remove = function(delivery) {
            delivery.$remove();

        };

        $scope.update = function() {
            var delivery = $scope.delivery;

            delivery.$update(function(response) {
                pageTitle.setTitle('Bon Livraison ' + delivery.ref);
                
                if (response.Status === "DRAFT")
                    $scope.editable = true;
                else
                    $scope.editable = false;
                
                if(response.lines){
                    for(var i in response.lines){
                        $scope.delivery.lines[i].idLine = i;
                    }
                }
            });
        };

        $scope.find = function() {
            Deliveries.query({query: this.type.id, entity: Global.user.entity}, function(deliveries) {
                $scope.deliveries = deliveries;
                $scope.countDeliveries = deliveries.length;
                
            });
        };

        $scope.clone = function() {
            $scope.delivery.$clone(function(response) {
                $location.path("deliveries/" + response._id);
            });
        };

        $scope.findOne = function() {
            Deliveries.get({
                Id: $routeParams.id
            }, function(delivery) {
                //console.log(delivery);
                $scope.delivery = delivery;
                
                //on utilise idLine pour deffinier la ligne produit que nous voulons supprimer
                for(var i in $scope.delivery.lines){
                    $scope.delivery.lines[i].idLine = i;
                };
                
                if (delivery.Status === "DRAFT")
                    $scope.editable = true;
                else
                    $scope.editable = false;

                $http({method: 'GET', url: 'api/ticket', params:
                            {
                                find: {"linked.id": delivery._id},
                                fields: "name ref updatedAt percentage Status task"
                            }
                }).success(function(data, status) {
                    if (status === 200)
                        $scope.tickets = data;

                    $scope.countTicket = $scope.tickets.length;
                });

                pageTitle.setTitle('Bon Livraison ' + $scope.delivery.ref);
            }, function(err) {
                if (err.status === 401)
                    $location.path("401.html");
            });
        };

        $scope.societeAutoComplete = function(val, field) {
            return $http.post('api/societe/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function(res) {
                return res.data;
            });
        };

        $scope.userAutoComplete = function(val) {
            return $http.post('api/user/name/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function(res) {
                return res.data;
            });
        };

        $scope.updateAddress = function(data) {
            $scope.delivery.address = data.address.address;
            $scope.delivery.zip = data.address.zip;
            $scope.delivery.town = data.address.town;

            $scope.delivery.price_level = data.price_level;

            return true;
        };


        /*
         * NG-GRID for delivery list
         */

        $scope.filterOptionsDelivery = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.gridOptionsDelivery = {
            data: 'deliveries',
            enableRowSelection: false,
            filterOptions: $scope.filterOptionsDelivery,
            sortInfo: {fields: ["ref"], directions: ["desc"]},
            //showFilter:true,
            enableColumnResize: true,
            i18n: 'fr',
            columnDefs: [
                {field: 'ref', displayName: 'Ref.', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/delivery/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
                {field: 'title.ref', displayName: 'Titre'},
                {field: 'datec', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'dater', displayName: 'Date échéance', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'client.name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'client.id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
                {field: 'commercial_id.name', displayName: 'Commercial', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
                {field: 'total_ttc', displayName: 'Total TTC', cellFilter: "currency"},
                {field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
                {field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
            ]
        };

        $scope.addNewDelivery = function() {
            var modalInstance = $modal.open({
                templateUrl: '/partials/delivery/create.html',
                controller: "DeliveryCreateController",
                windowClass: "steps"
            });

            modalInstance.result.then(function(delivery) {
                delivery = new Deliveries(delivery);
                delivery.$save(function(response) {
                    $location.path("delivery/" + response._id);
                });
            }, function() {
            });
        };

        $scope.addNewLine = function() {

            /*
             * cette variable "$rootScope.module" est utilisé dans le controller "LineController"
             * pour determiner que l'url "/partials/lines" est appelé 
             * depuis le module delivery (bon de livraison)
             */
            $rootScope.callModule = 'delivery';

            var modalInstance = $modal.open({
                templateUrl: '/partials/lines',
                controller: "LineController",
                windowClass: "steps",
                resolve: {
                    object: function() {
                        return {
                            qty: 0
                        };
                    },
                    options: function() {
                        return {
                            price_level: $scope.delivery.price_level
                        };
                    }
                }
            });

            modalInstance.result.then(function(line) {
                $scope.delivery.lines.push(line);
                $scope.delivery.$update(function(response) {
                    $scope.delivery = response;
                });
            }, function() {
            });
        };

        $scope.editLine = function(row) {
            var modalInstance = $modal.open({
                templateUrl: '/partials/lines',
                controller: "LineController",
                windowClass: "steps",
                resolve: {
                    object: function() {
                        return row.entity;
                    },
                    options: function() {
                        return {
                            price_level: $scope.delivery.price_level
                        };
                    }
                }
            });

            modalInstance.result.then(function(line) {
                $scope.delivery.$update(function(response) {
                    $scope.delivery = response;
                });
            }, function() {
            });
        };

        $scope.removeLine = function(row) {
            //console.log(row.entity._id);
            for (var i = 0; i < $scope.delivery.lines.length; i++) {
                if (row.entity._id === $scope.delivery.lines[i]._id) {
                    $scope.delivery.lines.splice(i, 1);
                    $scope.update();
                    break;
                }
            }
        };

        $scope.addNote = function() {
            if (!this.note)
                return;

            var note = {};
            note.note = this.note;
            note.datec = new Date();
            note.author = {}
            note.author.id = Global.user._id;
            note.author.name = Global.user.firstname + " " + Global.user.lastname;

            if (!$scope.delivery.notes)
                $scope.delivery.notes = [];

            $scope.delivery.notes.push(note);
            $scope.update();
            this.note = "";
        };

        /*
         * NG-GRID for delivery lines
         */

        $scope.filterOptionsLines = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.gridOptionsLines = {
            data: 'delivery.lines',
            enableRowSelection: false,
            sortInfo: {fields: ["group"], directions: ["asc"]},
            filterOptions: $scope.filterOptionsLines,
            i18n: 'fr',
            enableColumnResize: true,
            groups: ['group'],
            groupsCollapsedByDefault: false,
            rowHeight: 50,
            columnDefs: [
                {field: 'product.name', width: "50%", displayName: 'Désignation', cellTemplate: '<div class="ngCellText"><span class="blue strong icon-cart">{{row.getProperty(col.field)}}</span> - {{row.getProperty(\'product.label\')}}<pre class="no-padding">{{row.getProperty(\'description\')}}</pre></div>'},
                {field: 'group', displayName: "Groupe", visible: false},
                {field: 'qty', displayName: 'Qté', cellClass: "align-right"},
                {field: 'no_package', displayName: 'No. Colis', cellClass: "align-right"},
                {field: 'pu_ht', displayName: 'P.U. HT', cellClass: "align-right", cellFilter: "currency"},
                {field: 'tva_tx', displayName: 'TVA', cellClass: "align-right"},
                //{field: '', displayName: 'Réduc'},
                {field: 'total_ht', displayName: 'Total HT', cellFilter: "currency", cellClass: "align-right"},
                {displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button icon-pencil" title="Editer" ng-disabled="!editable" ng-click="editLine(row)"></button></button><button class="button orange-gradient icon-trash" title="Supprimer" ng-disabled="!editable" ng-click="removeLine(row)"></button></div></div>'}
            ],
            aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
                    "    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.label CUSTOM_FILTERS}}</span><br/><span class=\"anthracite strong\">Total HT: {{aggFunc(row,'total_ht') | currency}}</span></span>" +
                    "    <div class=\"{{row.aggClass()}}\"></div>" +
                    "</div>" +
                    ""
        };

        $scope.aggFunc = function(row, idx) {
            var total = 0;
            //console.log(row);
            angular.forEach(row.children, function(cropEntry) {
                if (cropEntry.entity[idx])
                    total += cropEntry.entity[idx];
            });
            return total;
        };

        /*
         * NG-GRID for ticket list
         */

        $scope.filterOptionsTicket = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.gridOptionsTicket = {
            data: 'tickets',
            enableRowSelection: false,
            sortInfo: {fields: ["updatedAt"], directions: ["desc"]},
            filterOptions: $scope.filterOptionsTicket,
            i18n: 'fr',
            enableColumnResize: true,
            columnDefs: [
                {field: 'name', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ticket/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-ticket"></span> {{row.getProperty(col.field)}}</a>'},
                {field: 'ref', displayName: 'Id'},
                {field: 'percentage', displayName: 'Etat', cellTemplate: '<div class="ngCellText"><progressbar class="progress-striped thin" value="row.getProperty(col.field)" type="success"></progressbar></div>'},
                {field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"}
            ]
        };

        $scope.updateInPlace = function(api, field, row) {
            if (!$scope.save) {
                $scope.save = {promise: null, pending: false, row: null};
            }
            $scope.save.row = row.rowIndex;

            if (!$scope.save.pending) {
                $scope.save.pending = true;
                $scope.save.promise = $timeout(function() {
                    $http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
                        data: {
                            value: row.entity[field]
                        }
                    }).
                            success(function(data, status) {
                                if (status == 200) {
                                    if (data.value) {
                                        if (data.field === "Status")
                                            for (var i = 0; i < $scope.status.length; i++) {
                                                if ($scope.status[i].id === data.value)
                                                    row.entity.Status = $scope.status[i];
                                            }
                                    }
                                }
                            });

                    $scope.save.pending = false;
                }, 500);
            }
        };

        $scope.changeStatus = function(Status) {
            $scope.delivery.Status = Status;
            $scope.update();
        };


    }]);

angular.module('mean.delivery').controller('DeliveryCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', function($scope, $http, $modalInstance, $upload, $route, Global) {
        $scope.global = Global;

        $scope.active = 1;
        $scope.delivery = {
            Status: "DRAFT"
        };

        $scope.isActive = function(idx) {
            if (idx == $scope.active)
                return "active";
        };

        $scope.next = function() {
            $scope.active++;
        };

        $scope.previous = function() {
            $scope.active--;
        };

        $scope.goto = function(idx) {
            if ($scope.active == 5)
                return;

            if (idx < $scope.active)
                $scope.active = idx;
        };

        $scope.init = function() {
            var fields = ["Status", "mode_reglement_code", "cond_reglement_code"];

            angular.forEach(fields, function(field) {
                $http({method: 'GET', url: '/api/delivery/fk_extrafields/select', params: {
                        field: field
                    }
                }).success(function(data, status) {
                    $scope[field] = data;
                    //console.log(data);
                    $scope.delivery[field] = data.default;
                });
            });

            $scope.delivery.commercial_id = {
                id: Global.user._id,
                name: Global.user.firstname + " " + Global.user.lastname
            }
        };

        $scope.create = function() {
            $modalInstance.close(this.delivery);
        };

        $scope.updateCoord = function(item, model, label) {
            //console.log(item);

            if ($scope.delivery.client.name === "Accueil")
                $scope.delivery.client.isNameModified = true;

            $scope.delivery.price_level = item.price_level;
            $scope.delivery.address = item.address.address;
            $scope.delivery.zip = item.address.zip;
            $scope.delivery.town = item.address.town;
            $scope.delivery.mode_reglement_code = item.mode_reglement_code;
            $scope.delivery.cond_reglement_code = item.cond_reglement_code;
        };

        $scope.userAutoComplete = function(val) {
            return $http.post('api/user/name/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function(res) {
                return res.data;
            });
        };

        $scope.societeAutoComplete = function(val, field) {
            return $http.post('api/societe/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function(res) {
                return res.data
            });
        };

    }]);

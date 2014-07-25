angular.module('mean.reports').controller('ReportController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Reports', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Reports) {

        $scope.global = Global;
    }]);

angular.module('mean.reports').controller('ReportCreateController', ['$scope', '$http', '$modalInstance', '$modal', '$upload', '$route', 'Global', 'Reports', function($scope, $http, $modalInstance, $modal, $upload, $route, Global, Reports) {

        $scope.global = Global;
        $scope.report = {
            duration: 1,
            contacts: [],
            products: [],
            actions: [],
            optional: {
                reports: [],
                business: {
                    reason: []
                },
                subject: {
                    deployment: [],
                    progressPoints: []
                }
            }
        };
        
        $scope.actionMethod = [];
        $scope.actionDate = [];

        $scope.init = function() {
            
            $http({method: 'GET', url: '/api/report/caFamily/select', params: {
                    field: "caFamily"
                }
            }).success(function(data) {
                $scope.products = data;
            });

            var fields = [
                "potentialAttract", 
                "model", 
                "typeAction", 
                "methodAction", 
                "typeReport", 
                "typeBusiness", 
                "stepBusiness", 
                "reasonBusiness",
                "deployment",
                "progressPoints",
                "reports"
            ];

            angular.forEach(fields, function(field) {
                $http({method: 'GET', url: '/api/report/fk_extrafields/select', params: {
                        field: field
                    }
                }).success(function(data) {
                    console.log(data);
                    $scope[field] = data;
                });
            });

        };

        $scope.productSelection = function productSelection(product) {
            var idx = $scope.report.products.indexOf(product);

            if (idx > -1) {
                $scope.report.products.splice(idx, 1);
            }

            else {
                $scope.report.products.push(product);
            }
        };

        $scope.reasonSelection = function reasonSelection(reason) {
            
            var idx = $scope.report.optional.business.reason.indexOf(reason);

            if (idx > -1) {
                $scope.report.optional.business.reason.splice(idx, 1);
            }

            else {
                $scope.report.optional.business.reason.push(reason);
            }
        };
        
        $scope.deploymentSelection = function deploymentSelection(reason) {
            
            var idx = $scope.report.optional.subject.deployment.indexOf(reason);
            
            if (idx > -1) {
                $scope.report.optional.subject.deployment.splice(idx, 1);
            }

            else {
                $scope.report.optional.subject.deployment.push(reason);
            }
        };
        
        $scope.progressPointsSelection = function progressPointsSelection(reason) {
            
            var idx = $scope.report.optional.subject.progressPoints.indexOf(reason);

            if (idx > -1) {
                $scope.report.optional.subject.progressPoints.splice(idx, 1);
            }

            else {
                $scope.report.optional.subject.progressPoints.push(reason);
            }
        };
        
        $scope.reportSelection = function reportSelection(reason) {
            
            var idx = $scope.report.optional.reports.indexOf(reason);

            if (idx > -1) {
                $scope.report.optional.reports.splice(idx, 1);
            }

            else {
                $scope.report.optional.reports.push(reason);
            }
        };
        
        $scope.actionSelection = function actionSelection(action) {
            
            var found = false;
            var idx;
            var actionObj = {};
            
            for(var i = 0; i < $scope.report.actions.length; i++) {
                if ($scope.report.actions[i].type === action) {
                    found = true;
                    $scope.report.actions.splice(i, 1);
                    $scope.actionMethod[action] = false;
                    $scope.actionDate[action] = null;
                    break;
                }
            }
            
            if(!found){
                
                actionObj = {
                  type: action
                };
                
                $scope.report.actions.push(actionObj);
            };
                
        };

        $scope.addActionMethod = function(action){
            
            for(var i = 0; i < $scope.report.actions.length; i++)
                if($scope.report.actions[i].type === action)
                    $scope.report.actions[i].method = $scope.actionMethod[action];
            
        };
        
        $scope.onDateSelected = function(e, action) {
            var datePicker = e.sender;
            $scope.selected = true;
            
            for(var i = 0; i < $scope.report.actions.length; i++)
                if($scope.report.actions[i].type === action)
                    $scope.report.actions[i].date = datePicker.value();
          };
        
        $scope.createReport = function() {
            
            $scope.report.author = {
                id: $scope.global.user._id,
                name: $scope.global.user.firstname + ' ' + $scope.global.user.lastname
            };

            $scope.report.societe = {
                name: $scope.global.contactNameSociete,
                id: $scope.global.contactIdSociete
            };
            
            $scope.report.model = $scope.report.modelTemp.label;

            var report = new Reports(this.report);
            
            report.$save(function(response) {
                $modalInstance.close(response);

            });
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
            
            var model = $scope.report.modelTemp.id;

            switch (model) {
                case 'DISCOVERY' :
                    $scope.template = "/partials/reports/discovery.html";
                    break;
                case 'PRE-SIGN':
                    $scope.template = "/partials/reports/pre-sign.html";
                    break;
                case 'CONTRACT':
                    $scope.template = "/partials/reports/contract.html";
                    break;
                default :
                    $scope.template = "";
            };
            
        };

        $scope.contactAutoComplete = function(val) {

            return $http.post('api/report/autocomplete', {
                val: val
            }).then(function(res) {

                return res.data;
            });

        };

        $scope.addContact = function() {

            var add = {
                id: $scope.report.cont._id,
                name: $scope.report.cont.name,
                poste: $scope.report.cont.poste
            };

            $scope.report.contacts.push(add);
            $scope.report.cont = "";
        };

        $scope.delete = function($index) {

            $scope.report.contacts.splice($index, 1);
        };
        
        $scope.showReason = function(){
          
            if($scope.report.optional.business.step === 'no'){
                $scope.showReasonValue = true;
            }else{
                $scope.showReasonValue = false;
                $scope.report.optional.business.reason.splice(0, $scope.report.optional.business.reason.length);
            }
            
        };
        
    }]);
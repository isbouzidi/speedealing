angular.module('mean.lead').controller('LeadCreateController', ['$scope', '$http', '$modalInstance', 'Global', 'Lead', 'object', function ($scope, $http, $modalInstance, Global, Lead, object) {

		$scope.global = Global;

		$scope.dict = {};

		$scope.lead = {
			entity: Global.user.entity,
			societe: {
				name: object.societe.name,
				id: object.societe.id
			}
		};

		$scope.init = function () {
			var dict = ['fk_lead_status', 'fk_lead_type', 'fk_prospectlevel'];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict,
				}
			}).success(function (data, status) {
				$scope.dict = data;
			});
		};

		$scope.createLead = function () {

			var lead = new Lead(this.lead);

			lead.$save(function (response) {
				$modalInstance.close(response);

			});

		};

		$scope.open = function ($event) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened = true;
		};


	}]);
angular.module('mean.lead').controller('LeadController', ['$scope', '$http', '$routeParams', '$modal', '$filter', 'dialogs', 'pageTitle', 'Global', /*'object',*/ 'Lead', function ($scope, $http, $routeParams, $modal, $filter, $dialogs, pageTitle, Global, /*object,*/ Lead) {

    $scope.global = Global;
    
    $scope.params = {
        status: null,
        "commercial": null
    };

    $scope.changeParams = function(key, value){
        $scope.params[key] = value;
    };
    
    $scope.find = function () {
        
        var dict = ["fk_stcomm", "fk_lead_status"];

        $http({method: 'GET', url: '/api/dict', params: {
                dictName: dict
            }
        }).success(function (data, status) {
            
            $scope.dict = data;
        });
        
        $http({method: 'GET', url: '/api/societe/listCommercial', params: {
             entity: Global.user.entity   
        }
        }).success(function (data, status) {
            
            $scope.commercial = data;
        });
        
        Lead.query($scope.params, function (leads) {
                $scope.leads = leads;
                $scope.count = leads.length;
                console.log(leads);
        });
    };
    
    $scope.filterOptionsLead = {
        filterText: "",
        useExternalFilter: false
    };
    $scope.gridLeads = {
        data: 'leads',
        enableRowSelection: false,
        i18n: 'fr',
        enableColumnResize: true,
        filterOptions: $scope.filterOptionsLead,
        sortInfo: {fields: ['createdAt'], directions: ['desc']},
        columnDefs: [
            {field: 'name', displayName: 'Nom', cellTemplate: '<div class="ngCellText"><a ng-click="findLead(row.getProperty(\'_id\'))" title=\'{{row.getProperty(col.field)}}\'><span class="icon-briefcase"></span> {{row.getProperty(col.field)}}</a>'},
            {field: 'societe.name', displayName: 'Société'},
            {field: 'createdAt', displayName: 'Date création', cellFilter: "date:'dd/MM/yyyy'"},
            {field: 'dueDate', displayName: 'Date échéance', cellFilter: "date:'dd/MM/yyyy'"},
            {field: 'status', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'Status.css\')}} glossy">{{row.getProperty(\'Status.name\')}}</small></div>'},
            {field: 'commercial_id.name', displayName: 'Commercial'}
        ]
    };
    
    $scope.findOne = function () {

        Lead.get({
            Id: object.lead
        }, function (lead) {
            $scope.lead = lead;
        });
    };
    
    $scope.findLead = function (id) {

        var modalInstance = $modal.open({
            templateUrl: '/partials/leads/view.html',
            controller: "LeadController",
            windowClass: "steps",
            resolve: {
                object: function () {
                    return {
                        lead: id
                    };
                }
            }
        });
    };
        
}]);
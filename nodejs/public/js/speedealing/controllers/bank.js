angular.module('mean.bank').controller('BankController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'Bank', function ($scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, Bank) {

    $scope.global = Global;
    pageTitle.setTitle('Gestion des banques');
    
    $scope.init = function(){
        
    };
    
    $scope.find = function(){
        
        Bank.query(function (bank) {
                $scope.bank = bank;
                $scope.countBank = bank.length;
        });
    };
    
    $scope.filterOptionsBank = {
			filterText: "",
			useExternalFilter: false
		};
    
    $scope.gridOptions = {
        data: 'bank',
        enableRowSelection: false,
        filterOptions: $scope.filterOptionsBank,
        enableColumnResize: true,
        i18n: 'fr',
        columnDefs: [
            {field: 'libelle', displayName: 'Compte'},
            {field: 'acc_type', displayName: 'Type'},    
            {field: 'name_bank', displayName: 'Banque'},
            {field: 'account_number', displayName: 'Numero'},
            {field: 'acc_status.name', width: '80px', displayName: 'Etat',
                cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'acc_status.css\')}} glossy">{{row.getProperty(col.field)}}</small></div>'
            },
            {field: 'initial_balance', width: '80px', displayName: 'Solde'}
        ]
};
    $scope.findOne = function(){
        
    };
    
    $scope.addNew = function(){
        var modalInstance = $modal.open({
            templateUrl: '/partials/bank/create.html',
            controller: "BankCreateController",
            windowClass: "steps"
        });

        modalInstance.result.then(function (bank) {
            $scope.user.push(bank);
            $scope.count++;
        }, function () {
        });
    };
}]);
angular.module('mean.bank').controller('BankCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Bank', function ($scope, $http, $modalInstance, $upload, $route, Global, Bank) {        

    $scope.global = Global;
    
    $scope.active = 1;
    
    $scope.init = function(){
        
        var dict = ["fk_country", "fk_currencies", "fk_account_status", "fk_account_type"];

        $http({method: 'GET', url: '/api/dict', params: {
                dictName: dict
            }
        }).success(function (data, status) {
            $scope.dict = data;
        });
    };
    
    $scope.isValidRef = function () {

        var ref = $scope.bank.ref;
        $scope.refFound = "";
        $scope.validRef = true;

        $http({method: 'GET', url: '/api/createBankAccount/uniqRef', params: {
                ref: ref
            }
        }).success(function (data, status) {

            if (data.ref) {
                $scope.refFound = data;
                
            }

        });
    };
    
    $scope.isValidLibelle = function () {

        var libelle = $scope.bank.libelle;
        $scope.libelleFound = "";
        $scope.validLibelle = true;

        $http({method: 'GET', url: '/api/createBankAccount/uniqLibelle', params: {
                libelle: libelle
            }
        }).success(function (data, status) {

            if (data.libelle) {
                $scope.libelleFound = data;
                
            }

        });
    };
    
    $scope.create = function(){
        
        var account = new Bank(this.bank);
        account.$save(function (response) {
            console.log(response);
            $modalInstance.close(response);
            //$location.path("societe/" + response._id);
        });
    };
}]);
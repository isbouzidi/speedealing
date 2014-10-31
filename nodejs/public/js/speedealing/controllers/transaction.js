angular.module('mean.transaction').controller('TransactionController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$modalInstance', '$filter', '$timeout', 'pageTitle', 'Global', 'object', 'Transaction', function ($scope, $location, $http, $routeParams, $modal, $modalInstance, $filter, $timeout, pageTitle, Global, object, Transaction) {

    $scope.global = Global;
    
    $scope.transaction = {
        value: null,
        bank: {}
    };       
    
    $scope.init = function(){
        
        if(object.bank){
        
            $scope.bank = object.bank;
            $scope.transaction_type = object.transaction_type;
            
            $http({method: 'GET', url: '/api/bankCategory', params: {
                    
                }
            }).success(function (data, status) {
                $scope.category = data;
                
            });
        }
        if(object.bill){
        
            $scope.bill = object.bill;
        
            var dict = ["fk_transaction_type", "fk_account_type", "fk_account_status"];

            $http({method: 'GET', url: '/api/dict', params: {
                dictName: dict
            }
            }).success(function (data, status) {
                $scope.dict = data;
            });

            $http({method: 'GET', url: '/api/bank', params: {

            }
            }).success(function (data, status) {
                $scope.bank = data;
            });
        }
        
    };
    
    $scope.createTransaction = function(){
        
        
        $scope.transaction.value = $scope.transaction.date_transaction;
        
        $scope.transaction.category = {
            id: $scope.transaction.category._id,
            name: $scope.transaction.category.name
        };
        
        $scope.transaction.bank = {
            id: $scope.bank._id,
            name: $scope.bank.libelle
        };
        
        $scope.saveTransaction(this.transaction);
    };
     
    $scope.regulationBill = function(){
        
        $scope.transaction.value = $scope.transaction.date_transaction;
        
        if(!$scope.transaction.description)
            $scope.transaction.description = 'Règlement client';
        
        $scope.transaction.third_party = {
            id: $scope.bill.client.id,
            name: $scope.bill.client.name
        };
        
        $scope.transaction.bill = {
            id: $scope.bill._id,
            name: $scope.bill.ref
        };
        
        $scope.saveTransaction(this.transaction);        
        
    };
    
    $scope.saveTransaction = function(transact){
        
        var transaction = new Transaction(transact);

        transaction.$save(function (response) {
            
            $modalInstance.close(response);
            
        });
        
    };
    
    $scope.open = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
    };
}]);
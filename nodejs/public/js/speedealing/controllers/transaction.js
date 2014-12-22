"use strict";
/* global angular: true */
/* jshint multistr: true */

angular.module('mean.transaction').controller('TransactionController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'object', 'Transaction', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, object, Transaction) {

        $scope.global = Global;

        $scope.transaction = {
            value: null,
            bank: {}
        };

        $scope.init = function () {

            if (object.bank) {

                $scope.bank = object.bank;
                $scope.transaction_type = object.transaction_type;

                $http({method: 'GET', url: '/api/bankCategory', params: {
                    }
                }).success(function (data, status) {
                    $scope.category = data;

                });
            }
            if (object.bill || object.bills) {

                $scope.bill = object.bill;

                var dict = ["fk_transaction_type", "fk_account_type", "fk_account_status"];

                $http({method: 'GET', url: '/api/dict', params: {
                        dictName: dict
                    }
                }).success(function (data, status) {
                    $scope.dict = data;
                });

                $http({method: 'GET', url: '/api/bank', params: {
                        entity: Global.user.entity
                    }
                }).success(function (data, status) {
                    $scope.bank = data;
                });
            }
            if (object.societe) {
                if (object.bills) {
                    $scope.bills = [];
                    $scope.bills = object.bills;
                    $scope.gridOptionsBills = {
			data: 'bills',
			enableRowSelection: false,
			sortInfo: {fields: ["createdAt"], directions: ["desc"]},
			i18n: 'fr',
			enableColumnResize: true,
			enableCellSelection: false,
			columnDefs: [
			    {field: 'ref', displayName:'Facture'},
                            {field: 'createdAt', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
                            {field: 'total_ttc', displayName: 'Montant', cellFilter: "currency:''"},
                            {field: 'amount.rest', displayName: 'Reste à encaisser', cellFilter: "currency:''"},
                            {field: 'pay', displayName: 'Règlement', 
                        cellTemplate: '<div class="ngCellText"><input type="text" style="width: 95px" ng-input=\"COL_FIELD\" ng-model=\"COL_FIELD\"></div>'}
			]
                    };
                }
            }

        };

        $scope.createTransaction = function () {


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

        $scope.regulationBill = function () {

            $scope.transaction.value = $scope.transaction.date_transaction;

            if (!$scope.transaction.description)
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
        
        $scope.regulationBills = function () {

            for(var i = 0; i < $scope.bills.length; i++){
                if(typeof $scope.bills[i].pay !== 'undefined' && $scope.bills[i].pay > 0){
                    
                    $scope.transaction.value = $scope.transaction.date_transaction;

                    if (!$scope.transaction.description)
                        $scope.transaction.description = 'Règlement client';

                    $scope.transaction.third_party = {
                        id: $scope.bills[i].client.id,
                        name: $scope.bills[i].client.name
                    };

                    $scope.transaction.bill = {
                        id: $scope.bills[i]._id,
                        name: $scope.bills[i].ref
                    };
                    
                    $scope.transaction.credit = $scope.bills[i].pay;
                    
                    $scope.saveTransaction(this.transaction);
                    
                    $scope.transaction.bill = {};
                }
            }

        };

        $scope.saveTransaction = function (transact) {

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
        
        $scope.findOne = function () {
            
            var dict = ["fk_transaction_type", "fk_account_type", "fk_account_status"];

            $http({method: 'GET', url: '/api/dict', params: {
                    dictName: dict
                }
            }).success(function (data, status) {
                $scope.dict = data;
            });
            
            var id = object.transaction;
            
            Transaction.get({
                Id: id
            }, function (transaction) {
                $scope.transaction = transaction;
            }
            );  
        };
        
        $scope.update = function () {
            
            if($scope.transaction.amount < 0){
                $scope.transaction.debit = Math.abs($scope.transaction.amount);
                $scope.transaction.credit = null;
            }else{
                $scope.transaction.credit = $scope.transaction.amount;
                $scope.transaction.debit = null;
            }
                
            var transaction = $scope.transaction;

            transaction.$update(function () {
                $scope.findOne();
            }, function (errorResponse) {
                
            });
                        
        };
    }]);

angular.module('mean.transaction').controller('StatementController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Transaction', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, Transaction) {

        $scope.init = function () {

            $scope.bank_statement = $location.search()['statement'];
            var account = $location.search()['account'];

            $http({method: 'GET', url: '/api/transaction/bankStatement', params: {
                    bank: account,
                    statement: $scope.bank_statement
                }
            }).success(function (data, status) {
                
                $http({method: 'GET', url: '/api/bank/' + account, params: {
                    
                }
                }).success(function (data, status) {
                    
                    $scope.bank = data;
                    
                });
                
                $scope.RegenerateTransactions(data);
                $scope.countTransactions = data.length;

            });
        };

        $scope.RegenerateTransactions = function (transactions) {

            $scope.transactions = transactions;

            //sorting transactions by date of transaction
            $scope.transactions.sort(function (a, b) {

                var dateA = new Date(a.date_transaction), dateB = new Date(b.date_transaction);
                return dateA - dateB;
            });

            //calculate balances
            for (var i = 0; i < transactions.length; i++) {

                if (i === 0)
                    $scope.transactions[0].balance = (-1 * $scope.transactions[0].debit) + $scope.transactions[0].credit;
                else
                    $scope.transactions[i].balance = (-1 * $scope.transactions[i].debit) + $scope.transactions[i].credit + $scope.transactions[i - 1].balance;
            }
            $scope.totalBalance = $scope.transactions[transactions.length - 1].balance;
                        
        };

        $scope.filterOptions = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.gridOptions = {
            data: 'transactions',
            enableRowSelection: false,
            filterOptions: $scope.filterOptionsTransaction,
            i18n: 'fr',
            showFooter: true,
            footerTemplate: '<div style="padding: 10px;">\n\
            <span class="right"><strong>Solde final : \{{totalBalance | currency:bank.currency}}<strong></span>\n\
            </div>',
            footerRowHeight: 40,
            enableColumnResize: true,
            cellClass: 'cellToolTip',
            columnDefs: [
                {field: 'date_transaction', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'value', displayName: 'Valeur', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'trans_type.name', displayName: 'type'},
                {field: 'description', displayName: 'Déscription'},
                {field: 'debit', displayName: 'Debit', cellFilter: "currency:''"},
                {field: 'credit', displayName: 'Credit', cellFilter: "currency:''"},
                {field: 'balance', displayName: 'Solde', cellFilter: "currency:''"}
            ]
        };


    }]);
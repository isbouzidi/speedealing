angular.module('mean.bank').controller('BankController', ['$rootScope', '$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'Bank', function ($rootScope, $scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, Bank) {

        $scope.global = Global;
        pageTitle.setTitle('Gestion des banques');
        $scope.completeInfos = false;


        $scope.init = function () {

            var dict = ["fk_country", "fk_currencies", "fk_account_status", "fk_account_type", "fk_transaction_type"];

            $http({method: 'GET', url: '/api/dict', params: {
                    dictName: dict
                }
            }).success(function (data, status) {
                $scope.dict = data;

            });

        };

        $scope.find = function () {

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
                {field: 'libelle', displayName: 'Comptes courants', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/bank/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a></div>'},
                {field: 'name_bank', displayName: 'Banque', width: '100px'},
                {field: 'account_number', displayName: 'Numero de compte', width: '140px'},
                {field: 'acc_type.name', displayName: 'Type',
                    cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'acc_type.css\')}} glossy">{{row.getProperty(col.field)}}</small></div>'},
                {field: 'acc_status.name', displayName: 'Etat', width: '80px',
                    cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'acc_status.css\')}} glossy">{{row.getProperty(col.field)}}</small></div>'
                },
                {field: 'initial_balance', displayName: 'Solde', width: '80px'}
            ]
        };

        /*
         * NG-GRID for Transaction list
         */

        $scope.filterOptionsTransaction = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.toggle = false;

        $scope.gridOptionsTransactions = {
            data: 'transactions',
            enableRowSelection: false,
            filterOptions: $scope.filterOptionsTransaction,
            i18n: 'fr',
            showFooter: true,
            footerTemplate: '<div style="padding: 10px;">\n\
            <span class="right"><strong>Solde actuel : \{{totalCurrentBalance | currency:bank.currency}}<strong></span><br>\n\
            <span class="right"><strong>Solde total : \{{totalBalance | currency:bank.currency}}<strong></span>\n\
            </div>',
            footerRowHeight: 50,
            enableColumnResize: true,
            cellClass: 'cellToolTip',
            columnDefs: [
                {field: 'date_transaction', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'value', displayName: 'Valeur', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'trans_type.name', displayName: 'type'},
                {field: 'description', displayName: 'Déscription'},
                {field: 'third_party.name', displayName: 'Tiers'},
                {field: 'debit', displayName: 'Debit', cellFilter: "currency:''"},
                {field: 'credit', displayName: 'Credit', cellFilter: "currency:''"},
                {field: 'balance', displayName: 'Solde', cellFilter: "currency:''"},
                {field: 'bank_statement', displayName: 'Relvé', 
                    cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/module/bank/bankStatement.html?statement={{row.getProperty(\'bank_statement\')}}&account={{row.getProperty(\'bank.id\')}}">{{row.getProperty(col.field)}} </a>'}
            ]
        };
        $scope.isValidInfo = function (bank) {

            if (typeof bank.iban !== "undefined" && $scope.isValidIban(bank.iban) && typeof bank.country !== "undefined" && typeof bank.account_number !== "undefined")
                if (bank.country.length !== 0 && bank.account_number.length !== 0)
                    return true;

            return false;

        };

        $scope.findOne = function () {

            Bank.get({
                Id: $routeParams.id
            }, function (bank) {
                $scope.bank = bank;
                pageTitle.setTitle('Fiche ' + $scope.bank.libelle);
                $scope.completeInfos = $scope.isValidInfo($scope.bank);

                $http({method: 'GET', url: '/api/transaction', params: {
                        find: {"bank.id": bank._id}
                    }
                }).success(function (data, status) {

                    $scope.RegenerateTransactions(data);
                    $scope.countTransactions = data.length;
                });

            }
            );

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
            console.log($scope.transactions);
            //calculate current and total balance 
            var todayDate = new Date();
            $scope.totalCurrentBalance = 0;

            for (var i = 0; i < transactions.length; i++) {
                var dateTransaction = new Date($scope.transactions[i].date_transaction);

                if (dateTransaction < todayDate)
                    $scope.totalCurrentBalance += (-1 * $scope.transactions[i].debit) + $scope.transactions[i].credit;
            }
        };

        $scope.update = function () {

            var bank = $scope.bank;

            bank.$update(function (response) {
                pageTitle.setTitle('Fiche ' + bank.libelle);
                $scope.completeInfos = $scope.isValidInfo($scope.bank);
            });
        };

        $scope.clientAutoComplete = function (val, field) {
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

        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/bank/create.html',
                controller: "BankCreateController",
                windowClass: "steps"
            });

            modalInstance.result.then(function (bank) {
                $scope.bank.push(bank);
                $scope.count++;
            }, function () {
            });
        };

        $scope.addNewTransaction = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/bank/createTransaction.html',
                controller: "TransactionController",
                windowClass: "steps",
                resolve: {
                    object: function () {
                        return {
                            bank: $scope.bank,
                            transaction_type: $scope.dict['fk_transaction_type'].values
                        };
                    }
                }
            });

            modalInstance.result.then(function (transaction) {
//                $scope.bank.transaction.push(transaction);
//                $scope.count++;
                $scope.findOne();
            }, function () {
            });
        };

        $scope.isValidIban = function (value) {

            
            // remove spaces and to upper case
            var iban = value.replace(/ /g, "").toUpperCase(),
                    ibancheckdigits = "",
                    leadingZeroes = true,
                    cRest = "",
                    cOperator = "",
                    countrycode, ibancheck, charAt, cChar, bbanpattern, bbancountrypatterns, ibanregexp, i, p;

            if (!(/^([a-zA-Z0-9]{4} ){2,8}[a-zA-Z0-9]{1,4}|[a-zA-Z0-9]{12,34}$/.test(iban))) {
                return false;
            }

            // check the country code and find the country specific format
            countrycode = iban.substring(0, 2);
            bbancountrypatterns = {
                "AL": "\\d{8}[\\dA-Z]{16}",
                "AD": "\\d{8}[\\dA-Z]{12}",
                "AT": "\\d{16}",
                "AZ": "[\\dA-Z]{4}\\d{20}",
                "BE": "\\d{12}",
                "BH": "[A-Z]{4}[\\dA-Z]{14}",
                "BA": "\\d{16}",
                "BR": "\\d{23}[A-Z][\\dA-Z]",
                "BG": "[A-Z]{4}\\d{6}[\\dA-Z]{8}",
                "CR": "\\d{17}",
                "HR": "\\d{17}",
                "CY": "\\d{8}[\\dA-Z]{16}",
                "CZ": "\\d{20}",
                "DK": "\\d{14}",
                "DO": "[A-Z]{4}\\d{20}",
                "EE": "\\d{16}",
                "FO": "\\d{14}",
                "FI": "\\d{14}",
                "FR": "\\d{10}[\\dA-Z]{11}\\d{2}",
                "GE": "[\\dA-Z]{2}\\d{16}",
                "DE": "\\d{18}",
                "GI": "[A-Z]{4}[\\dA-Z]{15}",
                "GR": "\\d{7}[\\dA-Z]{16}",
                "GL": "\\d{14}",
                "GT": "[\\dA-Z]{4}[\\dA-Z]{20}",
                "HU": "\\d{24}",
                "IS": "\\d{22}",
                "IE": "[\\dA-Z]{4}\\d{14}",
                "IL": "\\d{19}",
                "IT": "[A-Z]\\d{10}[\\dA-Z]{12}",
                "KZ": "\\d{3}[\\dA-Z]{13}",
                "KW": "[A-Z]{4}[\\dA-Z]{22}",
                "LV": "[A-Z]{4}[\\dA-Z]{13}",
                "LB": "\\d{4}[\\dA-Z]{20}",
                "LI": "\\d{5}[\\dA-Z]{12}",
                "LT": "\\d{16}",
                "LU": "\\d{3}[\\dA-Z]{13}",
                "MK": "\\d{3}[\\dA-Z]{10}\\d{2}",
                "MT": "[A-Z]{4}\\d{5}[\\dA-Z]{18}",
                "MR": "\\d{23}",
                "MU": "[A-Z]{4}\\d{19}[A-Z]{3}",
                "MC": "\\d{10}[\\dA-Z]{11}\\d{2}",
                "MD": "[\\dA-Z]{2}\\d{18}",
                "ME": "\\d{18}",
                "NL": "[A-Z]{4}\\d{10}",
                "NO": "\\d{11}",
                "PK": "[\\dA-Z]{4}\\d{16}",
                "PS": "[\\dA-Z]{4}\\d{21}",
                "PL": "\\d{24}",
                "PT": "\\d{21}",
                "RO": "[A-Z]{4}[\\dA-Z]{16}",
                "SM": "[A-Z]\\d{10}[\\dA-Z]{12}",
                "SA": "\\d{2}[\\dA-Z]{18}",
                "RS": "\\d{18}",
                "SK": "\\d{20}",
                "SI": "\\d{15}",
                "ES": "\\d{20}",
                "SE": "\\d{20}",
                "CH": "\\d{5}[\\dA-Z]{12}",
                "TN": "\\d{20}",
                "TR": "\\d{5}[\\dA-Z]{17}",
                "AE": "\\d{3}\\d{16}",
                "GB": "[A-Z]{4}\\d{14}",
                "VG": "[\\dA-Z]{4}\\d{16}"
            };

            bbanpattern = bbancountrypatterns[countrycode];
            // As new countries will start using IBAN in the
            // future, we only check if the countrycode is known.
            // This prevents false negatives, while almost all
            // false positives introduced by this, will be caught
            // by the checksum validation below anyway.
            // Strict checking should return FALSE for unknown
            // countries.
            if (typeof bbanpattern !== "undefined") {
                ibanregexp = new RegExp("^[A-Z]{2}\\d{2}" + bbanpattern + "$", "");
                if (!(ibanregexp.test(iban))) {
                    return false; // invalid country specific format
                }
            }

            // now check the checksum, first convert to digits
            ibancheck = iban.substring(4, iban.length) + iban.substring(0, 4);
            for (i = 0; i < ibancheck.length; i++) {
                charAt = ibancheck.charAt(i);
                if (charAt !== "0") {
                    leadingZeroes = false;
                }
                if (!leadingZeroes) {
                    ibancheckdigits += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(charAt);
                }
            }

            // calculate the result of: ibancheckdigits % 97
            for (p = 0; p < ibancheckdigits.length; p++) {
                cChar = ibancheckdigits.charAt(p);
                cOperator = "" + cRest + "" + cChar;
                cRest = cOperator % 97;
            }
            return cRest === 1;
        };

        $scope.reconciliation = function (bank, transactions) {
//            $routeParams.bank = $scope.bank._id;
            $rootScope.bank = bank;
            $rootScope.transactions = transactions;
            //$location.path("module/bank/rapprochement.html");
            $location.path('module/bank/rapprochement.html').search({bankId: bank._id});

        };


    }]);
angular.module('mean.bank').controller('BankCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', '$location', 'Bank', function ($scope, $http, $modalInstance, $upload, $route, Global, $location, Bank) {

        $scope.global = Global;

        $scope.active = 1;

        $scope.init = function () {

            $scope.bank = {};

            $scope.bank = {
                transaction: [{
                        description: "Initial balance",
                        credit: 0
                    }]
            };

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

        $scope.create = function () {

            var account = new Bank(this.bank);
            console.log(account);
            account.$save(function (response) {
                console.log(response);
                $modalInstance.close(response);
                $location.path("/bank/" + response._id);
            });
        };
    }]);

angular.module('mean.transaction').controller('ReconciliationController', ['$scope', '$rootScope', '$http', '$upload', '$route', 'Global', '$location', 'Transaction', function ($scope, $rootScope, $http, $upload, $route, Global, $location, Transaction) {

        $scope.reconciliation = {
            category: null
        };
        
        $scope.listReconciliedTrans = [];

        $scope.find = function () {

            $scope.listReconciliedTrans = [];
            $scope.checkedBox = false;

            var id = $location.search()['bankId'];

            $http({method: 'GET', url: '/api/bank/' + id, params: {
                }
            }).success(function (data, status) {
                $scope.bank = data;

                $http({method: 'GET', url: '/api/transaction/reconcile', params: {
                        find: {"bank.id": $scope.bank._id}
                    }
                }).success(function (data, status) {
                    $scope.transactions = data;
                    $scope.count = data.length;

                });

                $http({method: 'GET', url: '/api/bankCategory', params: {
                    }
                }).success(function (data, status) {
                    $scope.category = data;
                });

            });
        };

        $scope.filterOptionsTransaction = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.toggle = false;
        
        $scope.gridOptionsTransactions = {
            data: 'transactions',
            filterOptions: $scope.filterOptionsTransaction,
            i18n: 'fr',
            enableColumnResize: true,
            showSelectionCheckbox: true,
            selectWithCheckboxOnly: true,
            beforeSelectionChange: function (row) {
                row.changed = true;
                return true;
            },
            afterSelectionChange: function (row, event) {
                if (row.changed) {
                    if(typeof row.length === 'undefined'){
                        var index = $scope.listReconciliedTrans.indexOf(row.entity._id);
                        if (index > -1) {
                            $scope.listReconciliedTrans.splice(index, 1);
                        } else {
                            $scope.listReconciliedTrans.push(row.entity._id);
                        } 
                    }else{
                        if(event){
                            $scope.listReconciliedTrans = [];
                            for(var i = 0; i < row.length; i++){
                                $scope.listReconciliedTrans.push(row[i].entity._id);
                            }
                        }else{
                            $scope.listReconciliedTrans = [];
                        }
                    }
                }
                row.changed = false;
            },
            plugins:[new ngGridSingleSelectionPlugin()],
            columnDefs: [
                {field: '_id', displayName: 'Code Transaction', visible: false},
                {field: 'date_transaction', displayName: 'Date', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'value', displayName: 'Valeur', cellFilter: "date:'dd-MM-yyyy'"},
                {field: 'trans_type.name', displayName: 'type'},
                {field: 'description', displayName: 'Déscription'},
                {field: 'third_party.name', width: "120px", displayName: 'Tiers'},
                {field: 'debit', displayName: 'Debit', width: "80px", cellFilter: "currency:''"},
                {field: 'credit', displayName: 'Credit', width: "80px", cellFilter: "currency:''"}
            ]
        };
        
        //listen for selected row event
        $scope.$on('ngGridEventRowSeleted',function(event,row){
            $scope.selectedRow=row;
        });
        
        $scope.checkTransaction = function (id) {

            var index = $scope.listReconciliedTrans.indexOf(id);

            if (index < 0) {
                $scope.listReconciliedTrans.push(id);
            } else {
                $scope.listReconciliedTrans.splice(index, 1);
            }
            ;

        };

        $scope.reconcile = function () {
            var category = null;
            
            if($scope.reconciliation.category){
                category = {
                    id: $scope.reconciliation.category._id,
                    name: $scope.reconciliation.category.name
                };
            };
            
            if($scope.listReconciliedTrans.length > 0){
                $http({method: 'PUT', url: '/api/transaction/reconcile', params: {
                    ids: $scope.listReconciliedTrans,
                    bank_statement: $scope.bank_statement,
                    category: category
                }
                }).success(function (data, status) {

                    $scope.find();
                    $scope.reconciliation = {
                        category: null
                    };
                });
            }
            
        };

        $scope.backFiche = function () {

            var id = $location.search()['bankId'];
            $location.path('/bank/' + id);
        };

        function ngGridSingleSelectionPlugin() {
            var self = this;
            self.lastSelectedRow = null;
            self.selectedRowItems = [];
            self.allRowItems = [];
            self.isAllRowSelected = false;
            self.grid = null;
            self.scope = null;
            self.init = function (scope, grid, services) {
                self.services = services;
                self.grid = grid;
                self.scope = scope;
                self.initNeddedProprties();
                // mousedown event on row selection
                grid.$viewport.on('mousedown', self.onRowMouseDown);
                // mousedown event on checkbox header selection
                grid.$headerContainer.on('mousedown', self.onHeaderMouseDown);
            };
            //init properties 
            self.initNeddedProprties = function () {
                self.grid.config.multiSelect = true;
                self.grid.config.showSelectionCheckbox = true;
                self.grid.config.selectWithCheckboxOnly = true;
            };
            self.onRowMouseDown = function (event) {
                // Get the closest row element from where we clicked.
                var targetRow = $(event.target).closest('.ngRow');
                // Get the scope from the row element
                var rowScope = angular.element(targetRow).scope();
                if (rowScope) {
                    var row = rowScope.row;
                    if (event.target.type !== 'checkbox') {
                        // if  select all rows checkbox was pressed
                        if (self.isAllRowSelected) {
                            self.selectedRowItems = self.grid.rowCache;
                        }
                        //set to false selected rows with checkbox
                        angular.forEach(self.selectedRowItems, function (rowItem) {
                            rowItem.selectionProvider.setSelection(rowItem, false);
                        });
                        self.selectedRowItems = [];
                        //set to false last selected row
                        if (self.lastSelectedRow) {
                            self.lastSelectedRow.selectionProvider.setSelection(self.lastSelectedRow, false);
                        }
                        if (!row.selected) {
                            row.selectionProvider.setSelection(row, true);
                            self.lastSelectedRow = row;
                            self.scope.$emit('ngGridEventRowSeleted', row);
                        }
                    }
                    else {
                        if (!row.selected) {
                            self.selectedRowItems.push(row);
                            self.scope.$emit('ngGridEventRowSeleted', row);

                        }
                    }
                }
            };
            // mousedown event for checkbox header selection
            self.onHeaderMouseDown = function (event) {
                if (event.target.type === 'checkbox') {
                    if (!event.target.checked) {
                        self.isAllRowSelected = true;
                    } else {
                        self.isAllRowSelected = false;
                    }
                }
            }

        }
    }]);
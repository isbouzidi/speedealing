angular.module('mean.bankCategory').controller('BankCategoryController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'BankCategory', function ($scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, BankCategory) {

        $scope.global = Global;
        pageTitle.setTitle('Gestion des Rubriques des Banques');

        $scope.find = function () {

            BankCategory.query(function (bankCategory) {

                $scope.bankCategory = bankCategory;
                $scope.count = bankCategory.length;
            });
        };

        $scope.filterOptions = {
            filterText: "",
            useExternalFilter: false
        };

        $scope.gridOptions = {
            data: 'bankCategory',
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            enableRowSelection: false,
            enableCellEditOnFocus: false,
            filterOptions: $scope.filterOptions,
            columnDefs: [
                {field: 'name', displayName: 'Rubrique', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/userGroup/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'> {{row.getProperty(col.field)}}</a></div>'},
                {field: 'description', displayName: 'Déscription'}
            ]
        };

        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/bankCategory/create.html',
                controller: "BankCategoryCreateController",
                windowClass: "steps"
            });

            modalInstance.result.then(function (bankCategory) {
                $scope.bankCategory.push(bankCategory);
                $scope.count++;
            }, function () {
            });
        };
    }]);

angular.module('mean.bankCategory').controller('BankCategoryCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'BankCategory', function ($scope, $http, $modalInstance, $upload, $route, Global, BankCategory) {

        $scope.global = Global;
        $scope.bankCategory = {};
        $scope.active = 1;

        $scope.isActive = function (idx) {
            if (idx === $scope.active)
                return "active";
        };

        $scope.init = function () {


        };

        $scope.create = function () {
            
            var bankCategory = new BankCategory(this.bankCategory);

            bankCategory.$save(function (response) {
                
                $modalInstance.close(response);

            });
        };

    }]);


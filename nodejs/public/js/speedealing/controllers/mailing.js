"use strict";

angular.module('mean.mailing').controller('MailingController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', 'pageTitle', 'Global', 'Mailing', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, pageTitle, Global, Mailing) {
    
    $scope.global = Global;
    $scope.mailing = {};
     
    pageTitle.setTitle('Gestion des templates d\'email');
    
    $scope.init = function(){
        
    };
    
    $scope.find = function(){
        Mailing.query(function(mailing) { 
            $scope.mailing = mailing;
            $scope.count = mailing.length;
        });
    };
    
    $scope.findOne = function(){
        Mailing.get({
            Id: $routeParams.id
        }, function (mailing) {
            $scope.mailing = mailing;
            $scope.prov_message = $scope.mailing.message;
       
        });
    };
    
    $scope.filterOptionsMailing = {
        filterText: "",
        useExternalFilter: false
    };
    
    $scope.gridOptions = {
        data: 'mailing',
        sortInfo: {fields: ["createAt"], directions: ["asc"]},
        multiSelect: true,
        i18n: 'fr',
        filterOptions: $scope.filterOptionsMailing,
        enableCellSelection: false,
        enableRowSelection: false,
        columnDefs: [
            {field: 'title', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/mailing/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-mail"></span> {{row.getProperty(col.field)}}</a></div>'},
            {field: 'createAt', displayName: 'Date création', cellFilter: "date:'dd-MM-yyyy'"},
            {field: 'description', displayName: 'Déscription'},
            {field: 'object', displayName: 'Objet'},
            {field: 'transmitter', displayName: 'Emetteur'}
        ]        
    };
    
    $scope.addNew = function () {
        var modalInstance = $modal.open({
            templateUrl: '/partials/mailing/create.html',
            controller: "MailingCreateController",
            windowClass: "steps"
        });

        modalInstance.result.then(function (mailing) {
            $scope.mailing.push(mailing);
            $scope.count++;
        }, function () {
        });
    };
    
   $scope.update = function(){
            
        var mailing = $scope.mailing;

        mailing.$update(function() {

        });
    };    
        
}]);

angular.module('mean.mailing').controller('MailingCreateController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$modalInstance', '$filter', '$timeout', 'pageTitle', 'Global', 'Mailing', function ($scope, $location, $http, $routeParams, $modal, $modalInstance, $filter, $timeout, pageTitle, Global, Mailing) {
    
    $scope.global = Global;
    
    $scope.init = function(){        

    };
    
    $scope.create = function () {

        var mailing = new Mailing(this.mailing);
        console.log(mailing);
        mailing.$save(function (response) {
            console.log(response);
            $modalInstance.close(response);
            $location.path("/mailing/" + response._id);
        });
    };
}]);
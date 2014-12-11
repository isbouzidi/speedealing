angular.module('mean.export').controller('ExportCSVController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'Export', function ($scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, Export) {
        
        $scope.global = Global;
        $scope.gridData = [{Result: null}];
        $scope.msg = {
            enable: false,
            icon: null,
            color: null,
            text: null
        };
        
        $scope.init = function(){
            
        };
        
        $scope.colDefs = [];
        
        $scope.$watch('gridData', function() {
           
            $scope.colDefs = [];
            var i = 0;
            angular.forEach(Object.keys($scope.gridData[0]), function(key){
                
                $scope.colDefs.push({ field: key });                
            });
            $scope.count = $scope.gridData.length;
        });

        $scope.gridOptions = {
            data: 'gridData',
            i18n: 'fr',
            columnDefs: 'colDefs',
            enableColumnResize: false
        };
        
        $scope.getData = function () {
                        
            var str = $scope.request;            
            var col = str.substring(0,str.indexOf("."));
            str = str.replace(col, "db");
            
            //if($scope.global.user.rights[col] && $scope.global.user.rights[col].export){
            if(true){
                var p = {
                    request: str,
                    model: col
                };

                Export.query(p, function (data) {
                    
                    $scope.gridData = data[0];    
                    $scope.csvData = data[1];
                    $scope.count = $scope.gridData.length;
                    $scope.msg={
                        enable: true,
                        icon: "icon-tick",
                        color: "green-gradient",
                        text: "Success !"
                    };
                }, function(error){
                    $scope.msg={
                        enable: true,
                        icon: "icon-cross",
                        color: "red-gradient",
                        text: error.data
                    };
                });
            }else{
                $scope.msg={
                    enable: true,
                    icon: "icon-cross",
                    color: "red-gradient",
                    text: "Vous n'avez pas l'autorisation !"
                };
            }                                  
        };
        
        $scope.export = function(){
            var element = angular.element('<a/>');
            element.attr({
                href: 'data:attachment/csv;charset=utf-8,' + encodeURI($scope.csvData),
                target: '_blank',
                download: 'filename.csv'
            })[0].click();
        };
    }]);
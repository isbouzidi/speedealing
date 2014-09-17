angular.module('mean.rh').controller('RhController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'RH', function($scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, RH) {
		
        //$scope.global = Global;

        pageTitle.setTitle('Gestion des collaborateurs');
        
        $scope.retour = function(){
            $location.path('/rh');
        };
        
        $scope.find = function() {
        
            RH.query(function(user) { 
                    
                    $scope.user = user;
                    $scope.count = user.length;
            });
        };
        
        $scope.onFileSelect = function($files) {
                
                for (var i = 0; i < $files.length; i++) {
                    
                        var file = $files[i];
                         
                        $scope.upload = $upload.upload({
                                url: 'api/rh/file/' + $scope.userEdit._id,
                                method: 'POST',
                                file: $scope.myFiles
                        }).progress(function(evt) {
                                console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                        }).success(function(data, status, headers, config) {
                            if (!data.update) // if not file update, add file to files[]
                                $scope.societe.files.push(data.file);
                                                                 
                        });                            
                }
        };
        
        $scope.kendoUpload = {
                multiple: true,
                async: {
                        saveUrl: "api/rh/file/",
                        removeUrl: "api/rh/file/",
                        removeVerb: "DELETE",
                        autoUpload: true
                },
                error: function(e) {
                        // log error
                        console.log(e);
                        console.log($scope.userEdit._id);
                },
                upload: function(e) {
                        e.sender.options.async.saveUrl = "api/rh/file/" + $scope.userEdit._id;
                        e.sender.options.async.removeUrl = "api/rh/file/" + $scope.userEdit._id;
                },
                complete: function() {
                        $route.reload();
                },
                localization: {
                        select: "Ajouter photo"
                }
        };
        
        $scope.icon = function(item) {
                for (var i in modules) {
                        if (item.title == modules[i].name)
                                return modules[i].icon;
                }
                return "icon-question-round";
        };

        $scope.url = function(item) {
                for (var i in modules) {
                        if (item.title == modules[i].name)
                                return modules[i].url + item.id;
                }
                return "";
        };
        
        $scope.addLink = function() {
                var link = $scope.item;
                if (link.id) {
                        $scope.ticket.linked.push({id: link.id, name: link.name, collection: $scope.module.collection, title: $scope.module.name});
                        $scope.item = null;
                }
        };

        $scope.noteKendoEditor = {
                encoded: false,
                tools: [
                        "bold",
                        "italic",
                        "underline",
                        "strikethrough",
                        "justifyLeft",
                        "justifyCenter",
                        "justifyRight",
                        "justifyFull",
                        "createLink",
                        "unlink",
                        "createTable",
                        "addColumnLeft",
                        "addColumnRight",
                        "addRowAbove",
                        "addRowBelow",
                        "deleteRow",
                        "deleteColumn",
                        "foreColor",
                        "backColor"
                ]
        };
        
        $scope.filterOptionsUser = {
            filterText: "",
            useExternalFilter: false
	};
                
        $scope.gridOptions = {
            data: 'user',
            sortInfo: {fields: ["fullname"], directions: ["asc"]},
            //showFilter:true,
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            enableRowSelection: false,
            enableCellEditOnFocus: false,
            enableColumnResize: true,
            columnDefs: [
                    {field: 'fullname', displayName: 'Employé', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-class="{orange: row.getProperty(\'societe.name\')}" ng-href="#!/rh/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-user"></span> {{row.getProperty(col.field)}}</a> <small ng-if="row.getProperty(\'societe.name\')">({{row.getProperty(\'societe.name\')}})</small></div>'},
                    {field: 'poste', displayName: 'Poste'},
                    {field: 'userGroup', displayName: 'Groupe'},
                    {field: 'entity', displayName: 'Site'},
                    {field: 'contrat', displayName: 'Contrat'},
					{field: 'NewConnection', displayName: 'Date connexion', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'"},
                    {field: 'status.name', displayName: 'Statut', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(col.field)}}</small></div>'}
                  ],
            filterOptions: $scope.filterOptionsUser
        };

        $scope.addNew = function() {
                var modalInstance = $modal.open({
                        templateUrl: '/partials/rh/create.html',
                        controller: "RhCreateController",
                        windowClass: "steps"
                });

                modalInstance.result.then(function(user) {
                        $scope.user.push(user);
                        $scope.count++;
                }, function() {
                });
        };
        
        $scope.init = function(){
            
            
            var fields = ["Contrat", "PeriodeEssai", "TempsTravail", "SituationFamiliale", "Status", "niveauEtude"];

            angular.forEach(fields, function(field) {
                    $http({method: 'GET', url: '/api/rh/fk_extrafields/select', params: {
                                    field: field
                            }
                    }).success(function(data, status) {
                            $scope[field] = data;
                            //console.log(data);
                    });
            });
           
            $http({ method: 'GET', url: '/api/UserGroup/list', 
                params: {fields: "name"}

                    }).success(function(data) {
                        
                        $scope.groupe = data;
             });
                 
            
                 
                 
            $http({ method: 'GET', url: '/api/site/fk_extrafields/select', 
                        params: { field: "_id" }

                        }).success(function(data) {
                                    
                            $scope.site = data;
                 });
            
            $http({ method: 'GET', url: '/api/rh/pays/select', 
                        params: { field: "dict:fk_country" }

                        }).success(function(data) {
                            
                            $scope.pays = data;
                            
                 });
                 
            
        };
        
        $scope.update = function() {
            
            var userEdit = $scope.userEdit;

            userEdit.$update(function() {
                
            }, function(errorResponse){
                
            });
        };
        
        
    
        $scope.remove = function(response){
            
            var userEdit = $scope.userEdit;
            userEdit.$remove(function(response){
                $location.path('/rh');
            });
        };

        $scope.findOne = function() {
            
            RH.get({
                    Id: $routeParams.id
            }, function(doc) {
                    $scope.userEdit = doc;
                    pageTitle.setTitle('Fiche ' + $scope.fullname);
                   
            });
             
        };
        
        $scope.showUserGroup = function() {
            
            var selected = [];
            angular.forEach($scope.groupe, function(g) { 
              if ($scope.userEdit.groupe.indexOf(g._id) >= 0) {
                selected.push(g.name);
              }
            });
            return selected.length ? selected.join(', ') : 'indéfini';
              
        };
        
        $scope.addNote = function() {
			if (!this.note)
				return;

			var note = {};
			note.note = this.note;
			note.datec = new Date();
			note.author = {};
			note.author.id = Global.user._id;
			note.author.name = Global.user.firstname + " " + Global.user.lastname;

			if (!$scope.userEdit.notes)
				$scope.userEdit.notes = [];

			$scope.userEdit.notes.push(note);
			$scope.update();
			this.note = "";
		};
}]);

angular.module('mean.rh').controller('RhCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'RH', function($scope, $http, $modalInstance, $upload, $route, Global, RH) {
    
        $scope.global = Global;
        
        $scope.validLogin = false;
        $scope.user = {};
        $scope.loginFound = "";

        $scope.active = 1;
        
        $scope.isActive = function(idx) {
            if (idx === $scope.active)
                return "active";
        };

        $scope.next = function() {
            $scope.active++;
        };
        
        $scope.change = function(){
            alert($scope.user.groupe.value());
        };
        
        $scope.init = function(){
                
                
        };
        
        $scope.create = function() {
            
                var user = new RH(this.user);
                
                 user.$save(function(response) {
                   $modalInstance.close(response);
                   
                   //if(response.status == 200)
                       
                   
//                }, function(response){
//                    if(response.status == 500){
//                        
//                    }
                        
                });
        };
        
        $scope.isValidLogin = function(){
            
            var login = $scope.user.login;
            $scope.loginFound = "";
            $scope.validLogin = true;
            
            if(login.indexOf(" ") > -1){
             
                $scope.validLogin = false;
                return;
            }
            
            $http({method: 'GET', url: '/api/user/uniqLogin', params: {
                            login: login
                    }
            }).success(function(data, status) {

                    if (data.fullname) {
                        $scope.loginFound = data;
                    }
                    
            });
           
        };
        
}]);
	

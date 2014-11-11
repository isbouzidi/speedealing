angular.module('mean.userGroup').controller('UserGroupController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'UserGroup', function($scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, UserGroup) {
        $scope.global = Global;
        $scope.userGroupRightsCreate = true;
		$scope.userGroupRightsDelete = true;
		$scope.userGroupRightsReadPerms = true;
		
		// Check userGroup rights
		if (!Global.user.admin && !Global.user.superadmin) {
			
			if (!Global.user.rights.group.delete)		// check userGroup delete 
				$scope.userGroupRightsDelete = false;
			if (!Global.user.rights.group.write)		// check userGroup write
				$scope.userGroupRightsCreate = false;
			if (!Global.user.rights.group.readperms)	// check userGroup readperms
				$scope.userGroupRightsReadPerms = false;
					
		}
        
        pageTitle.setTitle('Gestion des Groupes d\'utilisateurs');
        
        $scope.retour = function(){
           $location.path('/userGroup');
        };            
        
        $scope.find = function() {
            
            UserGroup.query(function(userGroup) { 
                    console.log(userGroup);
                    $scope.userGroup = userGroup;
                    $scope.count = userGroup.length;
            });
        };
        
        $scope.filterOptionsUserGroup = {
            filterText: "",
            useExternalFilter: false
        };
        
        $scope.gridOptions = {
            data: 'userGroup',
            sortInfo: {fields: ["name"], directions: ["asc"]},
            //showFilter:true,
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            enableRowSelection: false,
            enableCellEditOnFocus: false,
            
            columnDefs: [
                    {field: 'name', displayName: 'Groupe', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/userGroup/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-users"></span> {{row.getProperty(col.field)}}</a></div>'},
                    {field: 'count', displayName: 'Nombre de collaborateurs afféctés'}
                    
                  ],
            filterOptions: $scope.filterOptionsUserGroup
        };

        $scope.addNew = function() {
                var modalInstance = $modal.open({
                        templateUrl: '/partials/userGroup/create.html',
                        controller: "UserGroupCreateController",
                        windowClass: "steps"
                });

                modalInstance.result.then(function(userGroup) {
                        $scope.userGroup.push(userGroup);
                        $scope.count++;
                }, function() {
                });
        };
               
        $scope.addNewUser = function(){
            
            $http({method: 'PUT', url: '/api/userGroup/addUserToGroup', params: {
                user: $scope.userGroup.newUser._id, 
                groupe: $scope.userGroup._id
            }
            }).success(function(status) {
                
                $scope.findOne();
            });
            
        };
        
		$scope.findOne = function() {
			
			UserGroup.get({
				Id: $routeParams.id
			}, function(doc) {
				
				$scope.userGroup = doc;
				
				pageTitle.setTitle('Fiche ' + $scope.userGroup.name);
				
				$http({
					method: 'GET',
					url: '/api/userGroup/users',
					params: {
						groupe: $scope.userGroup._id
					}
				}).success(function(data, status) {
					$scope.listUsers = data;
					$scope.NbrListUsers = data.length;
				});
				
				$http({
					method: 'GET',
					url: '/api/userGroup/noUsers',
					params: {
						groupe: $scope.userGroup._id
					}
				}).success(function(data, status) {
					$scope.listNoUsers = data;
				});
				
				// Check userGroup rights
				if (!Global.user.admin && !Global.user.superadmin) {
					
					if (Global.user.groupe == $scope.userGroup._id && Global.user.rights.user.self_readperms) // check user self_readperms
						$scope.userGroupRightsReadPerms = true;
							
				} else {
					
					if (Global.user.groupe == $scope.userGroup._id) // an admin can not delete a group to which it belongs
						$scope.userGroupRightsDelete = false;
					
				}
				
				if ($scope.userGroupRightsReadPerms) {
					$http({
						method: 'GET',
						url: '/rights'
					}).success(function(data, status) {
						$scope.modules = data;
					});
				}
        	});

        };
        
        $scope.deleteUserGroup = function(){
            
            if($scope.listUsers.length > 0)
                return alert("ce groupe ne peut pas être supprimer");
            
            var userGroup = $scope.userGroup;
            userGroup.$remove(function(response){
                $location.path('/userGroup');
            });                         
        };
        
        $scope.removeUser = function(user){
           
            $http({method: 'PUT', url: '/api/userGroup/removeUserFromGroup', params: {
                user: user, group: $scope.userGroup._id
            }
            }).success(function(data, status) {
                $scope.listUsers;
                $scope.findOne();
                
            });
            
        };
        
        $scope.filterOptionsListUsers = {
            filterText: "",
            useExternalFilter: false
	};
        
        $scope.gridListUserOptions = {
            
            data: 'listUsers',
            sortInfo: {fields: ["fullname"], directions: ["asc"]},
            //showFilter:true,
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            enableRowSelection: false,
            enableCellEditOnFocus: false,

            columnDefs: [
                    {field: 'fullname', displayName: 'Employé'},
                    {field: 'poste', displayName: 'Poste'},
                    {field: 'entity', displayName: 'Site'},
                    {field: 'contrat', displayName: 'Contrat'},
                    {field: 'status.name', displayName: 'Statut', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(col.field)}}</small></div>'},
                    {displayName: "Actions", enableCellEdit: false, width: "80px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button red-gradient icon-trash" ng-disabled="!userGroupRightsCreate" confirmed-click="removeUser(\'{{row.getProperty(\'_id\')}}\')" ng-confirm-click="Supprimer le collaborateur ?" title="Supprimer"> </button></div></div>'}
            ],
                filterOptions: $scope.filterOptionsListUsers
        };
        
        $scope.update = function(){
            
            var userGroup = $scope.userGroup;
                        
            userGroup.$update(function() {
                
            });
        };
             
}]);

angular.module('mean.userGroup').controller('UserGroupCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'UserGroup', function($scope, $http, $modalInstance, $upload, $route, Global, UserGroup) {
    
        $scope.global = Global;
        
        $scope.validUserGroup = false;
        $scope.userGroup = {};
        $scope.userGroupFound = "";
        
        $scope.active = 1;
        
        $scope.isActive = function(idx) {
            if (idx === $scope.active)
                return "active";
        };
        
        $scope.isValidUserGroup = function(){
            
            var name = $scope.userGroup.name;
            $scope.userGroupFound = "";            
            
            $http({method: 'GET', url: '/api/userGroup/uniqName', params: {
                            name: name
                    }
            }).success(function(data, status) {

                    if (data.name) {
                        $scope.userGroupFound = data;
                    }
                    
            });
           
        };
        
        $scope.init = function(){
                
                
        };
        
        $scope.create = function() {
            
                var userGroup = new UserGroup(this.userGroup);
                
                
                userGroup.$save(function(response) {
                   $modalInstance.close(response);
                        
                });
        };
        
}]);
	

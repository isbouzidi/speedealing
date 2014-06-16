angular.module('mean.system').controller('UserRhAbsenceController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', 'pageTitle', 'Global', 'Users', function($scope, $routeParams, $location, $route, $modal, $timeout, $http, pageTitle, Global, Users) {
		$scope.global = Global;

		pageTitle.setTitle('Gestion des absences');

		$scope.absence = {};

		$scope.types = [{name: "En cours", id: "NOW"},
			{name: "Clos", id: "CLOSED"}];

		$scope.type = {name: "En cours", id: "NOW"};

		$scope.find = function() {
			Users.absences.query({query: this.type.id, entity: Global.user.entity}, function(absences) {
				$scope.absences = absences;
				$scope.count = absences.length;
			});

			$http({method: 'GET', url: '/api/user/absence/status/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
			});
		};

		/*
		 * NG-GRID for order list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'absences',
			filterOptions: $scope.filterOptions,
			sortInfo: {fields: ["dateStart"], directions: ["asc"]},
			//showFilter:true,
			i18n: 'fr',
			enableCellSelection: false,
			enableRowSelection: false,
			enableCellEditOnFocus: true,
			columnDefs: [
				{field: 'user.name', enableCellEdit: false, displayName: 'Salarié', cellTemplate: '<div class="ngCellText"><span><span class="icon-user"></span> {{row.getProperty(col.field)}}</span>'},
				{field: 'datec', enableCellEdit: false, displayName: 'Date demande', width: "100px", cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'dateStart', enableCellEdit: false, displayName: 'Date début', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'", editableCellTemplate: '<input ng-class="\'colt\' + col.index" ng-model="COL_FIELD" ng-input="COL_FIELD" class="input" ng-blur="updateInPlace(col, row)"/>'},
				{field: 'dateEnd', enableCellEdit: false, displayName: 'Date fin', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'", editableCellTemplate: '<input ng-class="\'colt\' + col.index" ng-model="COL_FIELD" ng-input="COL_FIELD" class="input" ng-blur="updateInPlace(col, row)"/>'},
				{field: 'nbDay', enableCellEdit: true, displayName: 'Nombre de jours', width: "130px", cellClass: "align-right", editableCellTemplate: '<input type="number" min="0" step="0.1" ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-blur="updateInPlace(col, row)" class="input"/>'},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>', editableCellTemplate: '<select ng-cell-input ng-class="\'colt\' + col.index" ng-model="row.entity.Status" ng-blur="updateInPlace(col, row)" ng-input="row.entity.Status" data-ng-options="c.id as c.name for c in status"></select>'},
				{field: 'entity', enableCellEdit: false, displayName: "Entité", cellClass: "align-center", width: 100, visible: Global.user.multiEntities},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button icon-pencil" title="Editer" ng-click="edit(row)"></button><button data-ng-click="addTick(row)" ng-disabled="row.getProperty(\'closed\')" class="button icon-tick" title="Le salarié est de retour"></button><button class="button red-gradient icon-trash" disabled title="Supprimer"></button></div></div>'}
			]
		};

		$scope.addTick = function(row) {
			row.entity.closed = true;
			row.entity.$update();
			var index = row.rowIndex;
			$scope.gridOptions.selectItem(index, false);
			$scope.absences.splice(index, 1);
		};

		$scope.addNew = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/user/create_absence.html',
				controller: "UserRhAbsenceCreateController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return $scope.absence;
					}
				}
			});

			modalInstance.result.then(function(absence) {
				absence = new Users.absences(absence);
				absence.$save(function() {
				});

				$scope.absences.push(absence);
				$scope.count++;
			}, function() {
			});
		};

		$scope.edit = function(row) {

			var modalInstance = $modal.open({
				templateUrl: '/partials/user/create_absence.html',
				controller: "UserRhAbsenceCreateController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return row.entity;
					}
				}
			});

			modalInstance.result.then(function(absence) {
				absence.$update(function() {
				});
				$scope.absence = {};
			}, function() {
			});
		};

		$scope.updateInPlace = function(column, row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function() {
					row.entity.$update();
					$scope.save.pending = false;
				}, 500);
			}
		};

	}]);

angular.module('mean.users').controller('UserRhAbsenceCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Users', 'object', function($scope, $http, $modalInstance, $upload, $route, Global, Users, object) {
		$scope.global = Global;

		$scope.absence = object;
		//$scope.absence = {
		//	entity: Global.user.entity
		//};

		$scope.dateStart = new Date(object.dateStart);
		$scope.dateEnd = new Date(object.dateEnd);

		$scope.init = function() {
			$http({method: 'GET', url: '/api/user/absence/status/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
				//console.log(data);
				//$scope.absence.Status = data.default;
			});
		};

		$scope.create = function() {
			//Add entity
			if (this.absence.user && this.absence.user.entity)
				this.absence.entity = this.absence.user.entity;

			//var absence = new Users.absences(this.absence);
			//absence.$save(function(response) {
			//console.log(response);
			$modalInstance.close(this.absence);
			//$location.path("societe/" + response._id);
			//});
		};


		$scope.userAutoComplete = function(val) {
			return $http.post('api/user/name/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				return res.data;
			});
		};


	}]);
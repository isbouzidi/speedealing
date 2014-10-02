angular.module('mean.system').controller('TaskController', ['$scope', '$routeParams', '$location', '$timeout', '$http', '$route', '$modal', 'Global', 'pageTitle', 'Task', function ($scope, $routeParams, $location, $timeout, $http, $route, $modal, Global, pageTitle, Task) {
		$scope.global = Global;
		pageTitle.setTitle('Liste des tâches');

		$scope.task = {};
		$scope.tasks = [];

		$scope.types = [{name: "Mes tâches", id: "MYTASK"},
			{name: "Toutes les tâches", id: "ALLTASK"},
			{name: "Les tâches archivées", id: "ARCHIVED"}];

		$scope.type = {name: "Mes tâches", id: "MYTASK"};

		$scope.init = function () {
			/*var fields = ["tva_tx", "Status", "units"];
			 
			 angular.forEach(fields, function(field) {
			 $http({method: 'GET', url: '/api/product/fk_extrafields/select', params: {
			 field: field
			 }
			 }).success(function(data, status) {
			 $scope[field] = data;
			 //console.log(data);
			 });
			 });*/
		};

		$scope.update = function () {
			var task = $scope.task;

			task.$update(function (response) {
				pageTitle.setTitle('Tâche ' + task.name);
			});
		};

		$scope.find = function () {
			var sb = {};
			for (var i = 0; i < $scope.sortOptions.fields.length; i++) {
				sb[$scope.sortOptions.fields[i]] = $scope.sortOptions.directions[i] === "desc" ? -1 : 1;
			}

			var p = {
				fields: "_id Status name updatedAt",
				query: this.type.id,
				filter: $scope.filterOptions.filterText,
				skip: $scope.pagingOptions.currentPage - 1,
				limit: $scope.pagingOptions.pageSize,
				sort: sb
			};

			Task.query(p, function (tasks) {
				$scope.tasks = tasks;
			});

			$http({method: 'GET', url: '/api/task/count', params: p
			}).success(function (data, status) {
				$scope.totalCount = data.count;
				$scope.maxPage = Math.ceil(data.count / 1000);
			});
		};

		$scope.findOne = function () {
			Task.get({
				Id: $routeParams.id
			}, function (task) {
				$scope.task = task;

				pageTitle.setTitle('Tâche ' + $scope.task.name);

			}, function (err) {
				if (err.status == 401)
					$location.path("401.html");
			});

		};

		$scope.showTask = function (id) {

			var scope = $scope;

			var ModalInstanceCtrl = function ($scope, $modalInstance, object) {
				$scope.task = {
				};

				$scope.findOne = function () {
					Task.get({
						Id: object.task
					}, function (task) {
						$scope.task = task;

					}, function (err) {
						if (err.status == 401)
							$location.path("401.html");
					});

				};

				var fields = ["Status"];

				angular.forEach(fields, function (field) {
					$http({method: 'GET', url: '/api/task/fk_extrafields/select', params: {
							field: field
						}
					}).success(function (data, status) {
						$scope[field] = data;
						//console.log(data);
					});
				});

				$scope.update = function () {
					var task = $scope.task;

					task.$update(function (response) {
					});
				};
			};

			var modalInstance = $modal.open({
				templateUrl: '/partials/task/view.html',
				controller: ModalInstanceCtrl,
				windowClass: "steps",
				resolve: {
					object: function () {
						return {
							task: id
						};
					}
				}
			});
			modalInstance.result.then(function (task) {
			}, function () {
			});
		};


		/*
		 * NG-GRID for task list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: true
		};

		// paging
		$scope.totalCount = 0;

		$scope.pagingOptions = {
			pageSizes: [500, 1000, 2500, 5000],
			pageSize: 1000,
			currentPage: 1
		};

		$scope.$watch('pagingOptions', function (newVal, oldVal) {
			if (newVal.currentPage !== oldVal.currentPage) {
				$scope.find();
			}
		}, true);

		$scope.$watch('filterOptions', function (newVal, oldVal) {
			if (newVal.filterText !== oldVal.filterText) {
				$scope.find();
			}
		}, true);

		$scope.$watch('sortOptions', function (newVal, oldVal) {
			if (newVal.directions[0] !== oldVal.directions[0] && newVal.fields[0] !== oldVal.fields[0]) {
				$scope.find();
			}
		}, true);

		// sorting
		$scope.sortOptions = {fields: ["ref"], directions: ["asc"]};

		$scope.gridOptions = {
			data: 'tasks',
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			pagingOptions: $scope.pagingOptions,
			sortInfo: $scope.sortOptions,
			useExternalSorting: true,
			enablePaging: true,
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'name', displayName: 'Titre', width: "200px", cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-click="showProduct(row.getProperty(\'_id\'))" data-tooltip-options=\'{"position":"top"}\' title=\'{{row.getProperty(col.field)}}\'><span class="icon-bag"></span> {{row.getProperty(col.field)}}</a></div>'},
				{field: 'datef', displayName: 'Date d\'échéance', width: "150px", cellFilter: "date:'dd/MM/yyyy HH:mm'"},
				{field: 'societe.name', displayName: 'Société'},
				{field: 'contact.name', displayName: 'Contact'},
				{field: 'author.name', displayName: 'Créé par'},
				{field: 'usertodo.name', displayName: 'Affecté à'},
				{field: 'userdone.name', displayName: 'Réalisé par'},
				{field: 'status.name', width: '100px', displayName: 'Etat',
					cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')">{{row.getProperty(\'status.name\')}}</small></span></div>'
				},
				{field: 'updatedAt', displayName: 'Dernière MAJ', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'"},
				{displayName: "Actions", enableCellEdit: false, width: "60px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button red-gradient icon-trash" title="Supprimer" ng-confirm-click="Supprimer le tarif du produit ?" confirmed-click="remove(row)"></button></div></div>'}
			]
		};

		$scope.updateInPlace = function (api, field, row, newdata) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function () {
					$http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
						data: {
							oldvalue: row.entity[field],
							value: newdata
						}
					})
							.success(function (data, status) {
								if (status == 200) {
									if (data) {
										row.entity = data;
									}
								}
							});

					$scope.save.pending = false;
				}, 200);
			}

			return false;
		};

		$scope.addNew = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/task/create.html',
				controller: "TaskCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function (task) {
				//console.log(product);
				$scope.tasks.push(task);
			}, function () {
			});
		};

	}]);

angular.module('mean.system').controller('TaskCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Task', function ($scope, $http, $modalInstance, $upload, $route, Global, Task) {
		$scope.global = Global;

		$scope.task = {
		};
		
		$scope.contacts = [];

		$scope.init = function () {
			var fields = ["Status"];

			angular.forEach(fields, function (field) {
				$http({method: 'GET', url: '/api/task/fk_extrafields/select', params: {
						field: field
					}
				}).success(function (data, status) {
					$scope[field] = data;
					//console.log(data);
				});
			});
		};

		$scope.create = function () {
			var task = new Task(this.task);
			task.$save(function (response) {
				//console.log(response);
				$modalInstance.close(response);
				//$location.path("societe/" + response._id);
			});
		};

		$scope.open = function ($event) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened = true;
		};

		$scope.searchContact = function (item) {
			$scope.task.contact={};
			
			$http({method: 'GET', url: 'api/contacts', params: {
					find: {
						"societe.id": item.id
					},
					field: "_id firstname lastname name poste"
				}
			}).success(function (data) {
				$scope.contacts = data;
			});
		};

		$scope.societeAutoComplete = function (val, field) {
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

		$scope.userAutoComplete = function (val) {
			return $http.post('api/user/name/autocomplete', {
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

	}]);
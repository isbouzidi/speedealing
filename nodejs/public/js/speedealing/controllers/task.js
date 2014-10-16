angular.module('mean.system').controller('TaskController', ['$scope', '$routeParams', '$location', '$timeout', '$http', '$route', '$modal', 'Global', 'socket', 'pageTitle', 'Task', function ($scope, $routeParams, $location, $timeout, $http, $route, $modal, Global, socket, pageTitle, Task) {
		$scope.global = Global;
		pageTitle.setTitle('Liste des tâches');

		$scope.task = {};
		$scope.tasks = [];

		$scope.types = [];

		if (Global.user.rights.task && Global.user.rights.task.readAll)
			$scope.types = [{name: "Mes tâches en cours", id: "MYTASK"},
				{name: "Toutes les tâches en cours", id: "ALLTASK"},
				{name: "Mes tâches archivées", id: "MYARCHIVED"},
				{name: "Les tâches archivées", id: "ARCHIVED"}];
		else
			$scope.types = [{name: "Mes tâches en cours", id: "MYTASK"},
				{name: "Mes tâches archivées", id: "MYARCHIVED"}];

		$scope.type = {name: "Mes tâches en cours", id: "MYTASK"};

		$scope.user = {
			id: Global.user.id,
			name: Global.user.firstname + " " + Global.user.lastname
		};

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
				fields: "_id percentage name datef societe notes updatedAt author usertodo userdone archived",
				query: this.type.id,
				entity: Global.user.entity,
				user: $scope.user.id,
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

						$scope.editable = !task.archived;

					}, function (err) {
						if (err.status == 401)
							$location.path("401.html");
					});

				};

				$scope.loadContact = function (item) {

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

				$scope.addNote = function () {
					$scope.task.notes.push({
						note: $scope.newNote,
						percentage: $scope.task.percentage,
						datec: new Date(),
						author: {
							name: Global.user.firstname + " " + Global.user.lastname,
							id: Global.user.id
						}
					});

					$scope.update();
				};

				$scope.updatePercent = function (percentage) {
					if ($scope.task.notes[$scope.task.notes.length - 1].author.id == Global.user.id) {
						$scope.task.notes[$scope.task.notes.length - 1].percentage = percentage;
						$scope.task.notes[$scope.task.notes.length - 1].datec = new Date();
					} else
						$scope.task.notes.push({
							percentage: percentage,
							datec: new Date(),
							author: {
								name: Global.user.firstname + " " + Global.user.lastname,
								id: Global.user.id
							}
						});

					$scope.update();
				};

				$scope.update = function () {
					var task = $scope.task;

					task.$update(function (response) {
						$scope.task = response;
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
		$scope.sortOptions = {fields: ["datef"], directions: ["asc"]};

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
				{field: 'name', displayName: 'Titre', width: "200px", cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-click="showTask(row.getProperty(\'_id\'))" data-tooltip-options=\'{"position":"top"}\' title=\'{{row.getProperty(col.field)}}\'><span class="icon-tick"></span> {{row.getProperty(col.field)}}</a></div>'},
				{field: 'datef', displayName: 'Date d\'échéance', width: "150px", cellFilter: "date:'dd/MM/yyyy HH:mm'"},
				{field: 'societe.name', displayName: 'Société'},
				//	{field: 'contact.name', displayName: 'Contact'},
				{field: 'author.name', displayName: 'Créé par'},
				{field: 'usertodo.name', displayName: 'Affecté à'},
				{field: 'userdone.name', displayName: 'Réalisé par'},
				{field: 'status.name', width: '100px', displayName: 'Etat',
					cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')">{{row.getProperty(\'status.name\')}}</small></span></div>'
				},
				{field: 'updatedAt', displayName: 'Dernière MAJ', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'"},
				{displayName: "Actions", enableCellEdit: false, width: "90px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button green-gradient icon-like" ng-click="closed(row)" ng-disabled="row.getProperty(\'percentage\')>=100" title="Terminé"></button><button class="button icon-cloud-upload" ng-click="setArchived(row)" ng-disabled="row.getProperty(\'archived\') == true || row.getProperty(\'author.id\') != global.user.id" title="Archiver"></button></div></div>'}
			]
		};

		$scope.closed = function (row) {
			//console.log(row);
			if (!row.entity.userdone.id) {
				if (row.entity.notes[row.entity.notes.length - 1].author.id == Global.user.id) {
					row.entity.notes[row.entity.notes.length - 1].percentage = 100;
					row.entity.notes[row.entity.notes.length - 1].datec = new Date();
				} else
					row.entity.notes.push({
						percentage: 100,
						datec: new Date(),
						author: {
							name: Global.user.firstname + " " + Global.user.lastname,
							id: Global.user.id
						}
					});
			}

			row.entity.$update();
		};

		$scope.setArchived = function (row) {
			row.entity.archived = true;
			$scope.closed(row);
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

		socket.on('refreshTask', function (data) {
			$scope.find();
		});

	}]);

angular.module('mean.system').controller('TaskCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Task', function ($scope, $http, $modalInstance, $upload, $route, Global, Task) {
		$scope.global = Global;

		$scope.hstep = 1;
		$scope.mstep = 15;

		$scope.ismeridian = false;

		$scope.task = {
			type: "AC_RDV",
			usertodo: {
				id: Global.user._id,
				name: Global.user.firstname + " " + Global.user.lastname
			},
			datep: new Date().setHours(new Date().getHours(), 0),
			datef: new Date().setHours(new Date().getHours() + 1, 0),
			notes: [
				{
					author: {
						id: Global.user._id,
						name: Global.user.firstname + " " + Global.user.lastname
					},
					datec: new Date(),
					percentage: 0,
					note: ""
				}
			]
		};

		$scope.contacts = [];
		$scope.dict = {};
		$scope.opened = [];

		$scope.init = function () {

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: "fk_actioncomm"
				}
			}).success(function (data, status) {
				$scope.dict.fk_actioncomm = data;
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

		$scope.open = function ($event, idx) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened[idx] = true;
		};

		$scope.searchContact = function (item) {
			$scope.task.contact = {};

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

	}]);
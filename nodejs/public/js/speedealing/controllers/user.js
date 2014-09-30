angular.module('mean.users').controller('UserRhAbsenceController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', 'pageTitle', 'Global', 'Users', function ($scope, $routeParams, $location, $route, $modal, $timeout, $http, pageTitle, Global, Users) {
		$scope.global = Global;

		pageTitle.setTitle('Gestion des absences');

		$scope.absence = {};

		$scope.types = [{name: "En cours", id: "NOW"},
			{name: "Clos", id: "CLOSED"}];

		$scope.type = {name: "En cours", id: "NOW"};

		$scope.find = function () {
			Users.absences.query({query: this.type.id, entity: Global.user.entity}, function (absences) {
				$scope.absences = absences;
				$scope.count = absences.length;
			});

			$http({method: 'GET', url: '/api/user/absence/status/select', params: {
					field: "Status"
				}
			}).success(function (data, status) {
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

		$scope.addTick = function (row) {
			row.entity.closed = true;
			row.entity.$update();
			var index = row.rowIndex;
			$scope.gridOptions.selectItem(index, false);
			$scope.absences.splice(index, 1);
		};

		$scope.addNew = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/user/create_absence.html',
				controller: "UserRhAbsenceCreateController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return $scope.absence;
					}
				}
			});

			modalInstance.result.then(function (absence) {
				absence = new Users.absences(absence);
				absence.$save(function () {
				});

				$scope.absences.push(absence);
				$scope.count++;
			}, function () {
			});
		};

		$scope.edit = function (row) {

			var modalInstance = $modal.open({
				templateUrl: '/partials/user/create_absence.html',
				controller: "UserRhAbsenceCreateController",
				windowClass: "steps",
				resolve: {
					object: function () {
						return row.entity;
					}
				}
			});

			modalInstance.result.then(function (absence) {
				absence.$update(function () {
				});
				$scope.absence = {};
			}, function () {
			});
		};

		$scope.updateInPlace = function (column, row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function () {
					row.entity.$update();
					$scope.save.pending = false;
				}, 500);
			}
		};

	}]);

angular.module('mean.users').controller('UserRhAbsenceCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Users', 'object', function ($scope, $http, $modalInstance, $upload, $route, Global, Users, object) {
		$scope.global = Global;

		$scope.absence = object;
		//$scope.absence = {
		//	entity: Global.user.entity
		//};

		$scope.dateStart = new Date(object.dateStart);
		$scope.dateEnd = new Date(object.dateEnd);

		$scope.init = function () {
			$http({method: 'GET', url: '/api/user/absence/status/select', params: {
					field: "Status"
				}
			}).success(function (data, status) {
				$scope.status = data;
				//console.log(data);
				//$scope.absence.Status = data.default;
			});
		};

		$scope.create = function () {
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


	}
]);

angular.module('mean.users').controller('UserController', ['$scope', '$routeParams', '$location', '$route', '$modal', '$timeout', '$http', '$filter', '$upload', 'pageTitle', 'Global', 'Users', function ($scope, $routeParams, $location, $route, $modal, $timeout, $http, $filter, $upload, pageTitle, Global, Users) {

		$scope.global = Global;

		pageTitle.setTitle('Gestion des collaborateurs');

		$scope.retour = function () {
			$location.path('/user');
		};

		$scope.find = function () {

			Users.users.query(function (user) {

				$scope.user = user;
				$scope.count = user.length;
			});
		};

		$scope.onFileSelect = function ($files) {

			for (var i = 0; i < $files.length; i++) {

				var file = $files[i];

				$scope.upload = $upload.upload({
					url: 'api/user/file/' + $scope.userEdit._id,
					method: 'POST',
					file: $scope.myFiles
				}).progress(function (evt) {
					console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
				}).success(function (data, status, headers, config) {
					if (!data.update) // if not file update, add file to files[]
						$scope.societe.files.push(data.file);

				});
			}
		};

		$scope.kendoUpload = {
			multiple: true,
			async: {
				saveUrl: "api/user/file/",
				removeUrl: "api/user/file/",
				removeVerb: "DELETE",
				autoUpload: true
			},
			error: function (e) {
				// log error
				console.log(e);
				console.log($scope.userEdit._id);
			},
			upload: function (e) {
				e.sender.options.async.saveUrl = "api/user/file/" + $scope.userEdit._id;
				e.sender.options.async.removeUrl = "api/user/file/" + $scope.userEdit._id;
			},
			complete: function () {
				$route.reload();
			},
			localization: {
				select: "Ajouter photo"
			}
		};

		$scope.icon = function (item) {
			for (var i in modules) {
				if (item.title === modules[i].name)
					return modules[i].icon;
			}
			return "icon-question-round";
		};

		$scope.url = function (item) {
			for (var i in modules) {
				if (item.title === modules[i].name)
					return modules[i].url + item.id;
			}
			return "";
		};

		$scope.addLink = function () {
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
				{field: 'fullname', displayName: 'Employé', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-class="{orange: row.getProperty(\'societe.name\')}" ng-href="#!/user/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-user"></span> {{row.getProperty(col.field)}}</a> <small ng-if="row.getProperty(\'societe.name\')">({{row.getProperty(\'societe.name\')}})</small></div>'},
				{field: 'poste', displayName: 'Fonction'},
				{field: 'userGroup', displayName: 'Rôle'},
				{field: 'entity', displayName: 'Site', width: "100px"},
				{field: 'email', displayName: 'Email'},
				{field: 'NewConnection', displayName: 'Date connexion', width: "150px", cellFilter: "date:'dd-MM-yyyy HH:mm'"},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(col.field)}}</small></div>'}
			],
			filterOptions: $scope.filterOptionsUser
		};

		$scope.addNew = function () {

			var modalInstance = $modal.open({
				templateUrl: '/partials/user/create.html',
				controller: "UserCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function (user) {
				$scope.user.push(user);
				$scope.count++;
			}, function () {
			});
		};

		$scope.init = function () {


			var fields = ["Contrat", "PeriodeEssai", "TempsTravail", "SituationFamiliale", "Status", "niveauEtude"];

			angular.forEach(fields, function (field) {
				$http({method: 'GET', url: '/api/user/fk_extrafields/select', params: {
						field: field
					}
				}).success(function (data, status) {
					$scope[field] = data;
					//console.log(data);
				});
			});

			$http({method: 'GET', url: '/api/UserGroup/list',
				params: {fields: "name"}

			}).success(function (data) {

				$scope.groupe = data;
			});




			$http({method: 'GET', url: '/api/site/fk_extrafields/select',
				params: {field: "_id"}

			}).success(function (data) {

				$scope.site = data;
			});

			$http({method: 'GET', url: '/api/user/pays/select',
				params: {field: "dict:fk_country"}

			}).success(function (data) {

				$scope.pays = data;

			});


		};

		$scope.update = function () {

			var userEdit = $scope.userEdit;

			userEdit.$update(function () {

			}, function (errorResponse) {

			});
		};

		$scope.remove = function (response) {

			var userEdit = $scope.userEdit;
			userEdit.$remove(function (response) {
				$location.path('/user');
			});
		};

		$scope.findOne = function () {

			Users.users.get({
				Id: $routeParams.id
			}, function (doc) {
				$scope.userEdit = doc;
				pageTitle.setTitle('Fiche ' + $scope.fullname);

			});

		};

		$scope.showUserGroup = function () {

			var selected = [];
			angular.forEach($scope.groupe, function (g) {
				if ($scope.userEdit.groupe === g._id) {
					selected.push(g.name);
				}
			});
			return selected.length ? selected.join(', ') : 'indéfini';

		};

		$scope.addNote = function () {
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

angular.module('mean.users').controller('UserCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Users', function ($scope, $http, $modalInstance, $upload, $route, Global, Users) {

		$scope.global = Global;

		$scope.validLogin = false;
		$scope.user = {};
		$scope.loginFound = "";

		$scope.active = 1;

		$scope.isActive = function (idx) {
			if (idx === $scope.active)
				return "active";
		};

		$scope.next = function () {
			$scope.active++;
		};

		$scope.change = function () {
			alert($scope.user.groupe.value());
		};

		$scope.init = function () {


		};

		$scope.create = function () {

			var newUser = new Users.users(this.user);

			newUser.$save(function (response) {
				$modalInstance.close(response);

			});
		};

		$scope.isValidLogin = function () {

			var login = $scope.user.login;
			$scope.loginFound = "";
			$scope.validLogin = true;

			if (login)
				if (login.indexOf(" ") > -1) {
					$scope.validLogin = false;
					return;
				}

			$http({method: 'GET', url: '/api/createUser/uniqLogin', params: {
					login: login
				}
			}).success(function (data, status) {

				if (data.fullname) {
					$scope.loginFound = data;
				}

			});

		};

	}]);
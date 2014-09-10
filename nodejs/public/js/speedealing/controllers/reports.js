angular.module('mean.reports').controller('ReportController', ['$scope', '$rootScope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Reports', function($scope, $rootScope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Reports) {

		$scope.global = Global;

		$scope.findOne = function() {

			Reports.get({
				Id: $rootScope.idReport
			}, function(report) {
				console.log(report);
				$scope.report = report;
			});
		};
		$scope.update = function() {

			var report = $scope.report;

			report.$update(function() {

			}, function(errorResponse) {

			});
		};

	}]);

angular.module('mean.reports').controller('ReportCreateController', ['$scope', '$http', '$modalInstance', '$modal', '$upload', '$route', 'Global', 'Reports', 'object', function($scope, $http, $modalInstance, $modal, $upload, $route, Global, Reports, object) {

		$scope.global = Global;
		$scope.report = {
			entity: Global.user.entity,
			duration: 1,
			durationAppointment: 1,
			contacts: [],
			products: [],
			actions: [],
			optional: {
				reports: [],
				business: {
					reason: []
				},
				subject: {
					deployment: [],
					progressPoints: []
				}
			},
			societe: {
				id: object.societe._id,
				name: object.societe.name
			}
		};

		$scope.actionMethod = [];
		$scope.actionDate = [];
		$scope.lead = {};
		$scope.leads = [];
		$scope.report.lead = {};

		$scope.prospectLevel = {selectedOption: null};

		$scope.init = function() {

			$http({method: 'POST', url: '/api/product/family', data: {
					field: "caFamily"
				}
			}).success(function(data) {
				$scope.products = data;
			});

			$http({method: 'GET', url: 'api/contacts', params: {
					find: {
						"societe.id": object.societe._id
					},
					field: "_id firstname lastname name poste"
				}
			}).success(function(data) {

				$scope.contacts = data;
			});

			var fields = [
				"model",
				"typeAction",
				"methodAction",
				"typeReport",
				"typeBusiness",
				"reasonBusiness",
				"deployment",
				"progressPoints",
				"reports"
			];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/report/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data) {

					$scope[field] = data;
				});
			});

			$http({method: 'GET', url: '/api/lead/fk_extrafields/select', params: {
					field: "Status"
				}
			}).success(function(data) {

				$scope.leadStatus = data;
			});

			$http({method: 'GET', url: 'api/lead', params: {
					'societe.id': object.societe._id
				}
			}).success(function(data) {

				$scope.leads = data;
			});

			$http({method: 'GET', url: '/api/lead/dict/select', params: {
					field: "prospectlevel"
				}
			}).success(function(data) {

				$scope.potential = data;

			});
		};

		$scope.productSelection = function productSelection(product) {
			var idx = $scope.report.products.indexOf(product);

			if (idx > -1) {
				$scope.report.products.splice(idx, 1);
			}

			else {
				$scope.report.products.push(product);
			}
		};

		$scope.reasonSelection = function reasonSelection(reason) {

			var idx = $scope.report.optional.business.reason.indexOf(reason);

			if (idx > -1) {
				$scope.report.optional.business.reason.splice(idx, 1);
			}

			else {
				$scope.report.optional.business.reason.push(reason);
			}
		};

		$scope.deploymentSelection = function deploymentSelection(reason) {

			var idx = $scope.report.optional.subject.deployment.indexOf(reason);

			if (idx > -1) {
				$scope.report.optional.subject.deployment.splice(idx, 1);
			}

			else {
				$scope.report.optional.subject.deployment.push(reason);
			}
		};

		$scope.progressPointsSelection = function progressPointsSelection(reason) {

			var idx = $scope.report.optional.subject.progressPoints.indexOf(reason);

			if (idx > -1) {
				$scope.report.optional.subject.progressPoints.splice(idx, 1);
			}

			else {
				$scope.report.optional.subject.progressPoints.push(reason);
			}
		};

		$scope.reportSelection = function reportSelection(reason) {

			var idx = $scope.report.optional.reports.indexOf(reason);

			if (idx > -1) {
				$scope.report.optional.reports.splice(idx, 1);
			}

			else {
				$scope.report.optional.reports.push(reason);
			}
		};

		$scope.actionSelection = function actionSelection(action) {

			var found = false;
			var idx;
			var actionObj = {};

			for (var i = 0; i < $scope.report.actions.length; i++) {
				if ($scope.report.actions[i].type === action) {
					found = true;
					$scope.report.actions.splice(i, 1);
					$scope.actionMethod[action] = false;
					$scope.actionDate[action] = null;
					break;
				}
			}

			if (!found) {

				actionObj = {
					type: action
				};

				$scope.report.actions.push(actionObj);
			}

		};

		$scope.addActionMethod = function(action) {

			for (var i = 0; i < $scope.report.actions.length; i++)
				if ($scope.report.actions[i].type === action)
					$scope.report.actions[i].method = $scope.actionMethod[action];

		};

		$scope.onDateSelected = function(e, action) {
			var datePicker = e.sender;
			$scope.selected = true;

			for (var i = 0; i < $scope.report.actions.length; i++)
				if ($scope.report.actions[i].type === action)
					$scope.report.actions[i].date = datePicker.value();
		};

		$scope.createReport = function() {

			$scope.report.author = {
				id: $scope.global.user._id,
				name: $scope.global.user.firstname + ' ' + $scope.global.user.lastname
			};

			$scope.report.model = $scope.report.modelTemp.id;

			var report = new Reports(this.report);

			report.$save(function(response) {
				if ($scope.prospectLevel.selectedOption !== null) {
					$http({method: 'PUT', url: '/api/report/addProspectLevel', params: {
							prospectLevel: $scope.prospectLevel.selectedOption,
							societe: object.societe._id
						}
					}).success(function(status, response) {

					});
				}
				$modalInstance.close(response);
			});
		};

		$scope.addNewContact = function() {

			var modalInstance = $modal.open({
				templateUrl: '/partials/contacts/create.html',
				controller: "ContactCreateController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return {
							societe: object.societe
						};
					}
				}
			});

			modalInstance.result.then(function(contacts) {
				$scope.report.contacts.push(contacts);

			}, function() {
			});
		};

		$scope.addNewLead = function() {

			var modalInstance = $modal.open({
				templateUrl: '/partials/leads/create.html',
				controller: "LeadCreateController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return {
							societe: object.societe
						};
					}
				}
			});

			modalInstance.result.then(function(leads) {
				$scope.report.lead = {
					id: leads._id,
					name: leads.name,
					dueDate: leads.dueDate
				};

				$scope.leads.push({
					id: leads._id,
					name: leads.name,
					dueDate: leads.dueDate
				});

			}, function() {

			});
		};

		$scope.contactAutoComplete = function(val) {

			return $http.post('api/report/autocomplete', {
				val: val
			}).then(function(res) {
				return res.data;
			});

		};

		$scope.addContact = function() {

			var add = {
				id: $scope.report.cont._id,
				name: $scope.report.cont.name,
				poste: $scope.report.cont.poste || 'Indéfini'
			};

			$scope.report.contacts.push(add);

		};

		$scope.addLead = function() {

			$scope.report.lead = {
				id: $scope.report.lead._id,
				name: $scope.report.lead.name,
				dueDate: $scope.report.lead.dueDate
			};

		};

		$scope.delete = function($index) {
			$scope.report.contacts.splice($index, 1);
		};

		$scope.deleteLead = function($index) {
			$scope.report.lead = {};
		};

		$scope.showReason = function() {

			if ($scope.report.leadStatus === 'REF') {
				$scope.showReasonValue = true;
			} else {
				$scope.showReasonValue = false;
				$scope.report.optional.business.reason.splice(0, $scope.report.optional.business.reason.length);
			}

		};

	}]);
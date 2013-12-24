angular.module('mean.system').controller('TicketController', ['$scope', '$rootScope', '$routeParams', '$location', '$route', 'Global', '$http', 'Ticket', function($scope, $rootScope, $routeParams, $location, $route, Global, $http, Ticket) {
		$scope.global = Global;
		
		var init = false;

		$rootScope.$on('$viewContentLoaded', function(event) {
			console.log(event);
			//if(angular.element('#link-input-select').length > 0)
			if(!init) {
				angular.element('#link-input-select').change(); // Update Select
				init= true;
			}
			//$scope.$apply();
		});

		var ticket = {
			important: false,
			linked: [],
			from: {id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname},
			to: [{id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname}],
			controlledBy: {id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname},
			comments: [{author: {id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname},
					note: "",
					datec: new Date()
				}]
		};

		$scope.ticket = angular.copy(ticket);

		var modules = [
			{
				name: "Clients",
				icon: "icon-users",
				collection: "Societe",
				url: ""
			},
			{
				name: "Commandes",
				icon: "icon-cart",
				collection: "Societe",
				url: ""
			},
			{
				name: "Fournisseurs",
				icon: "icon-users",
				collection: "Societe",
				url: ""
			},
			{
				name: "Sous-traitants",
				icon: "icon-users",
				collection: "Societe",
				url: ""
			},
			{
				name: "Transport",
				icon: "icon-plane",
				collection: "Societe",
				url: ""
			},
			{
				name: "Vehicules",
				icon: "icon-rocket",
				collection: "Societe",
				url: ""
			}
		];

		$scope.module = modules[0]; //for default

		$scope.modules = modules;

		var link = {};

		$scope.new = false;

		$scope.enableNew = function() {
			$scope.new = true;
		};

		$scope.disableNew = function() {
			$scope.new = false;
		};

		//$scope.dateftimepicker = kendoDateTimePicker({
		//	value: new Date("2013-12-25T15:00:00+02:00")
		//});

		$scope.icon = function(item) {
			for (var i in modules) {
				if (item.title == modules[i].name)
					return modules[i].icon;
			}
			return "icon-question-round";
		};

		$scope.addLink = function(item) {
			if (link.id) {
				$scope.ticket.linked.push({id: link.id, name: link.name, collection: $scope.module.collection, title: $scope.module.name});
				$scope.item = {};
				link = {};
			}
		};

		/**
		 * For Search Link
		 */

		function SearchLink() {
			var that = this;
			this.options = {
				html: true,
				minLength: 1,
				outHeight: 100,
				maxWidth: 300,
				source: function(request, response) {
					// you can $http or $resource service to get data frome server.
					$http({method: 'POST', url: 'api/societe/autocomplete', data: {
							take: '5',
							skip: '0',
							page: '1',
							pageSize: '5',
							filter: {filters: [{value: request.term}]}}
					}).
							success(function(data, status) {

						angular.forEach(data, function(row) {
							// there must have 'value' property while ngModel is a object.
							// custom html string label
							if (row.Societe || row.Client) {
								row.label = '<strong>' + row.name + '</strong> (' +
										row.Societe.name + ')';
								row.value = row.name + ' (' +
										row.Societe.name + ')';
							} else {
								row.label = row.name;
								row.value = row.name;
							}
						});

						// response data to suggestion menu.
						response(data);
					}).
							error(function(data, status) {
						response(data || "Request failed");
					});
				}
			};
			this.events = {
				change: function(event, ui) {
					link = ui.item;
				}
			};
		}

		$scope.searchLink = function() {
			this.searchLink = new SearchLink();
			return this.searchLink;
		};

		$scope.deleteLink = function(index) {
			$scope.ticket.linked.splice(index, 1);
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

		/**
		 * AutoComplete User Controlled By
		 */
		function SearchUser() {
			var that = this;
			this.options = {
				html: true,
				minLength: 1,
				outHeight: 100,
				maxWidth: 300,
				source: function(request, response) {
					// you can $http or $resource service to get data frome server.
					$http({method: 'POST', url: 'api/user/name/autocomplete?status=ENABLE', data: {
							take: '5',
							skip: '0',
							page: '1',
							pageSize: '5',
							filter: {filters: [{value: request.term}]}}
					}).
							success(function(data, status) {

						angular.forEach(data, function(row) {
							row.label = row.name;
							row.value = row.name;
						});

						// response data to suggestion menu.
						response(data);
					}).
							error(function(data, status) {
						response(data || "Request failed");
					});
				}
			};
			this.events = {
				change: function(event, ui) {
					$scope.ticket.controlledBy.id = ui.item.id;
					$scope.ticket.controlledBy.name = ui.item.name;
				}
			};
		}

		$scope.searchUser = function() {
			this.searchUser = new SearchUser();
			return this.searchUser;
		};

		/**
		 * AutoComplete User Affected To
		 */
		function SearchUserAffected() {
			var that = this;
			this.options = {
				html: true,
				minLength: 1,
				outHeight: 100,
				maxWidth: 300,
				source: function(request, response) {
					// you can $http or $resource service to get data frome server.
					$http({method: 'POST', url: 'api/user/name/autocomplete?status=ENABLE', data: {
							take: '5',
							skip: '0',
							page: '1',
							pageSize: '5',
							filter: {filters: [{value: request.term}]}}
					}).
							success(function(data, status) {

						angular.forEach(data, function(row) {
							row.label = row.name;
							row.value = row.name;
						});

						for (var j = 0; j < data.length; j++)
							for (var i = 0; i < $scope.ticket.to.length; i++)
								if (data[j].name == $scope.ticket.to[i].name) {
									data.splice(j, 1);
									j--;
								}

						// response data to suggestion menu.
						response(data);
					}).
							error(function(data, status) {
						response(data || "Request failed");
					});
				}
			};
			this.events = {
				change: function(event, ui) {
					$scope.ticket.to.push(ui.item);
					$scope.affected = null;
				}
			};
		}

		$scope.searchUserAffected = function() {
			this.searchUserAffected = new SearchUserAffected();
			return this.searchUserAffected;
		};

		$scope.deleteAffected = function(index) {
			$scope.ticket.to.splice(index, 1);
		};


		$scope.create = function() {
			var new_ticket = new Ticket($scope.ticket);
			new_ticket.$save(function(response) {
				$location.path("ticket/" + response._id);
			});

			$scope.ticket = angular.copy(ticket);
		};




	}]);


angular.module('mean.system').controller('MenuTicketController', ['$scope', '$routeParams', '$location', '$route', 'Global', 'Ticket', function($scope, $routeParams, $location, $route, Global, Ticket) {
		$scope.global = Global;

		$scope.find = function() {
			Ticket.query(function(tickets) {
				$scope.tickets = tickets;
			});
		};

		window.setInterval(function() {
			$scope.find();
			$scope.$apply();
			//console.log("toto");
		}, 60000);

		$scope.ticketRead = function(idx) {
			var ticket = $scope.tickets[idx];
			for (var i = 0; i < ticket.to.length; i++) {
				if (ticket.to[i].id == Global.user._id && ticket.to[i].read)
					return true;
			}
			return false;
		};

		$scope.countDown = function(date) {
			var today = new Date();
			var day = new Date(date);
//console.log(date);
			var seconds_left = day - today;

			//if (seconds_left < 0)
			//	seconds_left = 0;
			//else
			seconds_left = Math.round(seconds_left / 1000);


			var days = parseInt(seconds_left / 86400);
			seconds_left = seconds_left % 86400;

			var hours = parseInt(seconds_left / 3600);
			seconds_left = seconds_left % 3600;

			var minutes = parseInt(seconds_left / 60);

			//return day;
			return {days: days, hours: hours, minutes: minutes};
		};

	}]);
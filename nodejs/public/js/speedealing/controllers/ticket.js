angular.module('mean.system').controller('TicketController', ['$scope', '$rootScope', '$routeParams', '$location', '$route', 'Global', '$http', 'Ticket', function($scope, $rootScope, $routeParams, $location, $route, Global, $http, Ticket) {
		$scope.global = Global;

		$rootScope.$on('$viewContentLoaded', function(event) {
			console.log(event);
			//if(angular.element('#link-input-select').length > 0)
			angular.element('#link-input-select').change(); // Update Select
			//$scope.$apply();

			$.template.init();

			/*
			 * This is a example on how to achieve a full-height layout for content panels:
			 */

			// Cache elements
			var titleBar = $('#title-bar'),
					panelNav = $('#panel-nav'),
					panelContent = $('#panel-content'),
					controlsSize = 43, // Size of the panel-controls block and borders
					paddingSize = 40;        // Size of the padding on the panel content block

			// Function to update panels size
			updatePanelsSize = function()
			{
				panelNav.height($.template.viewportHeight - titleBar.outerHeight() - controlsSize);
				panelContent.height($.template.viewportHeight - titleBar.outerHeight() - controlsSize - paddingSize);
			};

			// First call
			updatePanelsSize();

			// Refresh on resize
			$(window).on('normalized-resize', updatePanelsSize);
		});

		var ticket = {
			important: false,
			read: [],
			linked: [],
			affectedTo: [{id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname}],
			controlledBy: {id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname},
			comments: []
		};

		$scope.ticket = angular.copy(ticket);

		var modules = [
			{
				name: "Clients",
				icon: "icon-users",
				collection: "Societe",
				url: "societe/fiche.php?id="
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

		$scope.kendoUpload = {
			multiple: true,
			async: {
				saveUrl: "api/ticket/file/<?php echo $object->id; ?>",
				removeUrl: "api/ticket/file/<?php echo $object->id; ?>",
				removeVerb: "DELETE",
				autoUpload: true
			},
			error: function(e) {
				// log error
				console.log(e);
			},
			complete: function() {
				$route.reload();
			},
			localization: {
				select: "Ajouter fichiers"
			}
		};

		$scope.module = modules[0]; //for default

		$scope.modules = modules;

		var link = {};

		$scope.new = false;

		$scope.enableNew = function() {
			$scope.new = true;
			$scope.ticket = angular.copy(ticket);
		};

		$scope.disableNew = function() {
			$scope.new = false;
			$location.path("ticket/");
		};

		$scope.enableComment = function() {
			$scope.editMode = "comment";
		};

		$scope.enableReply = function() {
			$scope.editMode = "reply";
		};

		$scope.enableForward = function() {
			$scope.editMode = "forward";
		};

		$scope.ficheCancel = function() {
			$scope.editMode = null;

			//$scope.ticket = angular.copy(ticket);
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

		// Convert date to IsoString date
		$scope.$watch('dateString', function(dateString)
		{
			console.log("date");
			var time = new Date(dateString);

			if (!isNaN(time.getTime()) && new Date($scope.ticket.datef).getTime() != time.getTime())
				$scope.ticket.datef = time;
		});

		$scope.$watch('ticket.datef', function(date)
		{
			var time = new Date(date);
			if (new Date($scope.dateString).getTime() != time.getTime())
				$scope.dateString = time;
		});

		$scope.updateExpire = function(e) {
			console.log(e.sender);

			$http({method: 'PUT', url: 'api/ticket/expire', data: {
					id: $scope.ticket._id,
					datef: e.sender._value,
					controller: $scope.ticket.controlledBy
				}
			}).
					success(function(data, status) {
				$route.reload();
				//$scope.ticket = ticket;
				//$location.path('ticket/' + data._id);
			});
		};

		$scope.addComment = function() {
			$http({method: 'POST', url: 'api/ticket/comment', data: {
					id: $scope.ticket._id,
					note: $scope.ticket.newNote,
					addUser: $scope.ticket.addUser,
					mode: $scope.editMode,
					controller: $scope.ticket.controlledBy
				}
			}).
					success(function(data, status) {
				$route.reload();
				//$scope.ticket = ticket;
				//$location.path('ticket/' + data._id);
			});
		};

		$scope.setImportant = function() {
			$http({method: 'POST', url: 'api/ticket/important', data: {
					id: $scope.ticket._id
				}
			}).
					success(function(data, status) {
				$route.reload();
				//$scope.ticket = ticket;
				//$location.path('ticket/' + data._id);
			});
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
							for (var i = 0; i < $scope.ticket.affectedTo.length; i++)
								if (data[j].name == $scope.ticket.affectedTo[i].name) {
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
					$scope.ticket.affectedTo.push(ui.item);
					$scope.affected = null;
				}
			};
		}

		$scope.searchUserAffected = function() {
			this.searchUserAffected = new SearchUserAffected();
			return this.searchUserAffected;
		};

		$scope.deleteAffected = function(index) {
			$scope.ticket.affectedTo.splice(index, 1);
		};


		$scope.create = function() {
			var new_ticket = new Ticket($scope.ticket);
			new_ticket.$save(function(response) {
				$location.path("ticket/" /*+ response._id*/);
			});

			$scope.ticket = angular.copy(ticket);
		};

		$scope.findOne = function() {
			if ($routeParams.id) {
				Ticket.get({
					id: $routeParams.id
				}, function(ticket) {
					$scope.ticket = ticket;

					if (ticket.read.indexOf(Global.user._id) < 0) {
						$http({method: 'PUT', url: 'api/ticket/read', data: {
								id: $scope.ticket._id,
							}
						}).
								success(function(data, status) {
						});
					}
				});
			}
		};

		$scope.selected = function() {
			if ($routeParams.id)
				return true;
			else
				return false;
		}

		$scope.addLink = function(item) {
			if (link.id) {
				$scope.ticket.linked.push({id: link.id, name: link.name, collection: $scope.module.collection, title: $scope.module.name});
				$scope.item = {};
				link = {};
			}
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
		 * For Menu
		 */

		$scope.find = function() {
			Ticket.query(function(tickets) {
				$scope.menuTickets = tickets;
			});
		};

		window.setInterval(function() {
			$scope.find();
			$scope.$apply();
			//console.log("toto");
		}, 60000);

		$scope.ticketRead = function(read) {
			if (read.indexOf(Global.user._id) >= 0)
				return true;
			else
				return false;
		};

		$scope.countDown = function(date, reverse) {
			var today = new Date();
			var day = new Date(date);
			//console.log(date);
			var seconds_left = today - day;

			if (reverse && seconds_left > 0)
				seconds_left = 0;
			else
				seconds_left = Math.round(seconds_left / 1000);

			var days = parseInt(seconds_left / 86400);
			seconds_left = seconds_left % 86400;

			var hours = parseInt(seconds_left / 3600);
			seconds_left = seconds_left % 3600;

			var minutes = parseInt(seconds_left / 60);
			if (reverse)
				minutes = Math.abs(minutes);

			minutes = ('0' + minutes).slice(-2);

			//return day;
			return {days: days, hours: hours, minutes: minutes};
		};

	}]);
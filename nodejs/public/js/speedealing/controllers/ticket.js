angular.module('mean.system').controller('TicketController', ['$scope', '$routeParams', '$location', '$route', '$timeout', 'Global', '$http', 'socket', 'Ticket', function($scope, $routeParams, $location, $route, $timeout, Global, $http, socket, Ticket) {
		$scope.global = Global;

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
				name: "Client",
				icon: "icon-users",
				collection: "Societe",
				searchUrl: "api/societe/autocomplete",
				url: "societe/fiche.php?id="
			},
			/*	{
			 name: "Commandes",
			 icon: "icon-cart",
			 collection: "Societe",
			 url: ""
			 },*/
			{
				name: "Fournisseur",
				icon: "icon-users",
				collection: "Societe",
				searchUrl: "api/societe/autocomplete?fournisseur=SUPPLIER",
				url: "societe/fiche.php?id="
			},
			{
				name: "Sous-traitant",
				icon: "icon-users",
				collection: "Societe",
				searchUrl: "api/societe/autocomplete?fournisseur=SUBCONTRACTOR",
				url: "societe/fiche.php?id="
			},
			{
				name: "Transport",
				icon: "icon-plane",
				collection: "europexpress_courses",
				searchUrl: "api/europexpress/courses/autocomplete",
				url: ""
			},
			{
				name: "Véhicule",
				icon: "icon-rocket",
				collection: "europexpress_vehicule",
				searchUrl: "api/europexpress/vehicules/immat/autocomplete",
				url: ""
			},
			{
				name: "Employé",
				icon: "icon-user",
				collection: "User",
				searchUrl: "api/user/name/autocomplete",
				url: "user/fiche.php?id="
			}
		];

		/*$scope.initSlider = function(data) {
			angular.element('.slider').slider({
				hideInput: true,
				size: 150,
				innerMarks: 20,
				step: 20,
				stickToStep: false,
				autoSpacing: true,
				clickableTrack: false,
				topLabel: "[value]%",
				topMarks: 20,
				bottomMarks: 20,
				barClasses: ["anthracite-gradient", "glossy"],
				onEndDrag: function(data) {
					//console.log(data);
					$http({method: 'PUT', url: 'api/ticket/percentage', data: {
							id: $scope.ticket._id,
							percentage: data,
							controller: $scope.ticket.controlledBy,
							ref: $scope.ticket.ref,
							name: $scope.ticket.name
						}
					}).
							success(function(data, status) {
						$route.reload();
						//$scope.ticket = ticket;
						//$location.path('ticket/' + data._id);
					});
				}
			});
		};*/

		$scope.kendoUpload = {
			multiple: true,
			async: {
				saveUrl: "api/ticket/file/",
				removeUrl: "api/ticket/file/",
				removeVerb: "DELETE",
				autoUpload: true
			},
			error: function(e) {
				// log error
				console.log(e);
				console.log($scope.ticket._id);
			},
			upload: function(e) {
				e.sender.options.async.saveUrl = "api/ticket/file/" + $scope.ticket._id;
				e.sender.options.async.removeUrl = "api/ticket/file/" + $scope.ticket._id;
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
			$timeout(function() {
				angular.element('select').change();
			}, 300);
		};

		$scope.enableEdit = function() {
			$scope.edit = true;
			$timeout(function() {
				angular.element('select').change();
			}, 300);
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
			//console.log($scope.module);
			//console.log($scope.module.collection);

			this.options = {
				html: true,
				minLength: 1,
				outHeight: 100,
				maxWidth: 300,
				source: function(request, response) {
					// you can $http or $resource service to get data frome server.
					$http({method: 'POST', url: $scope.module.searchUrl, data: {
							take: '5',
							skip: '0',
							page: '1',
							pageSize: '5',
							//collection: $scope.module,
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

		$scope.newExpireDate = function(e) {
			$scope.ticket.datef = e.sender._value;
		};

		$scope.$watch('ticket.datef', function(date)
		{
			var time = new Date(date);
			if (new Date($scope.dateString).getTime() != time.getTime())
				$scope.dateString = time;
		});

		$scope.updateExpire = function(e) {
			//console.log(e.sender);

			$http({method: 'PUT', url: 'api/ticket/expire', data: {
					id: $scope.ticket._id,
					datef: e.sender._value,
					controller: $scope.ticket.controlledBy,
					ref: $scope.ticket.ref,
					name: $scope.ticket.name
				}
			}).
					success(function(data, status) {
				$route.reload();
				//$scope.ticket = ticket;
				//$location.path('ticket/' + data._id);
			});
		};

		$scope.updatePercentage = function() {
			//console.log(data);
			$http({method: 'PUT', url: 'api/ticket/percentage', data: {
					id: $scope.ticket._id,
					percentage: $scope.ticket.percentage,
					controller: $scope.ticket.controlledBy,
					ref: $scope.ticket.ref,
					name: $scope.ticket.name
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
					controller: $scope.ticket.controlledBy,
					ref: $scope.ticket.ref,
					name: $scope.ticket.name
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
					id: $scope.ticket._id,
					ref: $scope.ticket.ref,
					name: $scope.ticket.name
				}
			}).
					success(function(data, status) {
				$route.reload();
				//$scope.ticket = ticket;
				//$location.path('ticket/' + data._id);
			});
		};

		$scope.setClosed = function() {
			$http({method: 'PUT', url: 'api/ticket/status', data: {
					id: $scope.ticket._id,
					Status: 'CLOSED',
					controller: $scope.ticket.controlledBy,
					ref: $scope.ticket.ref,
					name: $scope.ticket.name
				}
			}).
					success(function(data, status) {
				//$route.reload();
				//$scope.ticket = ticket;
				$location.path('ticket/');
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
					if (ui.item != null)
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

		$scope.update = function() {
			var ticket = $scope.ticket;

			ticket.$update(function() {
				//$location.path("ticket/" /*+ response._id*/);
				$route.reload();
			});
		};

		$scope.findOne = function() {
			if ($routeParams.id) {
				Ticket.get({
					id: $routeParams.id
				}, function(ticket) {
					$scope.ticket = ticket;

					//angular.element('.slider').setSliderValue(ticket.percentage);

					if (ticket.read.indexOf(Global.user._id) < 0) {
						$http({method: 'PUT', url: 'api/ticket/read', data: {
								id: $scope.ticket._id,
								controlledBy: $scope.ticket.controlledBy,
								ref: $scope.ticket.ref,
								name: $scope.ticket.name
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
					if (ui.item == null)
						ui.item = {};

					$scope.ticket.controlledBy.id = ui.item.id;
					$scope.ticket.controlledBy.name = ui.item.name;

					$scope.ticket.addUser.id = ui.item.id;
					$scope.ticket.addUser.name = ui.item.name;
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

		socket.on('refreshTicket', function(data) {
			//window.setInterval(function() {
			$scope.find();
			//$scope.$apply();
			//console.log("toto");
			//}, 60000);
		});

		$scope.ticketRead = function(read, user) {
			if (user == null)
				user = Global.user._id;
			if (read.indexOf(user) >= 0)
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
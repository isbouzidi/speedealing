angular.module('mean.orders').controller('OrderController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$timeout', '$upload', 'pageTitle', 'Global', 'Orders', function ($scope, $location, $http, $routeParams, $modal, $filter, $timeout, $upload, pageTitle, Global, Orders) {

		pageTitle.setTitle('Liste des commandes');
		$scope.order = {};
		$scope.dict = {};
		var iconsFilesList = {};

		$scope.types = [{name: "En cours", id: "NOW"},
			{name: "Clos", id: "CLOSED"}];

		$scope.type = {name: "En cours", id: "NOW"};

		$scope.init = function () {
			var dict = ["fk_order_status", "fk_paiement", "fk_input_reason", "fk_payment_term", "fk_tva"];

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: dict
				}
			}).success(function (data, status) {
				$scope.dict = data;
				//console.log(data);
			});

		};

		$scope.listOrders = function () {
			$location.path('/orders');
		};

		$scope.showStatus = function (idx, dict) {
			if (!($scope.dict[dict] && $scope.order[idx]))
				return;
			var selected = $filter('filter')($scope.dict[dict].values, {id: $scope.order[idx]});

			return ($scope.order[idx] && selected && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.create = function () {
			var order = new Orders({
				title: this.title,
				content: this.content
			});
			order.$save(function (response) {
				$location.path("orders/" + response._id);
			});

			this.title = "";
			this.content = "";
		};

		$scope.remove = function (order) {
			order.$remove();

		};

		$scope.update = function () {
			var order = $scope.order;

			order.$update(function (response) {
				//$location.path('societe/' + societe._id);
				pageTitle.setTitle('Commande client ' + order.ref);

				if (response.Status == "DRAFT" || response.Status == "NEW" || response.Status == "QUOTES" )
					$scope.editable = true;
				else
					$scope.editable = false;
				
				
			});
		};
		
		$scope.clone = function () {
			$scope.order.$clone(function (response) {
				$location.path("orders/" + response._id);
			});
		};

		$scope.find = function () {
			Orders.query({query: this.type.id, entity: Global.user.entity}, function (orders) {
				$scope.orders = orders;
				$scope.count = orders.length;
			});

			$http({method: 'GET', url: '/api/dict', params: {
					dictName: "fk_order_status"
				}
			}).success(function (data, status) {
				$scope.status = data;
			});
		};

		$scope.findOne = function () {
			Orders.get({
				Id: $routeParams.id
			}, function (order) {
				$scope.order = order;

				//on utilise idLine pour definir la ligne produit que nous voulons supprimer
				for (var i in $scope.order.lines) {
					$scope.order.lines[i].idLine = i;
				}

				if (order.Status == "DRAFT" || order.Status == "NEW" || order.Status == "QUOTES")
					$scope.editable = true;
				else
					$scope.editable = false;

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": order._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function (data, status) {
					if (status === 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				pageTitle.setTitle('Commande client ' + $scope.order.ref);
			}, function (err) {
				if (err.status === 401)
					$location.path("401.html");
			});
		};

		$scope.updateAddress = function (data) {
			//if(mode == 'bill')  {
			$scope.order.cond_reglement_code = data.cond_reglement_code;
			$scope.order.mode_reglement_code = data.mode_reglement_code;

			$scope.order.price_level = data.price_level;
			$scope.order.commercial_id = data.commercial_id;
			//}
			//console.log(data);
			if (data.address) {
				if (data.id == '5333032036f43f0e1882efce') { // Accueil
					$scope.order.billing = {
						sameBL0: true,
					};
					$scope.order.bl[0] = {};
				} else {
					$scope.order.bl[0].name = data.name;
					$scope.order.bl[0].address = data.address.address;
					$scope.order.bl[0].zip = data.address.zip;
					$scope.order.bl[0].town = data.address.town;
					$scope.order.billing = {
						sameBL0: false,
					};
				}
			}

			return true;
		};

		$scope.updateBillingAddress = function () {
			if ($scope.order.billing.sameBL0) {
				$scope.order.billing.name = $scope.order.bl[0].name;
				$scope.order.billing.address = $scope.order.bl[0].address;
				$scope.order.billing.zip = $scope.order.bl[0].zip;
				$scope.order.billing.town = $scope.order.bl[0].town;
			}

			return true;
		};
		/*
		 * NG-GRID for order list
		 */

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptions = {
			data: 'orders',
			filterOptions: $scope.filterOptions,
			sortInfo: {fields: ["date_livraison"], directions: ["desc"]},
			//showFilter:true,
			enableCellSelection: false,
			enableRowSelection: false,
			enableColumnResize: true,
			i18n: 'fr',
			rowTemplate: '<div style="height: 100%" ng-class="{\'green-bg\': (row.getProperty(\'Status\') == \'SEND\'),\'orange-bg\': (row.getProperty(\'Status\') == \'NEW\'), }"><div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell ">' +
					'<div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }"> </div>' +
					'<div ng-cell></div>' +
					'</div></div>',
			columnDefs: [
				{field: 'ref', displayName: 'Ref.', width: "160px", cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/orders/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a> <span data-ng-if="row.getProperty(\'notes\')" class="count inset orange-bg">{{row.getProperty(\'notes\').length}}</span></div>'},
				{field: 'client.name', displayName: 'Société'},
				{field: 'ref_client', displayName: 'Ref. client'},
				{field: 'contact.name', displayName: 'Contact', /*cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="/contact/fiche.php?id={{row.getProperty(\'contact.id\')}}" title="Voir le contact"><span class="icon-user"></span> {{row.getProperty(col.field)}}</a>'*/},
				{field: 'date_livraison', displayName: 'Date livraison', width: "100px", cellFilter: "date:'dd-MM-yyyy'"},
				{field: 'total_ht', displayName: 'Montant HT', cellFilter: "currency", cellClass: "align-right"},
				{field: 'status.name', displayName: 'Etat', headerClass: "blue", width: "180px",
					cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')" editable-select="row.getProperty(\'Status\')" buttons="no" e-form="StatusBtnForm" onbeforesave="updateInPlace(\'/api/commande\',\'Status\', row, $data)" e-ng-options="c.id as c.label for c in status.values">{{row.getProperty(\'status.name\')}}</small> <span class="icon-pencil grey" ng-click="StatusBtnForm.$show()" ng-hide="StatusBtnForm.$visible"></span></div>'
				},
				//cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>', editableCellTemplate: '<select ng-cell-input ng-class="\'colt\' + col.index" ng-model="row.entity.Status" ng-blur="updateInPlace(col, row)" ng-input="row.entity.Status" data-ng-options="c.id as c.label for c in status.values"></select>'},
				{field: 'entity', displayName: "Entité", cellClass: "align-center", width: 100, visible: Global.user.multiEntities},
				{displayName: "Actions", width: "80px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><a ng-href="/api/commande/pdf/{{row.getProperty(\'_id\')}}" class="button icon-download" title="Bon de commande PDF"></a><button class="button red-gradient icon-trash" disabled title="Supprimer"></button></div></div>'}
			]
		};

		$scope.addNew = function () {
			var modalInstance = $modal.open({
				templateUrl: '/partials/orders/create.html',
				controller: "OrderCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function (order) {
				$scope.orders.push(order);
				$scope.count++;
			}, function () {
			});
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
					}).
							success(function (data, status) {
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

		$scope.changeStatus = function (Status) {
			$scope.order.Status = Status;
			$scope.update();
		};
		
		/*
		 * NG-GRID for bill lines
		 */

		$scope.filterOptionsLines = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsLines = {
			data: 'order.lines',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsLines,
			i18n: 'fr',
			enableColumnResize: true,
			groups: ['group'],
			groupsCollapsedByDefault: false,
			rowHeight: 50,
			columnDefs: [
				{field: 'product.name', width: "60%", displayName: 'Désignation', cellTemplate: '<div class="ngCellText"><span class="blue strong icon-cart">{{row.getProperty(col.field)}}</span> - {{row.getProperty(\'product.label\')}}<pre class="no-padding">{{row.getProperty(\'description\')}}</pre></div>'},
				{field: 'group', displayName: "Groupe", visible: false},
				{field: 'qty', displayName: 'Qté', cellClass: "align-right"},
				{field: 'pu_ht', displayName: 'P.U. HT', cellClass: "align-right", cellFilter: "currency"},
				{field: 'tva_tx', displayName: 'TVA', cellClass: "align-right"},
				//{field: '', displayName: 'Réduc'},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "currency", cellClass: "align-right"},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button icon-pencil" title="Editer" ng-disabled="!editable" ng-click="editLine(row)"></button></button><button class="button orange-gradient icon-trash" title="Supprimer" ng-disabled="!editable" ng-confirm-click="Supprimer la ligne ?" confirmed-click="removeLine(row)"></button></div></div>'}
			],
			aggregateTemplate: "<div ng-click=\"row.toggleExpand()\" ng-style=\"rowStyle(row)\" class=\"ngAggregate\">" +
					"    <span class=\"ngAggregateText\"><span class='ngAggregateTextLeading'>{{row.label CUSTOM_FILTERS}}</span><br/><span class=\"anthracite strong\">Total HT: {{aggFunc(row,'total_ht') | currency}}</span></span>" +
					"    <div class=\"{{row.aggClass()}}\"></div>" +
					"</div>" +
					""
		};
		
		$scope.aggFunc = function (row, idx) {
			var total = 0;
			//console.log(row);
			angular.forEach(row.children, function (cropEntry) {
				if (cropEntry.entity[idx])
					total += cropEntry.entity[idx];
			});
			return total;
		};
		
		$scope.addNewLine = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/lines',
				controller: "LineController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return {
							qty: 0
						};
					},
					options: function() {
						return {
							price_level: $scope.order.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(line) {
				$scope.order.lines.push(line);
				$scope.order.$update(function(response) {
					$scope.order = response;
				});
			}, function() {
			});
		};

		$scope.editLine = function(row) {
			var modalInstance = $modal.open({
				templateUrl: '/partials/lines',
				controller: "LineController",
				windowClass: "steps",
				resolve: {
					object: function() {
						return row.entity;
					},
					options: function() {
						return {
							price_level: $scope.order.price_level
						};
					}
				}
			});

			modalInstance.result.then(function(line) {
				$scope.order.$update(function(response) {
					$scope.order = response;
				});
			}, function() {
			});
		};

		$scope.removeLine = function(row) {
			//console.log(row.entity._id);
			for (var i = 0; i < $scope.order.lines.length; i++) {
				if (row.entity._id === $scope.order.lines[i]._id) {
					$scope.order.lines.splice(i, 1);
					$scope.update();
					break;
				}
			}
		};


		/**
		 * Get fileType for icon
		 */
		$scope.getFileTypes = function () {
			$http({method: 'GET', url: 'dict/filesIcons'
			}).
					success(function (data, status) {
						if (status == 200) {
							iconsFilesList = data;
						}
					});
		};
		
		$scope.onFileSelect = function ($files) {
			//$files: an array of files selected, each file has name, size, and type.
			for (var i = 0; i < $files.length; i++) {
				var file = $files[i];
				if ($scope.order._id)
					$scope.upload = $upload.upload({
						url: 'api/commande/file/' + $scope.order._id,
						method: 'POST',
						// headers: {'headerKey': 'headerValue'},
						// withCredential: true,
						data: {myObj: $scope.myModelObj},
						file: file,
						// file: $files, //upload multiple files, this feature only works in HTML5 FromData browsers
						/* set file formData name for 'Content-Desposition' header. Default: 'file' */
						//fileFormDataName: myFile, //OR for HTML5 multiple upload only a list: ['name1', 'name2', ...]
						/* customize how data is added to formData. See #40#issuecomment-28612000 for example */
						//formDataAppender: function(formData, key, val){} 
					}).progress(function (evt) {
						console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
					}).success(function (data, status, headers, config) {
						// file is uploaded successfully
						//$scope.myFiles = "";
						//console.log(data);
						//if (!data.update) // if not file update, add file to files[]
						//	$scope.order.files.push(data.file);
						$scope.order = data;
					});
				//.error(...)
				//.then(success, error, progress); 
			}
		};

		$scope.suppressFile = function (id, fileName, idx) {
			$http({method: 'DELETE', url: 'api/commande/file/' + id + '/' + fileName
			}).
					success(function (data, status) {
						if (status == 200) {
							$scope.order.files.splice(idx, 1);
						}
					});
		};

		$scope.fileType = function (name) {
			if (typeof iconsFilesList[name.substr(name.lastIndexOf(".") + 1)] == 'undefined')
				return iconsFilesList["default"];

			return iconsFilesList[name.substr(name.lastIndexOf(".") + 1)];
		};

	}]);

angular.module('mean.system').controller('OrderCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Order', function ($scope, $http, $modalInstance, $upload, $route, Global, Order) {
		$scope.global = Global;

		//pageTitle.setTitle('Nouvelle commande');

		$scope.opened = [];

		$scope.init = function () {
			$scope.active = 1;
			$scope.order = {};
			$scope.order.bl = [];
			$scope.order.bl.push({});
			$scope.filePercentage = {};
			$scope.fileName = {};
			$scope.order.notes = []
			$scope.order.notes.push({});

			$scope.order.optional = {};
		};

		$scope.shipping = {
			default: "NONE",
			values: [
				{id: "NONE", label: "A diposition", address: false},
				{id: "TNT", label: "TNT", address: true},
				{id: "MAIL", label: "Courrier", address: true},
				{id: "COURSIER", label: "Coursier", address: true},
				{id: "TRANSPORTEUR", label: "Transporteur", address: true},
			]
		};

		$scope.billing = {
			default: "CHQ",
			values: [
				{id: "CPT", label: "En compte"},
				{id: "MONEY", label: "Espèce"},
				{id: "CHQ", label: "Chèque"},
				{id: "CB", label: "Carte bancaire"},
			]
		};

		$scope.open = function ($event, idx) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened[idx] = true;
		};


		$scope.create = function () {
			if (this.order._id)
				return;

			var order = new Order(this.order);

			order.$save(function (response) {
				$scope.order = response;
			});
		};

		$scope.update = function () {
			var order = $scope.order;

			order.$update(function (response) {
				$scope.order = response;
			});
		};

		$scope.isActive = function (idx) {
			if (idx == $scope.active)
				return "active";
		};

		$scope.next = function () {
			$scope.active++;
		};

		$scope.previous = function () {
			$scope.active--;
		};

		$scope.goto = function (idx) {
			if ($scope.active == 5)
				return;

			if (idx < $scope.active)
				$scope.active = idx;
		};

		$scope.societeAutoComplete = function (val) {
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

		$scope.initSelectFiles = function () {
			$http({method: 'GET', url: 'api/chaumeil/otis/selectFiles'
			}).success(function (data, status) {
				$scope.selectFiles = data;

				$timeout(function () {
					angular.element('select').change();
				}, 300);
			});
		};

		$scope.addDossier = function () {
			$scope.order.optional.dossiers.push({});
		};

		$scope.addDest = function () {
			$scope.order.bl.push({
				products: [
					{name: 'paper', qty: 0},
					{name: 'cd', qty: 0}
				]
			});
		};

		$scope.sendOrder = function () {
			$scope.order.datec = new Date();
			$scope.order.date_livraison = new Date();
			$scope.order.date_livraison.setDate($scope.order.date_livraison.getDate() + 5);

			$scope.order.Status = "NEW"; // commande validee

			$scope.order.notes[0].note = $scope.order.notes[0].note.replace(/\n/g, '<br/>');

			for (var i in this.order.bl) {
				var note = "";
				note += "Adresse de livraison : <br/><p>" + this.order.bl[i].name + "<br/>";
				note += this.order.bl[i].contact + "<br/>"
				note += this.order.bl[i].address + "<br/>";
				note += this.order.bl[i].zip + " " + this.order.bl[i].town + "</p>";

				$scope.order.notes.push({
					note: note,
					title: "Destinataire " + (parseInt(i) + 1),
					edit: false
				});
			}

			/*for (var j in $scope.order.optional.dossiers) {
			 // Add specific files
			 
			 var note = "";
			 note += '<h4 class="green underline">' + "Liste des fichiers natifs</h4>";
			 note += '<ul>';
			 for (var i in $scope.order.optional.dossiers[j].selectedFiles) {
			 if ($scope.order.optional.dossiers[j].selectedFiles[i] != null) {
			 note += '<li><a href="' + $scope.order.optional.dossiers[j].selectedFiles[i].url + '" target="_blank" title="Telecharger - ' + $scope.order.optional.dossiers[j].selectedFiles[i].filename + '">';
			 note += '<span class="icon-extract">' + i +"_" +$scope.order.optional.dossiers[j].selectedFiles[i].filename + '</span>';
			 note += '</a></li>';
			 }
			 }
			 note += '</ul>';
			 
			 
			 $scope.order.notes.push({
			 note: note,
			 title: "Fichiers webdoc dossier " + (parseInt(j) + 1),
			 edit: false
			 });
			 //console.log(note);
			 
			 
			 }*/

			$scope.update();
			$modalInstance.close($scope.order);
		};

		$scope.onFileSelect = function ($files, idx) {
			$scope.filePercentage[idx] = 0;
			//console.log(idx);
			//$files: an array of files selected, each file has name, size, and type.
			for (var i = 0; i < $files.length; i++) {
				var file = $files[i];

				//console.log(file);
				if ($scope.order)
					$scope.upload = $upload.upload({
						url: 'api/commande/file/' + $scope.order._id,
						method: 'POST',
						// headers: {'headerKey': 'headerValue'},
						// withCredential: true,
						data: {idx: idx},
						file: file,
						// file: $files, //upload multiple files, this feature only works in HTML5 FromData browsers
						/* set file formData name for 'Content-Desposition' header. Default: 'file' */
						//fileFormDataName: myFile, //OR for HTML5 multiple upload only a list: ['name1', 'name2', ...]
						/* customize how data is added to formData. See #40#issuecomment-28612000 for example */
						//formDataAppender: function(formData, key, val){} 
					}).progress(function (evt) {
						$scope.filePercentage[idx] = parseInt(100.0 * evt.loaded / evt.total);
					}).success(function (data, status, headers, config) {
						// file is uploaded successfully
						//$scope.myFiles = "";
						//console.log(data);

						$scope.order.files = data.files;
						$scope.order.__v = data.__v; // for update

						$scope.filePercentage[idx] = 100;
						$scope.fileName[idx] = file.name;
					});
				//.error(...)
				//.then(success, error, progress); 
			}
		};

		$scope.suppressFile = function (id, fileName, idx) {
			//console.log(id);
			//console.log(fileName);
			//console.log(idx);
			//CO0214-00060_pvFeuPorte_Dossier1_UGAP_422014.csv

			fileName = $scope.order.ref + "_" + idx + "_" + fileName;

			$http({method: 'DELETE', url: 'api/commande/file/' + id + '/' + fileName
			}).success(function (data, status) {
				if (status == 200) {
					$scope.order.files = data.files;
					$scope.order.__v = data.__v; // for update

					$scope.filePercentage[idx] = 0;

				}
			});
		};

	}]);
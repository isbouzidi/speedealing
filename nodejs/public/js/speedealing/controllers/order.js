angular.module('mean.orders').controller('OrderController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$timeout', 'pageTitle', 'Global', 'Orders', function($scope, $location, $http, $routeParams, $modal, $timeout, pageTitle, Global, Orders) {

		pageTitle.setTitle('Liste des commandes');

		$scope.types = [{name: "En cours", id: "NOW"},
			{name: "Clos", id: "CLOSED"}];

		$scope.type = {name: "En cours", id: "NOW"};

		$scope.create = function() {
			var societe = new Societe({
				title: this.title,
				content: this.content
			});
			societe.$save(function(response) {
				$location.path("societe/" + response._id);
			});

			this.title = "";
			this.content = "";
		};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.update = function() {
			var societe = $scope.societe;

			societe.$update(function() {
				//$location.path('societe/' + societe._id);
			});
		};

		$scope.find = function() {
			Orders.query({query: this.type.id, entity: Global.user.entity}, function(orders) {
				$scope.orders = orders;
				$scope.count = orders.length;
			});

			$http({method: 'GET', url: '/api/commande/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
			});
		};

		$scope.findOne = function() {
			Societe.get({
				Id: $routeParams.id
			}, function(societe) {
				$scope.societe = societe;
				pageTitle.setTitle('Fiche ' + $scope.societe.name);
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
			data: 'orders',
			filterOptions: $scope.filterOptions,
			sortInfo: {fields: ["date_livraison"], directions: ["desc"]},
			//showFilter:true,
			enableCellSelection: false,
			enableRowSelection: false,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'ref', displayName: 'Ref', width: "140px", cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="/commande/fiche.php?id={{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-bag"></span> {{row.getProperty(col.field)}}</a></div>'},
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

		$scope.order = {};

		$scope.addNew = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/orders/create.html',
				controller: "OrderCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function(order) {
				$scope.orders.push(order);
				$scope.count++;
			}, function() {
			});
		};

		$scope.updateInPlace = function(api, field, row, newdata) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function() {
					$http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
						data: {
							oldvalue: row.entity[field],
							value: newdata
						}
					}).
							success(function(data, status) {
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

	}]);

angular.module('mean.system').controller('OrderCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Order', function($scope, $http, $modalInstance, $upload, $route, Global, Order) {
		$scope.global = Global;

		//pageTitle.setTitle('Nouvelle commande');

		$scope.init = function() {
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
		}

		$scope.create = function() {
			if (this.order._id)
				return;

			var order = new Order(this.order);

			order.$save(function(response) {
				$scope.order = response;
			});
		};

		$scope.update = function() {
			var order = $scope.order;

			order.$update(function(response) {
				$scope.order = response;
			});
		};

		$scope.isActive = function(idx) {
			if (idx == $scope.active)
				return "active";
		};

		$scope.next = function() {
			$scope.active++;
		};

		$scope.previous = function() {
			$scope.active--;
		};

		$scope.goto = function(idx) {
			if ($scope.active == 5)
				return;

			if (idx < $scope.active)
				$scope.active = idx;
		};

		$scope.societeAutoComplete = function(val) {
			return $http.post('api/societe/autocomplete', {
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

		$scope.initSelectFiles = function() {
			$http({method: 'GET', url: 'api/chaumeil/otis/selectFiles'
			}).success(function(data, status) {
				$scope.selectFiles = data;

				$timeout(function() {
					angular.element('select').change();
				}, 300);
			});
		};

		$scope.addDossier = function() {
			$scope.order.optional.dossiers.push({});
		};

		$scope.addDest = function() {
			$scope.order.bl.push({
				products: [
					{name: 'paper', qty: 0},
					{name: 'cd', qty: 0}
				]
			});
		};

		$scope.sendOrder = function() {
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

		$scope.onFileSelect = function($files, idx) {
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
					}).progress(function(evt) {
						$scope.filePercentage[idx] = parseInt(100.0 * evt.loaded / evt.total);
					}).success(function(data, status, headers, config) {
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

		$scope.suppressFile = function(id, fileName, idx) {
			//console.log(id);
			//console.log(fileName);
			//console.log(idx);
			//CO0214-00060_pvFeuPorte_Dossier1_UGAP_422014.csv

			fileName = $scope.order.ref + "_" + idx + "_" + fileName;

			$http({method: 'DELETE', url: 'api/commande/file/' + id + '/' + fileName
			}).success(function(data, status) {
				if (status == 200) {
					$scope.order.files = data.files;
					$scope.order.__v = data.__v; // for update

					$scope.filePercentage[idx] = 0;

				}
			});
		};

	}]);
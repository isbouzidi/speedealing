angular.module('mean.societes').controller('SocieteController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'pageTitle', 'Global', 'Societes', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, pageTitle, Global, Societe) {

		pageTitle.setTitle('Liste des sociétés');

		$scope.societe = {};
		$scope.societes = [];
		$scope.gridOptionsSociete = {};

		$scope.types = [{name: "Client/Prospect", id: "CUSTOMER"},
			{name: "Fournisseur", id: "SUPPLIER"},
			{name: "Sous-traitants", id: "SUBCONTRACTOR"},
			{name: "Non determine", id: "SUSPECT"},
			{name: "Tous", id: "ALL"}];

		$scope.type = {name: "Client/Prospect", id: "CUSTOMER"};

		$scope.init = function() {
			var fields = ["Status", "fournisseur", "prospectlevel", "typent_id", "effectif_id", "forme_juridique_code"];

			angular.forEach(fields, function(field) {
				$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
						field: field
					}
				}).success(function(data, status) {
					$scope[field] = data;
					//console.log(data);
				});
			});
		};

		$scope.segmentationAutoComplete = function(val) {
			return $http.post('api/societe/segmentation/autocomplete', {
				take: 5,
				skip: 0,
				page: 1,
				pageSize: 5,
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				//console.log(res.data);
				return res.data
			});
		};

		$scope.showStatus = function(idx) {
			if (!($scope[idx] && $scope.societe[idx]))
				return;
			var selected = $filter('filter')($scope[idx].values, {id: $scope.societe[idx]});

			return ($scope.societe[idx] && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.update = function() {
			var societe = $scope.societe;

			societe.$update(function(response) {
				pageTitle.setTitle('Fiche ' + societe.name);
				$scope.checklist = 0;
				for (var i in response.checklist)
					if (response.checklist[i])
						$scope.checklist++;
			});
		};

		$scope.find = function() {
			Societe.query({query: this.type.id}, function(societes) {
				$scope.societes = societes;
				$scope.countSocietes = societes.length;
			});
		};

		$scope.findOne = function() {
			Societe.get({
				Id: $routeParams.id
			}, function(societe) {
				$scope.societe = societe;

				$http({method: 'GET', url: 'api/ticket', params:
							{
								find: {"linked.id": societe._id},
								fields: "name ref updatedAt percentage Status task"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.tickets = data;

					$scope.countTicket = $scope.tickets.length;
				});

				$http({method: 'GET', url: 'api/europexpress/buy', params:
							{
								find: {"fournisseur.id": societe._id},
								fields: "title ref datec Status total_ht"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.requestBuy = data;

					$scope.TotalBuy = 0;
					angular.forEach($scope.requestBuy, function(row) {
						if (row.Status.id == "PAYED")
							$scope.TotalBuy += row.total_ht;
					});
					$scope.countBuy = $scope.requestBuy.length;
				});

				pageTitle.setTitle('Fiche ' + $scope.societe.name);
				$scope.checklist = 0;
				for (var i in societe.checklist)
					if (societe.checklist[i])
						$scope.checklist++;
			});

			$http({method: 'GET', url: '/api/europexpress/buy/status/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
			});
		};

		/*
		 * NG-GRID for societe list
		 */

		$scope.filterOptionsSociete = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsSociete = {
			data: 'societes',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsSociete,
			sortInfo: {fields: ["name"], directions: ["asc"]},
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-home"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'commercial_id.name', displayName: 'Commerciaux', cellTemplate: '<div class="ngCellText" ng-show="row.getProperty(col.field)"><span class="icon-user"> {{row.getProperty(col.field)}}</span></div>'},
				{field: 'zip', displayName: 'Code Postal'},
				{field: 'town', displayName: 'Ville'},
				{field: 'idprof3', displayName: 'APE'},
				{field: 'Tag', displayName: 'Catégories', cellTemplate: '<div class="ngCellText"><small ng-repeat="category in row.getProperty(col.field)" class="tag anthracite-gradient glossy small-margin-right">{{category}}</small></div>'},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'prospectLevel.name', displayName: 'Potentiel', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'prospectLevel.css\')}} glossy">{{row.getProperty(\'prospectLevel.name\')}}</small></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};

		$scope.initCharts = function() {
			$http({method: 'GET', url: '/core/ajax/viewgraph.php?json=graphPieStatus&class=Societe'
			}).success(function(data, status) {
				console.log(data);
				$scope.pieChartConfig.series[0] = {
					data: data,
					type: "funnel",
					name: "Quantité",
					//size: 100
				};
			});

			$http({method: 'GET', url: '/core/ajax/viewgraph.php', params: {
					json: "graphBarStatus",
					class: "Societe",
					name: Global.user.name
				}
			}).success(function(data, status) {
				console.log(data);
				$scope.barChartConfig.series = [];


				$scope.barChartConfig.series[0] = {
					data: data,
					name: "admin"
				};
			});
		}


		/**
		 * Highcharts Pie
		 */

		$scope.pieChartConfig = {
			options: {
				chart: {
					type: 'funnel',
					//margin: 0,
					plotBackgroundColor: null,
					plotBorderWidth: null,
					plotShadow: false,
					marginRight: 120
				},
				legend: {
					enabled: false
				},
				tooltip: {
					enabled: true,
					formatter: function() {
						return '<b>' + this.point.name + '</b>: ' + Math.round(this.percentage * 100) / 100 + ' %';
					}
				},
				//navigator: {
				//	margin: 30
				//},
				plotOptions: {
					/*pie: {
					 allowPointSelect: true,
					 cursor: 'pointer',
					 dataLabels: {
					 enabled: true,
					 color: '#FFF',
					 connectorColor: '#FFF',
					 distance: 30,
					 formatter: function() {
					 return '<b>' + this.point.name + '</b><br> ' + Math.round(this.percentage) + ' %';
					 }
					 }
					 },*/
					series: {
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b> ({point.y:,.0f})',
							color: '#FFF',
							connectorColor: '#FFF',
							softConnector: true
						},
						neckWidth: '30%',
						neckHeight: '25%'

								//-- Other available options
								// height: pixels or percent
								// width: pixels or percent
					}
				}
			},
			title: {
				text: null
			},
			series: []
		};

		$scope.barChartConfig = {
			options: {
				chart: {
					renderTo: 'bar-status',
					defaultSeriesType: "column",
					zoomType: "x",
					marginBottom: 30
				},
				credits: {
					enabled: false
				},
				xAxis: {
					categories: ['Ne pas contacter', 'Non déterminé', 'Prospect froid', 'Prospect chaud', 'Client -3 mois', 'Client récurrent', 'Client fidèle'],
					maxZoom: 1
							//labels: {rotation: 90, align: "left"}
				},
				yAxis: {
					title: {text: "Total"},
					allowDecimals: false,
					min: 0
				},
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'top',
					x: -5,
					y: 5,
					floating: true,
					borderWidth: 1,
					backgroundColor: Highcharts.theme.legendBackgroundColor || '#FFFFFF',
					shadow: true
				},
				tooltip: {
					enabled: true,
					formatter: function() {
						//return this.point.name + ' : ' + this.y;
						return '<b>' + this.x + '</b><br/>' +
								this.series.name + ': ' + this.y;
					}
				}
			},
			title: {
				//text: "<?php echo $langs->trans("SalesRepresentatives"); ?>"
				text: null
			},
			series: []
		};

		$scope.addNew = function() {
			var modalInstance = $modal.open({
				templateUrl: '/partials/societes/create.html',
				controller: "SocieteCreateController",
				windowClass: "steps"
			});

			modalInstance.result.then(function(societe) {
				$scope.societes.push(societe);
				$scope.countSocietes++;
			}, function() {
			});
		};

		$scope.addNote = function() {
			if (!this.note)
				return;

			var note = {};
			note.note = this.note;
			note.datec = new Date();
			note.author = {}
			note.author.id = Global.user._id;
			note.author.name = Global.user.firstname + " " + Global.user.lastname;

			if (!$scope.societe.notes)
				$scope.societe.notes = [];

			$scope.societe.notes.push(note);
			$scope.update();
			this.note = "";
		};

		var iconsFilesList = {};

		/**
		 * Get fileType for icon
		 */
		$scope.getFileTypes = function() {
			$http({method: 'GET', url: 'dict/filesIcons'
			}).
					success(function(data, status) {
				if (status == 200) {
					iconsFilesList = data;
				}
			});
		};

		$scope.onFileSelect = function($files) {
			//$files: an array of files selected, each file has name, size, and type.
			for (var i = 0; i < $files.length; i++) {
				var file = $files[i];
				if ($scope.societe)
					$scope.upload = $upload.upload({
						url: 'api/societe/file/' + $scope.societe._id,
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
					}).progress(function(evt) {
						console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
					}).success(function(data, status, headers, config) {
						// file is uploaded successfully
						//$scope.myFiles = "";
						//console.log(data);
						if (!data.update) // if not file update, add file to files[]
							$scope.societe.files.push(data.file);
					});
				//.error(...)
				//.then(success, error, progress); 
			}
		};

		$scope.suppressFile = function(id, fileName, idx) {
			$http({method: 'DELETE', url: 'api/societe/file/' + id + '/' + fileName
			}).
					success(function(data, status) {
				if (status == 200) {
					$scope.societe.files.splice(idx, 1);
				}
			});
		};

		$scope.fileType = function(name) {
			if (typeof iconsFilesList[name.substr(name.lastIndexOf(".") + 1)] == 'undefined')
				return iconsFilesList["default"];

			return iconsFilesList[name.substr(name.lastIndexOf(".") + 1)];
		};

		/*
		 * NG-GRID for ticket list
		 */

		$scope.filterOptionsTicket = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsTicket = {
			data: 'tickets',
			enableRowSelection: false,
			sortInfo: {fields: ["updatedAt"], directions: ["desc"]},
			filterOptions: $scope.filterOptionsTicket,
			i18n: 'fr',
			enableColumnResize: true,
			columnDefs: [
				{field: 'name', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ticket/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-ticket"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', displayName: 'Id'},
				{field: 'percentage', displayName: 'Etat', cellTemplate: '<div class="ngCellText"><progressbar class="progress-striped thin" value="row.getProperty(col.field)" type="success"></progressbar></div>'},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"}
			]
		};

		/*
		 * NG-GRID for ticket list
		 */

		$scope.filterOptionsBuy = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsBuyer = {
			data: 'requestBuy',
			enableRowSelection: false,
			sortInfo: {fields: ["ref"], directions: ["desc"]},
			filterOptions: $scope.filterOptionsBuy,
			i18n: 'fr',
			enableColumnResize: true,
			enableCellEditOnFocus: true,
			enableCellSelection: false,
			columnDefs: [
				{field: 'title', displayName: 'Titre', enableCellEdit: false, cellTemplate: '<div class="ngCellText"><a ng-href="/api/europexpress/buy/pdf/{{row.getProperty(\'_id\')}}" target="_blank"><span class="icon-cart"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'ref', displayName: 'Id', enableCellEdit: false},
				//{field: 'Status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText center"><small class="tag glossy" ng-class="row.getProperty(\'Status.css\')">{{row.getProperty(\"Status.name\")}}</small></div>'},
				{field: 'Status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'Status.css\')}} glossy">{{row.getProperty(\'Status.name\')}}</small></div>', editableCellTemplate: '<select ng-cell-input ng-class="\'colt\' + col.index" ng-model="row.entity.Status" ng-blur="updateInPlace(\'/api/europexpress/buy\',\'Status\', row)" ng-input="row.entity.Status" data-ng-options="c.id as c.name for c in status"></select>'},
				{field: 'datec', displayName: 'Date création', enableCellEdit: false, cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"},
				{field: 'total_ht', displayName: 'Total HT', cellFilter: "euro", cellClass: "align-right", editableCellTemplate: '<input ng-class="\'colt\' + col.index" ng-model="COL_FIELD" ng-input="COL_FIELD" class="input" ng-blur="updateInPlace(\'/api/europexpress/buy\',\'total_ht\', row)"/>'}
			]
		};

		$scope.updateInPlace = function(api, field, row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function() {
					$http({method: 'PUT', url: api + '/' + row.entity._id + '/' + field,
						data: {
							value: row.entity[field]
						}
					}).
							success(function(data, status) {
						if (status == 200) {
							if (data.value) {
								if (data.field === "Status")
									for (var i = 0; i < $scope.status.length; i++) {
										if ($scope.status[i].id === data.value)
											row.entity.Status = $scope.status[i];
									}
							}
						}
					});

					$scope.save.pending = false;
				}, 500);
			}
		};


	}]);

angular.module('mean.societes').controller('SocieteCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Societes', function($scope, $http, $modalInstance, $upload, $route, Global, Societes) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.validSiret = false;
		$scope.societe = {};
		$scope.siretFound = "";

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

		$scope.init = function() {
			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "Status"
				}
			}).success(function(data, status) {
				$scope.status = data;
				//console.log(data);
				$scope.societe.Status = data.default;
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "fournisseur"
				}
			}).success(function(data, status) {
				$scope.fournisseur = data;
				//console.log(data);
				$scope.societe.fournisseur = "NO";
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "prospectlevel"
				}
			}).success(function(data, status) {
				$scope.potential = data;
				//console.log(data);
				$scope.societe.prospectlevel = data.default;
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "typent_id"
				}
			}).success(function(data, status) {
				$scope.typent = data;
				//console.log(data);
				$scope.societe.typent_id = data.default;
			});

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "effectif_id"
				}
			}).success(function(data, status) {
				$scope.effectif = data;
				//console.log(data);
				$scope.societe.effectif_id = data.default;
			});

			$scope.societe.commercial_id = {
				id: Global.user._id,
				name: Global.user.firstname + " " + Global.user.lastname
			}

			$http({method: 'GET', url: '/api/societe/fk_extrafields/select', params: {
					field: "forme_juridique_code"
				}
			}).success(function(data, status) {
				$scope.forme_juridique = data;
				//console.log(data);
				$scope.societe.forme_juridique_code = data.default;
			});

			$scope.societe.price_level = "BASE";
			$scope.societe.capital = 0;
		};

		$scope.create = function() {
			var societe = new Societes(this.societe);
			societe.$save(function(response) {
				//console.log(response);
				$modalInstance.close(response);
				//$location.path("societe/" + response._id);
			});
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
				return res.data
			});
		};

		$scope.priceLevelAutoComplete = function(val) {
			return $http.post('api/product/price_level/autocomplete', {
				take: '5',
				skip: '0',
				page: '1',
				pageSize: '5',
				filter: {logic: 'and', filters: [{value: val}]
				}
			}).then(function(res) {
				return res.data
			});
		};

		$scope.isValidSiret = function() {
			var siret = $scope.societe.idprof2;
			$scope.siretFound = "";
			$scope.societe.idprof1 = "";

			var isValide;
			if (!siret || siret.length != 14 || isNaN(siret))
				isValide = false;
			else {
				// Donc le SIRET est un numérique à 14 chiffres
				// Les 9 premiers chiffres sont ceux du SIREN (ou RCS), les 4 suivants
				// correspondent au numéro d'établissement
				// et enfin le dernier chiffre est une clef de LUHN. 
				var somme = 0;
				var tmp;
				for (var cpt = 0; cpt < siret.length; cpt++) {
					if ((cpt % 2) == 0) { // Les positions impaires : 1er, 3è, 5è, etc... 
						tmp = siret.charAt(cpt) * 2; // On le multiplie par 2
						if (tmp > 9)
							tmp -= 9;	// Si le résultat est supérieur à 9, on lui soustrait 9
					}
					else
						tmp = siret.charAt(cpt);
					somme += parseInt(tmp);
				}
				if ((somme % 10) == 0) {
					isValide = true; // Si la somme est un multiple de 10 alors le SIRET est valide 
					$scope.societe.idprof1 = siret.substr(0, 9);
				} else {
					isValide = false;
				}
			}

			if (isValide)
				$http({method: 'GET', url: '/api/societe/uniqId', params: {
						idprof2: siret
					}
				}).success(function(data, status) {
					$scope.validSiret = isValide;
					if (data.name) { // already exist
						$scope.siretFound = data;
					}
				});
			else
				$scope.validSiret = isValide;
		};
	}]);
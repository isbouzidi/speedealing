angular.module('mean.societes').controller('SocieteController', ['$scope', '$location', '$http', '$routeParams', '$modal', '$filter', '$upload', '$timeout', 'dialogs', 'pageTitle', 'Global', 'Societes', function($scope, $location, $http, $routeParams, $modal, $filter, $upload, $timeout, $dialogs, pageTitle, Global, Societe) {

		pageTitle.setTitle('Liste des sociétés');

		$scope.societe = {};
		$scope.societes = [];
		$scope.segementations = [];
		$scope.gridOptionsSociete = {};
		$scope.gridOptionsSegementation = {};

		$scope.types = [{name: "Client/Prospect", id: "CUSTOMER"},
			{name: "Fournisseur", id: "SUPPLIER"},
			{name: "Sous-traitants", id: "SUBCONTRACTOR"},
			{name: "Non determine", id: "SUSPECT"},
			{name: "Tous", id: "ALL"}];

		$scope.type = {name: "Client/Prospect", id: "CUSTOMER"};

		$scope.init = function() {
			var fields = ["Status", "fournisseur", "prospectlevel", "typent_id", "effectif_id", "forme_juridique_code", "cond_reglement", "mode_reglement"];

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
				return 'Non défini';
			var selected = $filter('filter')($scope[idx].values, {id: $scope.societe[idx]});

			return ($scope.societe[idx] && selected && selected.length) ? selected[0].label : 'Non défini';
		};

		$scope.remove = function(societe) {
			societe.$remove();

		};

		$scope.checkCodeClient = function(data) {
			return $http.get('api/societe/' + data).then(function(societe) {
				//console.log(societe.data);
				if (societe.data._id && $scope.societe._id !== societe.data._id)
					return "Existe deja !";
				else
					return true;
			});

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
			var sb = {};
			for (var i = 0; i < $scope.sortOptionsSociete.fields.length; i++) {
				sb[$scope.sortOptionsSociete.fields[i]] = $scope.sortOptionsSociete.directions[i] === "desc" ? -1 : 1;
			}

			var p = {
				fields: "_id commercial_id Status name zip town prospectlevel entity attractivity idprof3 effectif_id typent_id code_client",
				query: this.type.id,
				entity: Global.user.entity,
				//filter: $scope.filterOptionsSociete.filterText,
				skip: $scope.pagingOptionsSociete.currentPage - 1,
				limit: $scope.pagingOptionsSociete.pageSize,
				sort: sb
			};

			Societe.query(p, function(societes) {
				$scope.societes = societes;
				$scope.countSocietes = societes.length;
			});

			$http({method: 'GET', url: '/api/societe/count', params: p
			}).success(function(data, status) {
				$scope.totalCountSociete = data.count;
				$scope.maxPageSociete = Math.ceil(data.count / 500);
			});
		};

		$scope.findSegmentation = function() {
			$http({method: 'GET', url: '/api/societe/segmentation'
			}).success(function(data, status) {
				$scope.segmentations = data;
				$scope.countSegmentations = data.length;
			});
		};

		$scope.findOne = function() {
			Societe.get({
				Id: $routeParams.id
			}, function(societe) {
				$scope.societe = societe;

				$http({method: 'GET', url: 'api/societe/contact', params:
							{
								find: {"societe.id": societe._id},
								fields: "name firstname lastname updatedAt Status phone email poste"
							}
				}).success(function(data, status) {
					if (status == 200)
						$scope.contacts = data;

					$scope.countContact = $scope.contacts.length;
				});

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
			}, function(err) {
				if (err.status == 401)
					$location.path("401.html");
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

		// paging
		$scope.totalCountSociete = 0;

		$scope.pagingOptionsSociete = {
			pageSizes: [500, 1000, 2500, 5000],
			pageSize: 1000,
			currentPage: 1
		};

		$scope.$watch('pagingOptionsSociete', function(newVal, oldVal) {
			if (newVal.currentPage !== oldVal.currentPage) {
				$scope.find();
			}
		}, true);

		// sorting
		$scope.sortOptionsSociete = {fields: ["name"], directions: ["asc"]};

		$scope.gridOptionsSociete = {
			data: 'societes',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsSociete,
			pagingOptions: $scope.pagingOptionsSociete,
			sortInfo: $scope.sortOptionsSociete,
			useExternalSorting: true,
			enablePaging: true,
			//showFilter:true,
			enableColumnResize: true,
			i18n: 'fr',
			columnDefs: [
				{field: 'code_client', displayName: 'Code Client', visible: false, width: '110px'},
				{field: 'name', displayName: 'Société', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/societes/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"top"}\' title=\'{{row.getProperty(col.field)}}\'><span class="icon-home"></span> {{row.getProperty(col.field)}} <small ng-show="row.getProperty(\'code_client\')">({{row.getProperty(\'code_client\')}})</small></a>'},
				{field: 'commercial_id.name', displayName: 'Commerciaux',
					cellTemplate: '<div class="ngCellText align-center"><span editable-text="row.getProperty(\'commercial_id\')" buttons="no" e-form="CommercialIdBtnForm" e-typeahead="user as user.name for user in userAutoComplete($viewValue) | filter:{name:$viewValue}" e-typeahead-on-select="updateInPlace(\'/api/societe\',\'commercial_id\', row, $item); CommercialIdBtnForm.$cancel();" ><span class="icon-user" ng-show="row.getProperty(col.field)"></span> {{row.getProperty(col.field)}}</span> <span class="icon-pencil grey" ng-click="CommercialIdBtnForm.$show()" ng-hide="CommercialIdBtnForm.$visible"></span>'
				},
				{field: 'zip', displayName: 'Code Postal', width: '80px'},
				{field: 'town', displayName: 'Ville'},
				{field: 'idprof3', displayName: 'APE', width: '40px'},
				//{field: 'Tag', displayName: 'Catégories', cellTemplate: '<div class="ngCellText"><small ng-repeat="category in row.getProperty(col.field)" class="tag anthracite-gradient glossy small-margin-right">{{category}}</small></div>'},
				{field: 'status.name', width: '150px', displayName: 'Etat',
					cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'status.css\')" editable-select="row.getProperty(\'Status\')" buttons="no" e-form="StatusBtnForm" onbeforesave="updateInPlace(\'/api/societe\',\'Status\', row, $data)" e-ng-options="s.id as s.label for s in Status.values">{{row.getProperty(\'status.name\')}}</small> <span class="icon-pencil grey" ng-click="StatusBtnForm.$show()" ng-hide="StatusBtnForm.$visible"></span>'
				},
				{field: 'prospectLevel.name', displayName: 'Potentiel', width: '130px',
					//cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'prospectLevel.css\')}} glossy">{{row.getProperty(\'prospectLevel.name\')}}</small></div>'},
					cellTemplate: '<div class="ngCellText align-center"><small class="tag glossy" ng-class="row.getProperty(\'prospectLevel.css\')" editable-select="row.getProperty(\'prospectlevel\')" buttons="no" e-form="ProspectLevelBtnForm" onbeforesave="updateInPlace(\'/api/societe\',\'prospectlevel\', row, $data)" e-ng-options="s.id as s.label for s in prospectlevel.values">{{row.getProperty(\'prospectLevel.name\')}}</small> <span class="icon-pencil grey" ng-click="ProspectLevelBtnForm.$show()" ng-hide="ProspectLevelBtnForm.$visible"></span>'
				},
				{field: 'entity', displayName: 'Entité', cellClass: "align-center", width: '100px'},
				{field: 'attractivity', width: "50px", displayName: 'Attractivité', cellClass: "align-right"}
				//{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy'"}
			]
		};

		$scope.$watch('filterOptionsSociete', function(newVal, oldVal) {
			if (newVal.filterText !== oldVal.filterText) {
				$scope.find();
			}
		}, true);

		$scope.$watch('sortOptionsSociete', function(newVal, oldVal) {
			if (newVal.directions[0] !== oldVal.directions[0] && newVal.fields[0] !== oldVal.fields[0]) {
				$scope.find();
			}
		}, true);

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

		/*
		 * NG-GRID for societe segmentation list
		 */

		$scope.filterOptionsSegmentation = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsSegementation = {
			data: 'segmentations',
			enableRowSelection: false,
			filterOptions: $scope.filterOptionsSegmentation,
			sortInfo: {fields: ["_id"], directions: ["asc"]},
			//showFilter:true,
			enableColumnResize: true,
			enableCellSelection: true,
			enableCellEditOnFocus: true,
			i18n: 'fr',
			columnDefs: [
				{field: '_id', displayName: 'Segmentation', enableCellEdit: false},
				{field: 'count', displayName: 'Nombre', cellClass: "align-right", enableCellEdit: false},
				{field: 'attractivity', displayName: 'Attractivité', cellClass: "align-right", editableCellTemplate: '<input type="number" step="1" ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-blur="updateSegmentation(row)"/>'},
				{displayName: "Actions", enableCellEdit: false, width: "100px", cellTemplate: '<div class="ngCellText align-center"><div class="button-group align-center compact children-tooltip"><button class="button icon-pencil" title="Renommer" ng-click="renameSegmentation(row)"></button></button><button class="button red-gradient icon-trash" title="Supprimer" ng-confirm-click="Supprimer la segmentation ?" confirmed-click="removeSegmentation(row)"></button></div></div>'}
			]
		};

		$scope.updateSegmentation = function(row) {
			if (!$scope.save) {
				$scope.save = {promise: null, pending: false, row: null};
			}
			$scope.save.row = row.rowIndex;

			var d = new Date();

			if (!$scope.save.pending) {
				$scope.save.pending = true;
				$scope.save.promise = $timeout(function() {
					$http({method: 'PUT', url: 'api/societe/segmentation', data: row.entity
					}).success(function(data, status) {
						$scope.save.pending = false;
					});
				}, 200);
			}
		};

		$scope.removeSegmentation = function(row) {
			for (var i = 0; i < $scope.segmentations.length; i++) {
				if (row.entity._id === $scope.segmentations[i]._id) {
					$http({method: 'DELETE', url: 'api/societe/segmentation', data: row.entity
					}).success(function(data, status) {
						$scope.segmentations.splice(i, 1);
						$scope.countSegmentations--;
					});
					break;
				}
			}
		};

		$scope.renameSegmentation = function(row) {
			var dlg = null;
			for (var i = 0; i < $scope.segmentations.length; i++) {
				if (row.entity._id === $scope.segmentations[i]._id) {
					dlg = $dialogs.create('rename.html', 'SocieteSegmentationRenameController', row.entity, {key: false, back: 'static'});
					dlg.result.then(function(newval) {
						//console.log(newval);
						$http({method: 'POST', url: 'api/societe/segmentation', data: {
								old: row.entity._id,
								new : newval
							}
						}).success(function(data, status) {
							$scope.findSegmentation();
						});
					}, function() {
					});

					break;
				}
			}
		};


		//$scope.chartFunnelData = [[]];

		$scope.initCharts = function() {
			$http({method: 'GET', url: '/api/societe/statistic', params: {
					entity: Global.user.entity,
					name: Global.user.name
				}
			}).success(function(data, status) {
				//console.log(data);
				$scope.chartData = data.data;

				var series = [];
				for (var i = 0; i < data.commercial.length; i++) {
					series.push({label: data.commercial[i]._id});
				}

				$scope.chartOptions.series = series;

				var xaxis = [];
				for (var i = 0; i < data.status.length; i++) {
					xaxis.push(data.status[i].label);
				}

				$scope.chartOptions.axes.xaxis.ticks = xaxis;

				var funnelData = [];
				$scope.chartFunnelData = [];
				for (var i = 0; i < data.own.length; i++) {
					var tab = [];
					tab.push(data.own[i]._id.label);
					tab.push(data.own[i].count);

					funnelData.push(tab);
				}
				//console.log(funnelData);
				$scope.chartFunnelData.push(funnelData);

			});
		};

		$scope.chartOptions = {
			// The "seriesDefaults" option is an options object that will
			// be applied to all series in the chart.
			seriesDefaults: {
				renderer: jQuery.jqplot.BarRenderer,
				rendererOptions: {fillToZero: true, barPadding: 4}
				//pointLabels: {show: true, location: 'n', edgeTolerance: -15}
			},
			// Custom labels for the series are specified with the "label"
			// option on the series option.  Here a series option object
			// is specified for each series.
			series: [],
			seriesColors: ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
				"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
			textColor: "#fff",
			// Show the legend and put it outside the grid, but inside the
			// plot container, shrinking the grid to accomodate the legend.
			// A value of "outside" would not shrink the grid and allow
			// the legend to overflow the container.
			legend: {
				show: true,
				placement: 'insideGrid'
			},
			axes: {
				// Use a category axis on the x axis and use our custom ticks.
				xaxis: {
					renderer: jQuery.jqplot.CategoryAxisRenderer,
					ticks: []
				},
				// Pad the y axis jsust a little so bars can get close to, but
				// not touch, the grid boundaries.  1.2 is the default padding.
				yaxis: {
					pad: 1.05,
					padMin: 0,
					tickOptions: {formatString: '%d', color: 'white'}
				}
			},
			grid: {
				backgroundColor: 'transparent',
				drawGridlines: false,
				drawBorder: false
			},
			highlighter: {
				sizeAdjust: 0,
				tooltipLocation: 'n',
				tooltipAxes: 'y',
				tooltipFormatString: '<b><span>%d</span></b>',
				useAxesFormatters: false,
				show: true
			},
			/*highlighter: {
			 show: true,
			 sizeAdjust: 7.5
			 },*/
			cursor: {
				show: false
			}
		};

		$scope.chartFunnelOptions = {
			// The "seriesDefaults" option is an options object that will
			// be applied to all series in the chart.
			title: 'Situation de mon porte-feuille',
			seriesDefaults: {
				renderer: jQuery.jqplot.FunnelRenderer,
				rendererOptions: {
					sectionMargin: 1,
					widthRatio: 0.3,
					showDataLabels: true
				}

				//pointLabels: {show: true, location: 'n', edgeTolerance: -15}
			},
			// Custom labels for the series are specified with the "label"
			// option on the series option.  Here a series option object
			// is specified for each series.
			series: [],
			seriesColors: ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
				"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
			textColor: "#fff",
			// Show the legend and put it outside the grid, but inside the
			// plot container, shrinking the grid to accomodate the legend.
			// A value of "outside" would not shrink the grid and allow
			// the legend to overflow the container.
			legend: {
				show: true,
				placement: 'insideGrid'
			},
			/*axes: {
			 // Use a category axis on the x axis and use our custom ticks.
			 xaxis: {
			 renderer: jQuery.jqplot.CategoryAxisRenderer,
			 ticks: []
			 },
			 // Pad the y axis jsust a little so bars can get close to, but
			 // not touch, the grid boundaries.  1.2 is the default padding.
			 yaxis: {
			 pad: 1.05,
			 padMin: 0,
			 tickOptions: {formatString: '%d', color: 'white'}
			 }
			 },*/
			grid: {
				backgroundColor: 'transparent',
				drawGridlines: false,
				drawBorder: false
			},
			/*highlighter: {
			 sizeAdjust: 0,
			 tooltipLocation: 'n',
			 tooltipAxes: 'y',
			 tooltipFormatString: '<b><span>%d</span></b>',
			 useAxesFormatters: false,
			 show: true
			 },*/
			/*highlighter: {
			 show: true,
			 sizeAdjust: 7.5
			 },*/
			cursor: {
				show: false
			}
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
		 * NG-GRID for contact list
		 */

		$scope.filterOptionsContact = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.gridOptionsContact = {
			data: 'contacts',
			enableRowSelection: false,
			sortInfo: {fields: ["name"], directions: ["asc"]},
			filterOptions: $scope.filterOptionsContact,
			i18n: 'fr',
			enableColumnResize: true,
			columnDefs: [
				{field: 'name', displayName: 'Nom', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ticket/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-user"></span> {{row.getProperty(col.field)}}</a>'},
				{field: 'poste', displayName: 'Fonction'},
				{field: 'phone', displayName: 'Téléphone', cellFilter: "phone"},
				{field: 'email', displayName: 'Mail', cellTemplate: '<div class="ngCellText" ng-class="col.colIndex()"><a href="mailto:{{row.getProperty(col.field)}}" target="_blank">{{row.getProperty(col.field)}}</a></div>'},
				{field: 'status.name', displayName: 'Etat', cellTemplate: '<div class="ngCellText align-center"><small class="tag {{row.getProperty(\'status.css\')}} glossy">{{row.getProperty(\'status.name\')}}</small></div>'},
				{field: 'attractivity', displayName: 'Attractivité', cellClass: "align-right"},
				{field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'"}
			]
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
				{field: 'name', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ticket/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'><span class="icon-ticket"></span> {{row.getProperty("ref")}} - {{row.getProperty(col.field)}}</a>'},
				{field: 'task', displayName: 'Tâche'},
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

		$scope.priceLevelAutoComplete = function(val, field) {
			return $http.post('api/product/price_level/autocomplete', {
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

		$scope.userAutoComplete = function(val) {
			return $http.post('api/user/name/autocomplete', {
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


	}]);

angular.module('mean.societes').controller('SocieteCreateController', ['$scope', '$http', '$modalInstance', '$upload', '$route', 'Global', 'Societes', function($scope, $http, $modalInstance, $upload, $route, Global, Societes) {
		$scope.global = Global;

		$scope.active = 1;
		$scope.validSiret = false;
		$scope.societe = {
			entity: Global.user.entity
		};
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
			};

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
				return res.data;
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
				return res.data;
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

angular.module('mean.societes').controller('SocieteSegmentationRenameController', function($scope, $modalInstance, data) {
	$scope.data = {id: data._id};

	$scope.cancel = function() {
		$modalInstance.dismiss('canceled');
	}; // end cancel

	$scope.save = function() {
		//console.log($scope.data.id);
		$modalInstance.close($scope.data.id);
	}; // end save

	$scope.hitEnter = function(evt) {
		if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.data.id, null) || angular.equals($scope.data.id, '')))
			$scope.save();
	}; // end hitEnter
});
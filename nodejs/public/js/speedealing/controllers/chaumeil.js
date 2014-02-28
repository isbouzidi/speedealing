angular.module('mean.system').controller('CHMOtisController', ['$scope', 'pageTitle', '$http', '$timeout', '$upload', 'Global', 'Order', function($scope, pageTitle, $http, $timeout, $upload, Global, Order) {
		$scope.global = Global;

		pageTitle.setTitle('Nouvelle commande OTIS');

		$scope.init = function() {
			$scope.active = 1;
			$scope.order = {};
			$scope.order.bl = [];
			$scope.order.bl.push({
				products: [
					{name: 'paper', qty: 0},
					{name: 'cd', qty: 0}
				]
			});
			$scope.order.societe = Global.user.societe;
			$scope.filePercentage = {};
			$scope.fileName = {};
			$scope.checkFile = false;
			$scope.validAddress = false;
			$scope.validOrder = false;

			$scope.order.optional = {};
			$scope.order.optional.dossiers = [];
			$scope.order.optional.dossiers[0] = {};
		};

		$scope.create = function() {
			if (this.order._id)
				return;

			this.order.ref_client = "OTIS " + this.order.optional.projet;

			var order = new Order(this.order);

			order.$save(function(response) {
				$scope.order = response;

				$scope.order.bl = [];
				$scope.order.bl.push({
					products: [
						{name: 'paper', qty: 0},
						{name: 'cd', qty: 0}
					]
				});

				$scope.order.optional.dossiers = [];
				$scope.order.optional.dossiers[0] = {};

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

		$scope.otisAutoComplete = function(val, field) {
			return $http.post('api/chaumeil/otis/autocomplete', {
				field: field,
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

		$scope.initAssistantes = function(centreCout) {
			$http({method: 'GET', url: 'api/chaumeil/otis/assistantes', params: {
					centreCout: centreCout
				}
			}).
					success(function(data, status) {
				$scope.assistantes = data;
				$timeout(function() {
					angular.element('select').change();
				}, 300);
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
			$scope.order.date = new Date();
			$scope.order.date_livraison = new Date();
			$scope.order.date_livraison.setDate($scope.order.date_livraison.getDate() + 5);

			$scope.order.Status = "NEW"; // commande validee

			for (var i in this.order.bl) {
				var note = "";
				note += "Adresse de livraison : <br/><p>" + this.order.bl[i].name + "<br/>";
				note += this.order.bl[i].address + "<br />";
				note += this.order.bl[i].zip + " " + this.order.bl[i].town + "</p>";
				note += "<p> Nombre d'exemplaires papier : " + this.order.bl[i].products[0].qty + "</p>";
				note += "<p> Nombre d'exemplaires CD : " + this.order.bl[i].products[1].qty + "</p>";

				$scope.order.notes.push({
					note: note,
					title: "Destinataire " + (parseInt(i) + 1),
					edit: false
				});
			}

			for (var j in $scope.order.optional.dossiers) {
				// Add specific files

				var note = "";
				note += '<h4 class="green underline">' + "Liste des fichiers natifs</h4>";
				note += '<ul>';
				for (var i in $scope.order.optional.dossiers[j].selectedFiles) {
					if ($scope.order.optional.dossiers[j].selectedFiles[i] != null) {
						note += '<li><a href="' + $scope.order.optional.dossiers[j].selectedFiles[i].url + '" target="_blank" title="Telecharger - ' + $scope.order.optional.dossiers[j].selectedFiles[i].filename + '">';
						note += '<span class="icon-extract">' + $scope.order.optional.dossiers[j].selectedFiles[i].filename + '</span>';
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
			}

			$scope.update();
			$scope.next();

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

		$scope.countExemplaires = function() {

			$scope.cd = 0;
			$scope.papier = 0;

			for (var i = 0; i < this.order.bl.length; i++) {
				$scope.papier += this.order.bl[i].products[0].qty;
				$scope.cd += this.order.bl[i].products[1].qty;
			}
		};

		$scope.updateDF = function(obj) {
			$scope.initAssistantes(obj.centreCout.substr(1, 3)); //update liste assistante
			$scope.order.optional.numDF = obj.centreCout.substr(1, 2) + "/      /" + obj.centreCout.substr(3);
			var date = new Date();
			$scope.order.optional.DOE = obj.numAffaire + " - DOE - " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
		};

	}]);
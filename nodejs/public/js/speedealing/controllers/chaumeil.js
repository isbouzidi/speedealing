angular.module('mean.system').controller('CHMOtisController', ['$scope', '$http', '$timeout', '$upload', 'Global', 'Order', function($scope, $http, $timeout, $upload, Global, Order) {
		$scope.global = Global;

		$scope.init = function() {
			$scope.active = 1;
			$scope.order = {};
			$scope.order.bl = [];
			$scope.order.bl[0] = {};
			$scope.order.bl[1] = {};
			$scope.filePercentage = {};
			$scope.checkFile = false;
			$scope.validAddress = false;
			$scope.validOrder = false;
		};

		$scope.create = function() {
			if (this.order._id)
				return;

			this.order.ref_client = "OTIS " + this.order.optional.projet;

			var order = new Order(this.order);

			order.$save(function(response) {
				$scope.order = response;

				$scope.order.bl[0] = {};
				$scope.order.bl[1] = {};

				$scope.order.bl[0].products = [];
				$scope.order.bl[0].products[0] = {};
				$scope.order.bl[0].products[0].name = 'paper';
				$scope.order.bl[0].products[1] = {};
				$scope.order.bl[0].products[1].name = 'cd';

				$scope.order.bl[1].products = [];
				$scope.order.bl[1].products[0] = {};
				$scope.order.bl[1].products[0].name = 'paper';
				$scope.order.bl[1].products[1] = {};
				$scope.order.bl[1].products[1].name = 'cd';

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

		$scope.initAssistantes = function() {
			$http({method: 'GET', url: 'api/chaumeil/otis/assistantes'
			}).
					success(function(data, status) {
				$scope.assistantes = data;
				$timeout(function() {
					angular.element('select').change();
				}, 300);
			});
		};

		$scope.addDossier = function() {
			$scope.order.optional.dossiers.push({});
		};

		$scope.sendOrder = function() {
			$scope.order.date = new Date();
			$scope.order.date_livraison = new Date();
			$scope.order.date_livraison.setDate($scope.order.date_livraison.getDate() + 5);
			$scope.order.entity = "colombes";

			$scope.order.Status = "NEW"; // commande validee


			var note = "";
			note += "Adresse de livraison : <br/><p>" + this.order.bl[0].name + "<br/>";
			note += this.order.bl[0].address + "<br />";
			note += this.order.bl[0].zip + " " + this.order.bl[0].town + "</p>";
			note += "<p> Nombre d'exemplaires papier : " + this.order.bl[0].products[0].qty + "</p>";
			note += "<p> Nombre d'exemplaires CD : " + this.order.bl[0].products[1].qty + "</p>";

			$scope.order.notes.push({
				note: note,
				title: "Destinataire 1",
				edit: false
			});

			var note = "";
			note += "Adresse de livraison : <br/><p>" + this.order.bl[1].name + "<br/>";
			note += this.order.bl[1].address + "<br />";
			note += this.order.bl[1].zip + " " + this.order.bl[1].town + "</p>";
			note += "<p> Nombre d'exemplaires papier : " + this.order.bl[1].products[0].qty + "</p>";
			note += "<p> Nombre d'exemplaires CD : " + this.order.bl[1].products[1].qty + "</p>";

			$scope.order.notes.push({
				note: note,
				title: "Destinataire 2",
				edit: false
			})

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
					});
				//.error(...)
				//.then(success, error, progress); 
			}
		};

	}]);
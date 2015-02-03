"use strict";
/* global angular: true */

angular.module('mean.tickets').controller('TicketsController', ['$scope', '$routeParams', '$location', '$route', '$timeout', 'Global', 'pageTitle', '$http', 'socket', '$modal', '$upload', 'Tickets', function ($scope, $routeParams, $location, $route, $timeout, Global, pageTitle, $http, socket, $modal, $upload, Tickets) {
        $scope.global = Global;
        $scope.item = [];
        pageTitle.setTitle('Alertes multi-entités');
        var iconsFilesList = {};
        $scope.updateTask = true;

        $scope.ticket = {
            important: false,
            read: [],
            linked: [],
            affectedTo: [],
            controlledBy: {},
            comments: []
        };
        
        var modules = [
            {
                name: "Client",
                icon: "icon-users",
                collection: "Societe",
                searchUrl: "api/societe/autocomplete",
                url: "societe/fiche.php?id="
            },
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
            },
            {
                name: "Demande d'achat",
                icon: "icon-cart",
                collection: "europexpress_buy",
                searchUrl: "api/europexpress/buy/autocomplete",
                url: ""
            }
        ];

        $scope.kendoUpload = {
            multiple: true,
            async: {
                saveUrl: "api/tickets/file/",
                removeUrl: "api/tickets/file/",
                removeVerb: "DELETE",
                autoUpload: true
            },
            error: function (e) {
                // log error
                console.log(e);
                console.log($scope.ticket._id);
            },
            upload: function (e) {
                e.sender.options.async.saveUrl = "api/tickets/file/" + $scope.ticket._id;
                e.sender.options.async.removeUrl = "api/tickets/file/" + $scope.ticket._id;
            },
            complete: function () {
                //$route.reload();
                $scope.find();
            },
            localization: {
                select: "Ajouter fichiers"
            }
        };

        $scope.module = modules[0]; //for default

        $scope.modules = modules;       
        
        $scope.enableComment = function () {
            $scope.editMode = "comment";
        };

        $scope.enableReply = function () {
            $scope.editMode = "reply";
        };

        $scope.enableForward = function () {
            $scope.editMode = "forward";
        };

        $scope.ficheCancel = function () {
            $scope.editMode = null;
            $scope.ticket.newNote = "";

            //$scope.ticket = angular.copy(ticket);
        };
        
        $scope.icon = function (item) {
            for (var i in modules) {
                if (item.title == modules[i].name)
                    return modules[i].icon;
            }
            return "icon-question-round";
        };

        $scope.url = function (item) {
            for (var i in modules) {
                if (item.title == modules[i].name)
                    return modules[i].url + item.id;
            }
            return "";
        };

        $scope.userAutoComplete = function (val) {
            return $http.post('api/user/name/autocomplete?status=ENABLE', {
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

        $scope.linkAutoComplete = function (val) {

            return $http.post($scope.module.searchUrl, {
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

        $scope.deleteLink = function (index) {
            $scope.ticket.linked.splice(index, 1);
            $scope.update();
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

        $scope.deleteAffected = function (index) {
            $scope.ticket.affectedTo.splice(index, 1);
        };      

        $scope.update = function () {
            var ticket = $scope.ticket;

            ticket.$update(function () {
                //$location.path("tickets/" /*+ response._id*/);
                //$route.reload();
            }, function (errorResponse) {
            });
        };
        
        $scope.updateExpire = function (e) {
            //console.log(e.sender);

            $http({method: 'PUT', url: 'api/tickets/expire', data: {
                    id: $scope.ticket._id,
                    datef: e.sender._value,
                    controller: $scope.ticket.controlledBy,
                    ref: $scope.ticket.ref,
                    name: $scope.ticket.name
                }
            }).
                    success(function (data, status) {
                        //$route.reload();
                        //$scope.ticket = ticket;
                        //$location.path('tickets/' + data._id);
                    });
        };

        $scope.updatePercentage = function () {
            //console.log(data);
            $http({method: 'PUT', url: 'api/tickets/percentage', data: {
                    id: $scope.ticket._id,
                    percentage: $scope.ticket.percentage,
                    controller: $scope.ticket.controlledBy,
                    ref: $scope.ticket.ref,
                    name: $scope.ticket.name
                }
            }).
                    success(function (data, status) {
                        //$route.reload();
                        //$scope.ticket = ticket;
                        //$location.path('tickets/' + data._id);
                    });
        };

        $scope.addComment = function () {
            $http({method: 'POST', url: 'api/tickets/comment', data: {
                    id: $scope.ticket._id,
                    note: $scope.ticket.newNote,
                    addUser: $scope.ticket.addUser,
                    mode: $scope.editMode,
                    controller: $scope.ticket.controlledBy,
                    ref: $scope.ticket.ref,
                    name: $scope.ticket.name
                }
            }).success(function (data, status) {
                //$route.reload();
                $scope.ficheCancel();                
                $scope.findOne();
                //$location.path('tickets/' + data._id);
            });
        };
        
        $scope.setImportant = function () {
            $http({method: 'POST', url: 'api/tickets/important', data: {
                    id: $scope.ticket._id,
                    ref: $scope.ticket.ref,
                    name: $scope.ticket.name
                }
            }).
                    success(function (data, status) {
                        //$route.reload();
                        //$scope.ticket = ticket;
                        //$location.path('tickets/' + data._id);
                    });
        };

        $scope.setClosed = function () {
            $http({method: 'PUT', url: 'api/tickets/status', data: {
                    id: $scope.ticket._id,
                    Status: 'CLOSED',
                    controller: $scope.ticket.controlledBy,
                    recurrency: $scope.ticket.recurrency,
                    ref: $scope.ticket.ref,
                    name: $scope.ticket.name
                }
            }).
                    success(function (data, status) {
                        //$route.reload();
                        //$scope.ticket = ticket;
                        $location.path('tickets/');
                    });
        };
        
        $scope.findOne = function () {
            
            if ($routeParams.id) {
                Tickets.get({
                    id: $routeParams.id
                }, function (ticket) {
                    $scope.ticket = ticket;

                    //angular.element('.slider').setSliderValue(ticket.percentage);

                    if (ticket.read.indexOf(Global.user._id) < 0) {
                        $http({method: 'PUT', url: 'api/tickets/read', data: {
                                id: $scope.ticket._id,
                                controlledBy: $scope.ticket.controlledBy,
                                ref: $scope.ticket.ref,
                                name: $scope.ticket.name
                            }
                        }).
                                success(function (data, status) {
                                });
                    }
                });
            }
        };

        $scope.selected = function () {
            if ($routeParams.id)
                return true;
            else
                return false;
        };

        $scope.addLink = function () {
            var link = $scope.item;
            
            if (link.id) {
                $scope.ticket.linked.push({id: link.id, name: link.name, collection: $scope.module.collection, title: $scope.module.name});
                $scope.item = null;
                $scope.update();
            }
            
        };

        /**
         * For Menu
         */

        $scope.find = function () {
            Tickets.query(function (tickets) {
                $scope.menuTickets = tickets;
                $scope.count = tickets.length;
            });
        };
      
        $scope.ticketRead = function (read, user) {
            if (user == null)
                user = Global.user._id;
            if (read.indexOf(user) >= 0)
                return "white-gradient";
            else
                return "orange-gradient";
        };

        $scope.countDown = function (date, reverse) {
            var today = new Date();
            var day = new Date(date);
            //console.log(date);
            var seconds_left = today - day;

            if (reverse && seconds_left > 0)
                seconds_left = 0;
            else
                seconds_left = Math.round(seconds_left / 1000);

            var days = parseInt(seconds_left / 86400, 10);
            seconds_left = seconds_left % 86400;

            var hours = parseInt(seconds_left / 3600, 10);
            seconds_left = seconds_left % 3600;

            var minutes = parseInt(seconds_left / 60, 10);
            if (reverse)
                minutes = Math.abs(minutes);

            minutes = ('0' + minutes).slice(-2);

            //return day;
            return {days: days, hours: hours, minutes: minutes};
        };

        $scope.addNew = function () {
            var modalInstance = $modal.open({
                templateUrl: '/partials/tickets/create.html',
                controller: "CreateTicketsController",
                windowClass: "steps"
            });

            modalInstance.result.then(function (ticket) {
                $scope.ticket.push(ticket);
                $scope.count++;
            }, function () {
            });
        };
        
        $scope.affectedToAutoComplete = function (val) {

            return $http.post('api/user/name/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                console.log(res.data);
                return res.data;
            });
        };

        $scope.filterOptionsTicket = {
            filterText: "",
            useExternalFilter: false
        };
        $scope.gridOptions = {
            data: 'menuTickets',
            multiSelect: true,
            i18n: 'fr',
            enableCellSelection: false,
            enableSorting: true,
            sortInfo: {fields: ['datef'], directions: ['asc']},
            filterOptions: $scope.filterOptionsTicket,
            columnDefs: [
                {field: 'name', displayName: 'Nom alerte', cellTemplate: '<div class="ngCellText"><a ng-href="#!/tickets/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\'> {{row.getProperty(col.field)}}</a></div>'},
                {field: 'datef', displayName: 'Date expiration', cellTemplate:
                            '<div class="ngCellText">{{row.getProperty(col.field)| date:"dd/MM/yyyy HH:mm"}}</div>'},
                {field: 'ref', displayName: 'Réference'},
                {field: 'comments', displayName: 'Auteur dernier commentaire', cellFilter: 'lastAuthorComment'},
                {field: 'comments', displayName: 'Time ago', cellFilter: 'timeAgo'},
                {field: 'percentage', displayName: 'Pourcentage', cellTemplate: '<progressbar class="progress-striped thin" style="background: #31363a; height: 18px !important; margin: 6px !important" value="row.getProperty(col.field)" type="success"><strong>{{ row.getProperty(col.field) }} %<strong></progressbar>'}
            ]
        };
        
        $scope.onFileSelect = function ($files) {
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                if ($scope.ticket)
                    $scope.upload = $upload.upload({
                        url: 'api/tickets/file/' + $scope.ticket._id,
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
                    }).progress(function (evt) { // FIXME function in a loop !
                        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total, 10));
                    }).success(function (data, status, headers, config) { // FIXME function in a loop !
                        // file is uploaded successfully
                        //$scope.myFiles = "";
                        //console.log(data);
                        //if (!data.update) // if not file update, add file to files[]
                        //	$scope.societe.files.push(data.file);
                        //$scope.ticket = data;
                        console.log(data);
                        $scope.findOne();
                    });
                //.error(...)
                //.then(success, error, progress); 
            }
        };
        
        $scope.getFileTypes = function () {
            $http({method: 'GET', url: 'dict/filesIcons'
            }).
                    success(function (data, status) {
                        if (status == 200) {
                            iconsFilesList = data;
                        }
                    });
        };
        
        $scope.suppressFile = function (id, fileName, idx) {
            $http({method: 'DELETE', url: 'api/tickets/file/' + id + '/' + fileName
            }).
                    success(function (data, status) {
                        if (status == 200) {
                            $scope.ticket.files.splice(idx, 1);
                        }
                    });
        };

        $scope.fileType = function (name) {
            if (typeof iconsFilesList[name.substr(name.lastIndexOf(".") + 1)] == 'undefined')
                return iconsFilesList["default"];

            return iconsFilesList[name.substr(name.lastIndexOf(".") + 1)];
        };                
          
    }]);
angular.module('mean.tickets').controller('CreateTicketsController', ['$scope', '$routeParams', '$location', '$route', '$timeout', 'Global', 'pageTitle', '$http', 'socket', '$modal', '$upload', '$modalInstance', 'Tickets', function ($scope, $routeParams, $location, $route, $timeout, Global, pageTitle, $http, socket, $modal, $upload, $modalInstance, Tickets) {

        $scope.opened = [];
        $scope.active = 1;
        $scope.hstep0 = 1;
        $scope.mstep0 = 15;
        $scope.ismeridian0 = false;

        $scope.hstep1 = 1;
        $scope.mstep1 = 15;
        $scope.ismeridian1 = false;

        $scope.isActive = function (idx) {
            if (idx === $scope.active)
                return "active";
        };

        $scope.open = function ($event, idx) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.opened[idx] = true;
        };
        
        $scope.ticket = {
            important: false,
            read: [],
            linked: [],
            affectedTo: [{id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname}],
            controlledBy: {id: Global.user._id, name: Global.user.firstname + " " + Global.user.lastname},
            comments: []
        };
        var modules = [
            {
                name: "Client",
                icon: "icon-users",
                collection: "Societe",
                searchUrl: "api/societe/autocomplete",
                url: "societe/fiche.php?id="
            },
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
            },
            {
                name: "Demande d'achat",
                icon: "icon-cart",
                collection: "europexpress_buy",
                searchUrl: "api/europexpress/buy/autocomplete",
                url: ""
            }
        ];       

        $scope.module = modules[0]; //for default

        $scope.modules = modules;
        
        $scope.affectedToAutoComplete = function (val) {

            return $http.post('api/user/name/autocomplete', {
                take: '5',
                skip: '0',
                page: '1',
                pageSize: '5',
                filter: {logic: 'and', filters: [{value: val}]
                }
            }).then(function (res) {
                console.log(res.data);
                return res.data;
            });
        };
        
        $scope.addLink = function () {
            var link = $scope.item;
            
            if (link.id) {
                $scope.ticket.linked.push({id: link.id, name: link.name, collection: $scope.module.collection, title: $scope.module.name});
                $scope.item = null;
                $scope.update();
            }
            
        };
        
        $scope.deleteAffected = function (index) {
            $scope.ticket.affectedTo.splice(index, 1);
        };    
        
        $scope.create = function () {
            var new_ticket = new Tickets($scope.ticket);

            new_ticket.$save(function (response) {
                $modalInstance.close(response);
            });           
        };
        
        $scope.userAutoComplete = function (val) {
            return $http.post('api/user/name/autocomplete?status=ENABLE', {
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

        $scope.linkAutoComplete = function (val) {

            return $http.post($scope.module.searchUrl, {
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
        
        socket.on('refreshTicket', function (data) {
            //window.setInterval(function() {
            $scope.find();
            //$scope.$apply();
            //console.log("toto");
            //}, 60000);
        });
}]);
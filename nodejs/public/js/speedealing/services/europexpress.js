//Planning service used for REST endpoint
angular.module('mean.europexpress').factory("EEPlanning", ['$resource', function($resource) {
    return $resource('api/europexpress/planning/:year/:week/:planningId', {
        planningId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

angular.module('mean.europexpress').factory("EETransport", ['$resource', function($resource) {
    return $resource('api/europexpress/courses/:id', {
        id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

angular.module('mean.europexpress').factory("EEVehicule", ['$resource', function($resource) {
    return $resource('api/europexpress/vehicules/:id', {
        id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);

angular.module('mean.europexpress').factory("EEGazoilCard", ['$resource', function($resource) {
    return $resource('api/europexpress/essence/:id', {
        id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
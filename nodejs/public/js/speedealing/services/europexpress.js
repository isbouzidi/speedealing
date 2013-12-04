//Articles service used for REST endpoint
angular.module('mean.europexpress').factory("EEPlanning", ['$resource', function($resource) {
    return $resource('api/europexpress/planning/:year/:week/:Id', {
        Id: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
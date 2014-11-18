"use strict";
/* global angular: true */

//Users service used REST endpoint
angular.module('mean.users').factory("Users", ['$resource', function($resource) {
  return {
    users: $resource('api/users/:Id', {Id: '@_id'}, {
      update: { method: 'PUT'}
    }),
    absences: $resource('api/user/absence/:Id', {Id: '@_id'}, {
      update: { method: 'PUT'}
    })
  };
}]);
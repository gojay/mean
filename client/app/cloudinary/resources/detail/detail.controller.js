'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryResourcesDetailCtrl', function($scope, $log, $loading, CloudinaryService) {
        var resources = CloudinaryService.resources;

        $scope.getResource = function() {
            if (!resources.selected.detail) return;
            resources.edit = true;
            $loading.start('Get detail resource..');
            CloudinaryService.api.get({
                id: resources.selected.detail['public_id']
            }).$promise.then(function(resource) {
                resources.selected.detail.resource = resource;
                $loading.stop();
            });
        }
    });

'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryResourcesCustomCtrl', function($scope, $loading, CloudinaryService) {
    	var resources = CloudinaryService.resources;

        $scope.editing = {
            active: false,
            index: null
        };
        $scope.toggleEdit = function(index){
            var isActive = !$scope.editing.active;
            $scope.editing = {
                active: isActive,
                index: isActive ? index : null
            };
        }
        $scope.isEditing = function(index){
            return $scope.editing.active && $scope.editing.index == index;
        }

        $scope.modes = [{
          id: 'scale',
          name: 'Scale'
        }, {
          id: 'limit',
          name: 'Limit'
        }, {
          id: 'fill',
          name: 'Fill'
        }, {
          id: 'fit',
          name: 'Fit'
        }, {
          id: 'crop',
          name: 'Crop'
        }];
        
        $scope.mode = $scope.modes[0];
        
        $scope.$on('resource:request', function() {
        	resources.edit = true;
            if( resources.getDetail().derived ) return;

            $loading.start('Get detail resource..');

            CloudinaryService.api.get({
                id: resources.getDetail()['public_id']
            }).$promise.then(function(resource) {
                resources.getDetail().resource = resource;
                $loading.stop();
            });
        });

    });

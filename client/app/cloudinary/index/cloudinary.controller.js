'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryCtrl', function($scope, $state, $log, $rootScope, $timeout, $loading, $modalInstance, model, Modal, CloudinaryService) {
    	$scope.tag = 'example';

        $scope.resources = CloudinaryService.resources; 

        $scope.busy = false;
        $scope.next = function() {
            $scope.busy = true;
            $scope.resources.next().finally(function() {
                $scope.busy = false;
                $scope.$broadcast('scrollCompleted');
            });
        };

    	/* tabs */

    	$scope.tabs = [
    		{ active: true,  state: model + '.upload', title: 'Upload' },
    		{ active: false, state: model + '.resources', title: 'Resources' },
    		{ active: false, state: model + '.url', title: 'Url' }
    	];

    	$scope.setActiveTab = function( index, requestRequired ) {
            if( $modalInstance.isClosed ) return;

            var tab = $scope.tabs[index];
    		tab.active = true;
            $state.go(tab.state);

            requestRequired = requestRequired || true;
            if(index == 1 && requestRequired) {
                var options = {
                    query: { 
                        // tag: null,
                        // prefix: null,
                        // publicIds: [1,2,3,4,5],
                        max_results: 20
                    },
                    image: { height: 200 } // mapping cloudinary iamge url
                };
                $loading.start('Getting resources..');
                CloudinaryService.resources
                    .populate(options)
                    .catch(function(error){
                        $log.error(error);
                    })
                    .finally(function() {
                        $loading.stop();
                    });
            }
    	};

        /**
         * Remove reosurces
         * @param  String message
         * @param  Mixed  selected reosurces
         * @return $modal
         */
        var remove = Modal.confirm.delete(function(selected) {
            var selectedIds, isClearAll;
            var message = 'Deleting ';
            if(_.isArray(selected)) {
                selectedIds = _.pluck(selected, 'public_id');
                isClearAll = true;
                message += 'selected resources';
            } else {
                selectedIds = [selected['public_id']];
                isClearAll = false;
                message += selected['public_id'];
            }

            $loading.start(message + '...');

            var id = selectedIds.join('|');
            CloudinaryService.api.remove({ id: id }).$promise.then(function() {
                // remove resources data by selected ids
                _.remove(resources.data, function(item) { 
                    return ~_.indexOf(selectedIds, item.public_id); 
                });
                // clear selected items
                if(isClearAll) {
                    resources.clear();
                }
                $loading.stop();
            });
        });

        /**
         * Listener resource on change size
         *
         * @param Event  event
         * @param Object data  { index: Int, options: { width: Int, height: Int } }
         */
        $scope.$on('resource:onchange:size', function ( event, data ) {
            $scope.resources.url(data);
        });

        /**
         * Listener resource on delete
         *
         * @param Event  event
         * @param String type
         */
        $scope.$on('resources:delete', function ( event, type ) {
            var message, data;
            if( type == 'detail' ) {
                data = $scope.resources.getDetail();
                message = data.public_id + '.' + data.format;
            } else {
                data = $scope.resources.getSelected();
                message = 'selected images';
            }
            remove(message, data);
        });

        /* Dispatch resource on selected detail */

        var focusedItem = $scope.resources.getFocus();
        if( focusedItem ) {
            // waiting view content on loaded
            $scope.$on('$viewContentLoaded', function() {
                $scope.$broadcast('resource:onselected:detail', focusedItem);
            });
        }

        $scope.$watch('resources.getDetail()', function ( newValue, oldValue ) {
            if(!newValue) return;
            $scope.$broadcast('resource:onselected:detail', newValue);
        });

        /* Dispatch all on selected image (modal close) */

        $scope.close = function() {
            var selected = $scope.resources.getSelected({ custom: 'url' });
            $log.log('selected', selected);
            $rootScope.$broadcast('cloudinary:onselected:image', selected);
            $modalInstance.close();
        };

    });

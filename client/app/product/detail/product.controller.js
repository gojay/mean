'use strict';

angular.module('exampleAppApp')
    .controller('ProductsDetailCtrl', function($scope, /*$state, */$location, $modal, $log, product, productService, Auth) {
        $scope.product = product;

        $scope.activeThumb = 0;
        $scope.setThumb = function(index) {
            $scope.activeThumb = index;
        };

        // open modal login user
        $scope.open = function() {
            // var referrer = $state.href($state.current.name, $state.params);
        	var referrer = '/oauth';
            $scope.modalInstance = $modal.open({
                // size: 'lg',
                template: '<div class="modal-header" style="border-bottom:0">' +
		            '<h3 class="modal-title">Authentication</h3>' +
		        '</div>' +
		        '<div class="modal-body" style="padding:0">' +
                    '<tabset justified="true">'+
                        '<tab>' +
                            '<tab-heading>Sign in</tab-heading>' +
                            '<div style="padding:20px">' +
                                '<login-form login-dialog="true" login-success="close()"></login-form>' +
                            '</div>' +
                        '</tab>' +
                        '<tab>' +
                            '<tab-heading>Sign up</tab-heading>' +
                            '<div style="padding:20px">' +
                                '<signup-form signup-dialog="true" signup-success="close()"></signup-form>' +
                            '</div>' +
                        '</tab>' +
                    '</tabset>' +
		        '<div class="modal-footer">' +
		            '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
		        '</div>',
                controller: 'ModalInstanceCtrl'
            });

            $scope.modalInstance.result.then(function close() {
                var isLoggedIn = Auth.isLoggedIn();
                $log.info('isLoggedIn', isLoggedIn);
            }, function cancel() {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.review = {
            user: null,
            body: '',
            rate: 0
        };

        // user post review
        $scope.sendReview = function() {
            productService.sendReview($scope.product._id, $scope.review).$promise.then(function(data){
                $scope.product.reviews.push(data);
            });
        };

    })
    // modal controller
	.controller('ModalInstanceCtrl', function($scope, $modalInstance) {
    	// modal close
        $scope.close = function() {
            $modalInstance.close();
        };
        // cancel 
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    });

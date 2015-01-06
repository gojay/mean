'use strict';

angular.module('exampleAppApp')
    .controller('ProductsDetailCtrl', function($scope, $state, $stateParams, $modal, $log, product) {
        $scope.product = product;

        $scope.activeThumb = 0;
        $scope.setThumb = function(index) {
            $scope.activeThumb = index;
        };

        // open modal login user
        $scope.open = function() {
        	var referrer = $state.href('products.detail', $stateParams);
            var modalInstance = $modal.open({
                template: '<div class="modal-header">' +
		            '<h3 class="modal-title">Login</h3>' +
		        '</div>' +
		        '<div class="modal-body">' +
		            '<login-form login-referrer='+ referrer +'></login-form>' +
		        '</div>' +
		        '<div class="modal-footer">' +
		            '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
		        '</div>',
                controller: 'ModalInstanceCtrl'
            });

            modalInstance.result.then(function close(selectedItem) {
                // $scope.selected = selectedItem;
            }, function dismiss() {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        // user post review
        $scope.sendReview = function() {
        	$log.log('sendReview');
        };

    })
    // modal controller
	.controller('ModalInstanceCtrl', function($scope, $modalInstance) {

        /*$scope.items = items;
        $scope.selected = {
            item: $scope.items[0]
        };

    	// modal login
        $scope.login = function() {
            $modalInstance.close($scope.selected.item);
        };*/

    	// modal cancel
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    });

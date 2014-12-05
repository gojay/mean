'use strict';

angular.module('exampleAppApp')
  .controller('PhoneViewCtrl', function ($scope, product) {
    // $scope.phone = ProductService.get({ id: $stateParams.productId }, function(phone) {
    // 	var images = phone.meta.images;
    // 	$scope.thumbnail = images.cdnUri + '/original_' + images.files[0];
    // });
    
  	var images = product.meta.images;
  	$scope.thumbnail = images.cdnUri + '/original_' + images.files[0];

  	$scope.phone = product;
    $scope.activeThumb = 0;
    $scope.setThumb = function(index) {
    	var images = $scope.phone.meta.images;
    	$scope.thumbnail = images.cdnUri + '/original_' + images.files[index];
    	$scope.activeThumb = index;
    };
  });

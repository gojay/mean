'use strict';

angular.module('exampleAppApp')
  .controller('ProductsDetailCtrl', function ($scope, product) {
    $scope.product = product;
    
    var images = product.meta.images;
    $scope.thumbnail = images.cdnUri + '/original_' + images.files[0];

    $scope.activeThumb = 0;
    $scope.setThumb = function(index) {
    	$scope.activeThumb = index;
    };
  });

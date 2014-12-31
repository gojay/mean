'use strict';

angular.module('exampleAppApp')
  .controller('ProductsDetailCtrl', function ($scope, product) {
  	console.log('product', product);
    $scope.product = product;
    
    $scope.activeThumb = 0;
    $scope.setThumb = function(index) {
    	$scope.activeThumb = index;
    };
  });

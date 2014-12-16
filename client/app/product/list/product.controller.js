'use strict';

angular.module('exampleAppApp')
  .controller('ProductsListCtrl', function ($scope, products, socket) {
    $scope.products = products;
	$scope.orderProp = 'createdAt';

	socket.syncUpdates('product', $scope.products);

	$scope.$on('destroy', function() {
		socket.unSyncUpdates('product');
	});
  });

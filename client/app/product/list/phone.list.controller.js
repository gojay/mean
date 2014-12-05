'use strict';

angular.module('exampleAppApp')
  .controller('PhoneListCtrl', function ($scope, products) {
    // $scope.phones = ProductDummy.list;
    $scope.phones = products;
	$scope.orderProp = 'createdAt';
  });

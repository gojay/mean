'use strict';

xdescribe('Controller: ProductsDetailCtrl', function () {

  // load the controller's module
  beforeEach(angular.mock.module('exampleAppApp'));

  var ProductsDetailCtrl, $scope, $httpBackend;
  var product = {
    title: 'Motorola',
    meta: {
      images: {
        cdnUri: '/images/phones',
        files: ['motorola.0.jpg', 'motorola.1.jpg']
      }
    }
  };

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    $scope = $rootScope.$new();
    ProductsDetailCtrl = $controller('ProductsDetailCtrl', {
      $scope: $scope,
      product: product
    });
  }));

  it('should get product when fetched from xhr and type of object', function () {
    expect($scope.product).toEqual(product);
  });

  it('should set thumbnail', function() {
    $scope.setThumb(1);
    expect($scope.activeThumb).toEqual(1);
  });

  /**
   * Test when in ProductsDetailCtrl
   * product.$promise.then(function(product) {
   *   $scope.product = product;
   *   ....
   * });
  var $scope, $controller, $httpBackend, $q, deferred, productMock;

  beforeEach(function() {
    productMock = {
      product: function() {
        deferred = $q.defer();
        return deferred.promise;
      }
    };
    spyOn(productMock, 'product').andCallThrough();
  });

  beforeEach(inject(function (_$q_, $controller, $rootScope) {
    $q = _$q_;
    $scope = $rootScope.$new();
    $controller('ProductsDetailCtrl', {
      $scope: $scope,
      product: productMock.product
    });
  }));

  it('should get resolve product', function () {
    deferred.resolve(productData);

    $scope.$digest();

    expect(productMock.product).toHaveBeenCalled();
    expect($scope.product).toEqual(productData);
    expect($scope.thumbnail).toBe('/images/phones/original_motorola.0.jpg');
  });
   */
});

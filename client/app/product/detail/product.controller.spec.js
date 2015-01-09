'use strict';

describe('Controller: ProductsDetailCtrl', function () {

  // load the controller's module
  beforeEach(angular.mock.module('exampleAppApp'));

  var $scope, $modal, $log, $document;

  var fakeModal = {
    result: {
      then: function(confirmCallback, cancelCallback) {
        this.confirmCallback = confirmCallback;
        this.cancelCallback = cancelCallback;
      }
    },
    close: function(item) {
      this.result.confirmCallback(item);
    },
    dismiss: function(type) {
      this.result.cancelCallback(type);
    }
  };

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
  beforeEach(inject(function ($controller, $rootScope, _$modal_, _$document_) {
    $scope = $rootScope.$new();
    $modal = _$modal_;
    spyOn($modal, 'open').andReturn(fakeModal);

    $log = { info: angular.noop };
    spyOn($log, 'info').andCallThrough();

    var ProductsDetailCtrl = $controller('ProductsDetailCtrl', {
      $scope: $scope,
      $modal: $modal,
      $log: $log,
      product: product
    });

    $document = _$document_;
  }));

  it('should get product', function () {
    expect($scope.product).toEqual(product);
  });

  it('should set thumbnail', function() {
    $scope.setThumb(1);
    expect($scope.activeThumb).toEqual(1);
  });

  describe('trigger open', function() {
    beforeEach(function() {
      $scope.open();
    });

    it('should $modal.open have been called & modalInstance is defined', function() {
      expect($modal.open).toHaveBeenCalled();
      expect($scope.modalInstance).toBeDefined();
    });

    it('should $modal.dismiss, $Log.info have been called', function() {
      $scope.modalInstance.dismiss('cancel');
      expect($log.info).toHaveBeenCalled();
    });
  })

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

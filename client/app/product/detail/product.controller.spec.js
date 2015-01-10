'use strict';

ddescribe('Controller: ProductsDetailCtrl', function () {

  // load the controller's module
  beforeEach(angular.mock.module('exampleAppApp'));

  var $scope, $modal, $log, $httpBackend;

  var product = {
    _id: 1,
    title: 'Motorola',
    meta: {
      images: {
        cdnUri: '/images/phones',
        files: ['motorola.0.jpg', 'motorola.1.jpg']
      }
    },
    reviews: []
  };

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

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $templateCache, _$modal_, _$httpBackend_) {
    $templateCache.put('app/main/main.html', '');

    $scope = $rootScope.$new();
    $modal = _$modal_;
    spyOn($modal, 'open').andReturn(fakeModal);

    $log = { info: angular.noop };
    spyOn($log, 'info').andCallThrough();

    $httpBackend = _$httpBackend_;

    var ProductsDetailCtrl = $controller('ProductsDetailCtrl', {
      $scope: $scope,
      $modal: $modal,
      $log: $log,
      product: product
    });
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
  });

  it('send review', function(){
    $httpBackend.expectPOST('/api/products/1/review').respond(201, { name:'test', review:'ok' });

    $scope.sendReview();
    $httpBackend.flush();

    expect($scope.product.reviews.length).toBe(1);
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

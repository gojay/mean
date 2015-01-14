'use strict';

describe('Controller: ProductsDetailCtrl', function () {

  // load the controller's module
  beforeEach(angular.mock.module('exampleAppApp'));

  var $scope, $modal, $log, $q, $httpBackend, productService, Auth;

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

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $templateCache, _$q_, _$httpBackend_, _productService_, _Auth_) {
    $templateCache.put('app/main/main.html', '');

    $scope = $rootScope.$new();

    $log = { info: angular.noop };
    spyOn($log, 'info').andCallThrough();

    $httpBackend = _$httpBackend_;
    $q = _$q_;

    productService = _productService_;
    Auth = _Auth_;

    spyOn(productService, 'get').andCallFake(function(id) {
      var deferred = $q.defer();
      deferred.resolve(product);
      return { $promise: deferred.promise }; 
    });

    var ProductsDetailCtrl = $controller('ProductsDetailCtrl', {
      $scope: $scope,
      $log: $log,
      $stateParams: { productId: 1 }
    });
  }));

  it('should get product', function () {
    expect($scope.product).toBeUndefined();
    $scope.$digest();
    expect(productService.get).toHaveBeenCalledWith(1);
    expect($scope.product).toEqual(product);
  });

  it('should set thumbnail', function() {
    $scope.setThumb(1);
    expect($scope.activeThumb).toEqual(1);
  });

  it('should modal opened', inject(function(Modal) {
      spyOn(Modal, 'auth').andCallThrough();
      $scope.showLoginDialog();
      expect(Modal.auth).not.toHaveBeenCalled();
  }));

  describe('reviews', function() {
    beforeEach(function() {
      $scope.$digest();
      expect($scope.product._id).toBeDefined();

      $httpBackend.expectGET('/api/products/1/reviews?page=1&sort=createdAt').respond({
        total: 5,
        pages: 2,
        currentPage: 1,
        limit: 3,
        skip: 0, 
        data: [{ rate:1, body:'good', createdAt: new Date().toISOString() }] 
      });

      spyOn(Auth, 'isLoggedIn').andCallFake(function() {
        return true;
      });

      $scope.reviews.get();
      $httpBackend.flush();
    });

    it('get reviews', function() {
      expect($scope.reviews.firstTime).toBeFalsy();
      expect($scope.reviews.list).not.toBeNull();
    });

    it('has more reviews', function() {
      expect($scope.reviews.hasMore()).toBeTruthy();
    });

    it('load more reviews', function() {
      $httpBackend.expectGET('/api/products/1/reviews?page=2&sort=createdAt').respond({
        total: 5,
        limit: 6,
        skip: 3, 
        currentPage: 2,
        pages: 2,
        data: [{ rate:4, body:'last', createdAt: new Date().toISOString() }] 
      });

      $scope.reviews.loadMore();

      $httpBackend.flush();

      expect($scope.reviews.list.data.length).toBe(2);
      expect($scope.reviews.hasMore()).toBeFalsy();
    });

    it('send review', function(){
      $httpBackend.expectPOST('/api/products/1/reviews').respond(201, { rate:1, body:'good', createdAt: new Date().toISOString() });

      $scope.reviews.send({ $valid: true });

      expect($scope.reviews.loading).toBeTruthy();

      $httpBackend.flush();

      expect($scope.reviews.loading).toBeFalsy();
      expect($scope.reviews.list.data.length).toBe(2);
      expect($scope.reviews.data.body).toBe('');
      expect($scope.reviews.data.rate).toBe(0);
    });
  });
});

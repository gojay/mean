'use strict';

ddescribe('Controller: ProductsList', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));
  beforeEach(module('socketMock'));

  var productData = {
    categories: {
      data: []
    },
    filters: {
      data: {
        brands: [
          { id: 'apple', name: 'Apple' },
          { id: 'htc', name: 'HTC' },
          { id: 'samsung', name: 'Samsung' }
        ],
        price : [{
          min: 0,
          max: 1000
        }],
        os: [],
        flash: [],
        ram: [],
        camera: [],
        display: []
      }
    }
  };

  describe('Controller: ProductsContentCtrl request by $httpBackend', function () {
    var $scope, $rootScope, $httpBackend, ProductsContentCtrl, productService;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, _$rootScope_, $location, $templateCache, _$httpBackend_, _productService_) {
      
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/api/products').respond({data:['products']});

      $templateCache.put('app/main/main.html', '');

      $rootScope = _$rootScope_;

      $rootScope = _$rootScope_;
      spyOn($rootScope, '$broadcast').andCallThrough();
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.filters).toBeDefined();
      });
      $scope = $rootScope.$new();

      $location = _$location_;
      spyOn($location, 'search').andReturn({});

      spyOn($rootScope, '$broadcast').andCallThrough();
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.filters).toBeDefined();
      });

      productService = _productService_;
      ProductsContentCtrl = $controller('ProductsContentCtrl', {
        $scope: $scope,
        $location: $location,
        productData: productData,
        productService: productService
      });
    }));

    it('should get products', function () {
      $httpBackend.flush();
      expect($rootScope.$broadcast).toHaveBeenCalled();
      expect($scope.products).toBeDefined();
      expect($scope.products.data).toEqual(['products']);
    });

    it('should do paging and location search changed', function() {
      deferred.resolve({data:['products']});

      $scope.doPaging(2);
      $scope.$digest();

      $httpBackend.flush();
      expect($location.search).toHaveBeenCalled();
      expect($location.search()).toEqual(jasmine.objectContaining({ page: 2 }));
      
    });
  });

  describe('Controller: ProductsContentCtrl request by productServiceMock', function () {
    var $scope, $rootScope, $location, deferred, productServiceMock;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, _$rootScope_, _$location_, $q, $templateCache) {
      
      $templateCache.put('app/main/main.html', '');

      $rootScope = _$rootScope_;
      spyOn($rootScope, '$broadcast').andCallThrough();
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.filters).toBeDefined();
      });
      $scope = $rootScope.$new();

      $location = _$location_;
      spyOn($location, 'search').andReturn({});

      productServiceMock = {
        query: function(){
          deferred = $q.defer();
          return { $promise: deferred.promise };
        }
      }

      spyOn(productServiceMock, 'query').andCallThrough();

      $controller('ProductsContentCtrl', {
        $scope: $scope,
        $location: $location,
        productData: productData,
        productService: productServiceMock
      });
    }));

    it('should get products', function() {
      deferred.resolve({data:['products']});
      $scope.$digest();
      expect(productServiceMock.query).toHaveBeenCalled();
      expect($rootScope.$broadcast).toHaveBeenCalled();
      expect($scope.products).toBeDefined();
      expect($scope.products).toEqual({ data:['products'], title: 'All Products' });
    });

    it('should do paging and location search changed', function() {
      deferred.resolve({data:['products']});

      $scope.doPaging(2);
      $scope.$digest();

      expect(productServiceMock.query).toHaveBeenCalled();
      expect($location.search).toHaveBeenCalled();
      expect($location.search()).toEqual(jasmine.objectContaining({ page: 2 }));
      
    });

  });

});

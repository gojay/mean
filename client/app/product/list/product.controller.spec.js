'use strict';

describe('Controller: ProductsList', function () {

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
    var $scope, $rootScope, $location, $httpBackend, ProductsContentCtrl, socket;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, _$rootScope_, _$location_, $templateCache, _$httpBackend_, productService, _socket_) {
      
      $httpBackend = _$httpBackend_;
      $httpBackend.when('GET', '/api/products').respond({data:['product']});
      $httpBackend.when('GET', '/api/products?page=2').respond({data:['product']});

      $templateCache.put('app/main/main.html', '');

      $rootScope = _$rootScope_;
      // $rootScope.$broadcast & call
      spyOn($rootScope, '$broadcast').andCallThrough();
      // expected $rootScope.$on
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.filters).toBeDefined();
      });
      $scope = $rootScope.$new();

      $location = _$location_;
      // spy $location.search
      spyOn($location, 'search').andReturn({});

      socket = _socket_;

      ProductsContentCtrl = $controller('ProductsContentCtrl', {
        $scope: $scope,
        $location: $location,
        productData: productData,
        productService: productService,
        socket: socket
      });
    }));

    it('should get products', function () {
      expect($scope.loading).toBeTruthy();

      $httpBackend.flush();
      
      expect($rootScope.$broadcast).toHaveBeenCalled();
      expect($scope.products).toBeDefined();
      expect($scope.products.data).toEqual(['product']);
      expect($scope.loading).toBeFalsy();
    });

    it('should do paging', function() {
      $scope.doPaging(2);
      expect($scope.loading).toBeTruthy();
      $httpBackend.flush();
      expect($scope.products.data).toEqual(['product']);
      expect($scope.loading).toBeFalsy();
      // expect($location.search).toHaveBeenCalled();
      // expect($location.search()).toEqual(jasmine.objectContaining({ page: 2 }));
    });

    it('socket sync', function() {
      $httpBackend.flush();
      expect($scope.products.data.length).toBe(1);

      socket.fire('product:save', 'product2');
      expect($scope.products.data.length).toBe(2);

      socket.fire('product:remove', 'product');
      expect($scope.products.data).toEqual(['product2']);
      expect($scope.products.data.length).toBe(1);
    });
  });

  describe('Controller: ProductsContentCtrl request by productService Mock', function () {
    var $scope, $rootScope, $location, deferred, productServiceMock;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, _$rootScope_, _$location_, $q, $templateCache) {
      
      $templateCache.put('app/main/main.html', '');

      $rootScope = _$rootScope_;
      // $rootScope.$broadcast & call
      spyOn($rootScope, '$broadcast').andCallThrough();
      // expected $rootScope.$on
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.filters).toBeDefined();
      });
      $scope = $rootScope.$new();

      $location = _$location_;
      // spy $location.search
      spyOn($location, 'search').andReturn({});

      // mock productService
      productServiceMock = {
        query: function(){
          deferred = $q.defer();
          // deferred.resolve({data:['products']});
          return { $promise: deferred.promise };
        }
      }
      // call productService.query
      spyOn(productServiceMock, 'query').andCallThrough();

      $controller('ProductsContentCtrl', {
        $scope: $scope,
        $location: $location,
        productData: productData,
        productService: productServiceMock
      });
    }));

    it('should get products', function() {
      expect($scope.loading).toBeTruthy();

      deferred.resolve({data:['products']});
      $scope.$digest();

      expect(productServiceMock.query).toHaveBeenCalled();
      expect($rootScope.$broadcast).toHaveBeenCalled();
      expect($scope.products).toBeDefined();
      expect($scope.products).toEqual({ data:['products'], title: 'All Products' });
      expect($scope.loading).toBeFalsy();
    });

    it('should do paging', function() {
      deferred.resolve({data:['products2']});

      $scope.doPaging(2);
      expect($scope.loading).toBeTruthy();
      $scope.$digest();

      expect(productServiceMock.query).toHaveBeenCalled();
      expect($scope.products).toEqual({ data:['products2'], title: 'All Products' });
      expect($scope.loading).toBeFalsy();
      // expect($location.search).toHaveBeenCalled();
      // expect($location.search()).toEqual(jasmine.objectContaining({ page: 2 }));
    });
  });

  var stateParams = {
    category: 'all',
    brand: ['htc', 'samsung'],
    price: '100-1000',
    os: 'android 1.5',
    ram: '512-1024',
    flash: '1024',
    page: null
  };

  describe('Controller: ProductsQueryContentCtrl request by $httpBackend', function(){
    var $rootScope, $scope, $httpBackend, $state, productService;

    beforeEach(inject(function($controller, $templateCache, _$rootScope_, _$httpBackend_, _$state_, _productService_){
      $templateCache.put('app/main/main.html', '');
      
      productService = _productService_;
      var urlParameter = productService.urlParameter(stateParams);

      $httpBackend = _$httpBackend_;
      $httpBackend.when('GET', '/api/categories/products'+urlParameter).respond('categories');
      $httpBackend.when('GET', '/api/products/filters'+urlParameter).respond('filters');
      $httpBackend.when('GET', '/api/products'+urlParameter).respond('products');

      $rootScope = _$rootScope_;
      // $rootScope.$broadcast & call
      spyOn($rootScope, '$broadcast').andCallThrough();
      // expected $rootScope.$on
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.params).toBeDefined();
        expect(data.filters).toBeDefined();
      });
      $scope = $rootScope.$new();

      // spy scope breadcrumb
      $scope.breadcrumb = {
        set: angular.noop,
        getTitle: function() {
          return 'Product Title';
        }
      }
      spyOn($scope.breadcrumb, 'set').andCallThrough();
      spyOn($scope.breadcrumb, 'getTitle').andCallThrough();

      $state = _$state_;

      $controller('ProductsQueryContentCtrl', {
        $scope: $scope,
        $state: $state,
        $stateParams: stateParams,
        productService: productService
      });
    }));

    it('should get products', function(){
      expect($scope.loading).toBeTruthy();
      expect($scope.products).toBeUndefined();
      expect($scope.breadcrumb.set).toHaveBeenCalled();

      $httpBackend.flush();

      expect($scope.products).toBeDefined();
      expect($scope.products).toEqual('products');
      expect($scope.breadcrumb.getTitle).toHaveBeenCalled();
      expect($rootScope.$broadcast).toHaveBeenCalled();
      expect($scope.loading).toBeFalsy();
      expect($state.current.data.title).toEqual('Product Title');
    });

    it('should do paging', function() {
      stateParams.page = 2;
      var urlParameter2 = productService.urlParameter(stateParams);
      $httpBackend.when('GET', '/api/categories/products'+urlParameter2).respond('categories');
      $httpBackend.when('GET', '/api/products/filters'+urlParameter2).respond('filters');
      $httpBackend.when('GET', '/api/products'+urlParameter2).respond({ data: 'products2' });

      $scope.doPaging(2);
      expect($scope.loading).toBeTruthy();
      $httpBackend.flush();

      expect($scope.products.data).toEqual('products2');
      expect($scope.products.title).toEqual('Product Title');
      expect($scope.loading).toBeFalsy();
    });
  });

  describe('Controller: ProductsQueryContentCtrl request by productService Mock', function(){
    var $rootScope, $scope, $state, deferred, productServiceMock;

    beforeEach(inject(function($controller, $q, $templateCache, _$rootScope_, _$state_){
      $templateCache.put('app/main/main.html', '');

      $rootScope = _$rootScope_;
      // $rootScope.$broadcast & call
      spyOn($rootScope, '$broadcast').andCallThrough();
      // expected $rootScope.$on
      $rootScope.$on('products:loaded', function(event, data) {
        expect(data.params).toBeDefined();
        expect(data.filters).toBeDefined();
      });
      $scope = $rootScope.$new();

      // spy scope breadcrumb
      $scope.breadcrumb = {
        set: angular.noop,
        getTitle: function() {
          return 'Product Title';
        }
      }
      spyOn($scope.breadcrumb, 'set').andCallThrough();
      spyOn($scope.breadcrumb, 'getTitle').andCallThrough();

      // spy $state
      $state = _$state_;
      $state.current = {
        data: { title: null }
      };

      // mocking productService
      // and spy
      productServiceMock = {
        all: function(){
          deferred = $q.defer();
          return deferred.promise;
        },
        setParam: function(k,v) {
          stateParams[k] = v;
          return productServiceMock;
        }
      }
      spyOn(productServiceMock, 'all').andCallThrough();
      spyOn(productServiceMock, 'setParam').andCallThrough();

      $controller('ProductsQueryContentCtrl', {
        $scope: $scope,
        $state: $state,
        $stateParams: stateParams,
        productService: productServiceMock
      });
    }));

    it('should get products', function(){
      expect($scope.loading).toBeTruthy();
      expect($scope.products).toBeUndefined();
      expect($scope.breadcrumb.set).toHaveBeenCalled();

      deferred.resolve({ 
        products: { data: { data: 'products' } },
        filters : { data: { data: 'filters' } } 
      });
      $scope.$digest();

      expect(productServiceMock.all).toHaveBeenCalledWith(stateParams);
      expect($scope.products).toBeDefined();
      expect($scope.products.data).toEqual('products');
      expect($scope.breadcrumb.getTitle).toHaveBeenCalled();
      expect($rootScope.$broadcast).toHaveBeenCalled();
      expect($scope.loading).toBeFalsy();
      expect($state.current.data.title).toEqual('Product Title');
    });

    it('should do paging', function() {
      expect($scope.loading).toBeTruthy();

      deferred.resolve({ 
        products: { data: { data: 'products2' } },
        filters : { data: { data: 'filtrs2' } } 
      });

      $scope.doPaging(2);
      $scope.$digest();

      expect(productServiceMock.setParam).toHaveBeenCalled();
      expect(productServiceMock.all).toHaveBeenCalled();
      expect($scope.products.data).toEqual('products2');
      expect($scope.products.title).toEqual('Product Title');
      expect($scope.loading).toBeFalsy();
    });
  });

});

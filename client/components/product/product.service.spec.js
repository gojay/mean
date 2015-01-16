'use strict';

describe('Service: productService', function () {

  // load the service's module
  beforeEach(module('exampleAppApp'));

  // instantiate service
  var productService, productDummy, $httpBackend;
  beforeEach(inject(function (_productService_, _productDummy_, _$httpBackend_, $templateCache) {
    productService = _productService_;
    productDummy = _productDummy_;
    $httpBackend = _$httpBackend_;
    
    $templateCache.put('app/main/main.html', '');
  }));

  it('should productService & productDummy to be defined', function () {
    expect(productService).toBeDefined();
    expect(productDummy.list).toEqual(jasmine.any(Array));
    expect(productDummy.detail).toEqual(jasmine.any(Object));
  });

  it('should productService "get" resolved', function() {
    $httpBackend.expectGET('/api/products/1').respond({ title: 'product 1' });
    var result = productService.get(1).$promise.then(function(product){
      expect(product).toEqual(jasmine.objectContaining({ title: 'product 1' }));
    });
    $httpBackend.flush();

    expect(result.$resolved).toBeTruthy;
  });

  it('should productService "query" resolved', function () {
    $httpBackend.expectGET('/api/products').respond({ data: ['products'] });
    var result = productService.query().$promise.then(function(results){
      expect(results.data).toBeDefined();
      expect(results.data).toContain('products');
    });
    $httpBackend.flush();

    expect(result.$resolved).toBeTruthy;
  });

  it('should productService "all" resolved', function () {

    $httpBackend.expectGET('/api/categories?parent=products').respond('categories');
    $httpBackend.expectGET('/api/products/filters').respond('filters');
    $httpBackend.expectGET('/api/products').respond('products');
    var result = productService.all(null, { exclude: 'products' }).then(function(results){
      expect(results.categories).toBeDefined();
      expect(results.categories.data).toEqual('categories');
      expect(results.filters).toBeDefined();
      expect(results.filters.data).toEqual('filters');
      expect(results.products).toBeUndefined();
    });
    $httpBackend.flush();

    expect(result.$resolved).toBeTruthy;
  });

  it('should productService convert filters to parameters', function() {
    var urlParamEmpty = productService.urlParameter();
    expect(urlParamEmpty).toBe('');

    var filters = {
      category: 'android',
      brand: 'all',
      price: '100-1000',
      os: null
    }    
    var urlParameter = productService.urlParameter(filters);

    expect(urlParameter).toEqual(encodeURI('?q[category]=android&q[price][gte]=100&q[price][lte]=1000'));

    var filters2 = {
      category: 'all',
      brand: ['htc', 'samsung'],
      price: '100-1000',
      os: 'android 1.5',
      ram: '512-1024',
      flash: '1024',
      page: null
    }    
    var urlParameter2 = productService.urlParameter(filters2);
    expect(urlParameter2).toEqual(encodeURI('?q[brand][]=htc&q[brand][]=samsung&q[price][gte]=100&q[price][lte]=1000&q[os]=android+1.5&q[ram][gte]=512&q[ram][lte]=1024&q[flash][gt]=1024&page=1'));

    // add/update parameters
    var urlParameter = productService.setParam('page', 2).urlParameter();
    expect(urlParameter).toEqual(encodeURI('?q[brand][]=htc&q[brand][]=samsung&q[price][gte]=100&q[price][lte]=1000&q[os]=android+1.5&q[ram][gte]=512&q[ram][lte]=1024&q[flash][gt]=1024&page=2'));

    // all
    $httpBackend.expectGET('/api/categories?parent=products').respond('categories');
    $httpBackend.expectGET('/api/products/filters'+urlParameter).respond('filters');
    $httpBackend.expectGET('/api/products'+urlParameter).respond('products');
    var result = productService.all().then(function(results){
      expect(results.categories).toBeDefined();
      expect(results.categories.data).toEqual('categories');
      expect(results.filters).toBeDefined();
      expect(results.filters.data).toEqual('filters');
      expect(results.products).toBeDefined();
      expect(results.products.data).toEqual('products');
    });
    $httpBackend.flush();
  });

});

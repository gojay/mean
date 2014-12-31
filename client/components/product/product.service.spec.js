'use strict';

describe('Service: Product', function () {

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

  it('should productService resource to be defined', function () {
    expect(productService).toBeDefined();
    $httpBackend.expectGET('/api/products').respond({ data: ['products'] });
    var result = productService.resource.query();
    $httpBackend.flush();

    expect(result.$resolved).toBeTruthy;
    expect(result).toEqual(jasmine.any(Object));
  });

  it('should productService query resolved', function () {

    $httpBackend.expectGET('/api/categories/products').respond('categories');
    $httpBackend.expectGET('/api/products/filters').respond('filters');
    $httpBackend.expectGET('/api/products').respond('products');
    var result = productService.query().then(function(results){
      expect(results.categories).toBeDefined();
      expect(results.categories.data).toEqual('categories');
      expect(results.filters).toBeDefined();
      expect(results.filters.data).toEqual('filters');
      expect(results.products).toBeUndefined();
    });
    $httpBackend.flush();

    expect(result.$resolved).toBeTruthy;
  });

  xit('should productDummy to be defined', function () {
    expect(productDummy.list).toEqual(jasmine.any(Array));
    expect(productDummy.detail).toEqual(jasmine.any(Object));
  });

});

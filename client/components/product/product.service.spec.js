'use strict';

describe('Service: Product', function () {

  // load the service's module
  beforeEach(module('exampleAppApp'));

  // instantiate service
  var productService, productDummy;
  beforeEach(inject(function (_productService_, _productDummy_) {
    productService = _productService_;
    productDummy = _productDummy_;
  }));

  it('should productService to be defined', function () {
    expect(productService).toBeDefined();
  });

  it('should productDummy to be defined', function () {
    expect(productDummy.list).toEqual(jasmine.any(Array));
    expect(productDummy.detail).toEqual(jasmine.any(Object));
  });

});

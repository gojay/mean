'use strict';

describe('route: Products', function() {

	var $location, $state, $rootScope, productServiceMock;

  	beforeEach(module('exampleAppApp', function($provide) {
		productServiceMock = {
			get: angular.noop,
			query: angular.noop,
			all: angular.noop
		};
		$provide.value('productService', productServiceMock);
  	}));

	beforeEach(inject(function(_$location_, _$state_, _$rootScope_, $templateCache ) {
		$location = _$location_;
		$state = _$state_;
		$rootScope = _$rootScope_;

		$templateCache.put('app/main/main.html', '');
		$templateCache.put('app/product/index/index.html', '');
		$templateCache.put('app/product/breadcrumb.html', '');
		$templateCache.put('app/product/slides.html', '');
		$templateCache.put('app/product/categories.html', '');
		$templateCache.put('app/product/side/side.html', '');

		$templateCache.put('app/product/list/product.html', '');
		$templateCache.put('app/product/detail/product.html', '');

		spyOn(productServiceMock, 'all').andReturn('all');
		spyOn(productServiceMock, 'get').andReturn({ $promise:'ProductDetail' });
	}));

	xit('should location /products resolve productData', inject(function($injector) {
		expect($state.href('products')).toEqual('/products');

		$state.go('products');
		$rootScope.$digest();

		expect($injector.invoke($state.current.resolve.productData)).toEqual('all');
	}));

	it('should state products.query match params', inject(function($injector) {
		expect($state.href('products.query', {category:'android', page:1})).toEqual('/products/category/android/?page=1');
		expect($state.href('products.query', {category:'android', brand:'htc', page:1})).toEqual('/products/category/android/htc?page=1');

		$state.go('products.query', { brand: 'htc' });
		$rootScope.$digest();

		expect($state.current.name).toEqual('products.query');
		expect($state.params).toEqual(jasmine.objectContaining({ 
			category:'all', 
			brand: 'htc',
			page: 1 
      	}));
	}));

	it('should location /products/:productId resolve product', inject(function($injector) {
		expect($state.href('products.detail', {productId: 1})).toEqual('/products/detail/1');

		$state.go('products.detail', { productId:1 });
		$rootScope.$digest();

		expect($state.current.name).toEqual('products.detail');
		// expect(productServiceMock.get).toHaveBeenCalledWith(1);
		// expect($injector.invoke($state.current.resolve.product)).toEqual('ProductDetail');
	}));
});
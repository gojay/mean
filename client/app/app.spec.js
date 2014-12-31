'use strict';

describe('Routes test', function() {

	var $location, $state, $rootScope, productServiceMock, productResourceMock;

  	beforeEach(module('exampleAppApp'));

  	beforeEach(module('exampleAppApp', function($provide) {
		productServiceMock = {
			query: angular.noop
		};
		productResourceMock = {
			query: angular.noop,
			get: angular.noop
		};
		$provide.value('productService', productServiceMock);
		$provide.value('productResource', productResourceMock);
  	}));

	beforeEach(inject(function(_$location_, _$state_, _$rootScope_, $templateCache ) {
		$location = _$location_;
		$state = _$state_;
		$rootScope = _$rootScope_;

		$templateCache.put('app/main/main.html', '');
		$templateCache.put('app/product/index.html', '');
		$templateCache.put('app/product/breadcrumb.html', '');
		$templateCache.put('app/product/slides.html', '');
		$templateCache.put('app/product/categories.html', '');
		$templateCache.put('app/product/side.html', '');

		$templateCache.put('app/product/list/product.html', '');
		$templateCache.put('app/product/detail/product.html', '');

		spyOn(productServiceMock, 'query').andReturn(['query']);
	}));

	xit('should main page location is / and controller is MainCtrl', function() {
		$rootScope.$digest();
		expect($location.path()).toBe('/');
		expect($state.current.controller).toBe('MainCtrl');
	});

	it('should state href to match URL', function() {
		expect($state.href('main')).toEqual('/');
		expect($state.href('admin')).toEqual('/admin');
		expect($state.href('login')).toEqual('/login');
		expect($state.href('signup')).toEqual('/signup');
		expect($state.href('settings')).toEqual('/settings');
	});

	it('should location /products resolve productData', inject(function($injector) {
		expect($state.href('products')).toEqual('/products');

		$state.go('products');
		$rootScope.$digest();

		expect($injector.invoke($state.current.resolve.productData)).toEqual(jasmine.any(Array));
	}));

	it('should location products.query match params', inject(function($injector) {
		expect($state.href('products.query', {category:'android'})).toEqual('/products/category/android/');
		expect($state.href('products.query', {category:'android', brand:'htc'})).toEqual('/products/category/android/htc');

		$state.go('products.query', { brand: 'htc' });
		$rootScope.$digest();

		expect($state.current.name).toEqual('products.query');
		expect($state.params).toEqual({ 
			category:'all', 
			brand: 'htc',
			price: undefined,
			os: undefined,
			display: undefined,
			flash: undefined,
			ram: undefined,
			camera: undefined,
			page: 1 
      	});
	}));

	it('should location /products/:productId resolve product', inject(function($injector) {
		expect($state.href('products.detail', {productId: 1})).toEqual('/products/detail/1');

		spyOn(productResourceMock, 'get').andReturn({ $promise:'ProductDetail' });

		$state.go('products.detail', { productId:1 });
		$rootScope.$digest();

		expect($state.current.name).toEqual('products.detail');
		expect(productResourceMock.get).toHaveBeenCalledWith({ id:1 });
		expect($injector.invoke($state.current.resolve.product)).toEqual('ProductDetail');
	}));

	it('should redirect to the main page when state/location not exists', function() {
		$location.path('/random/route');
		$rootScope.$digest();
		expect($location.path()).toBe('/');
	});
});
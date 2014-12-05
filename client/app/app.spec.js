'use strict';

describe('Routes test', function() {

	var $location, $state, $rootScope, productServiceMock;

  	beforeEach(module('exampleAppApp', function($provide) {
  		$provide.value('productService', productServiceMock = {});
		productServiceMock.all = jasmine.createSpy('all').andReturn(['All']);
		productServiceMock.get = jasmine.createSpy('get').andReturn(['Detail']);
  	}));

	beforeEach(inject(function(_$location_, _$state_, _$rootScope_, $httpBackend, $templateCache) {
		$location = _$location_;
		$state = _$state_;
		$rootScope = _$rootScope_;
		$templateCache.put('app/main/main.html', '');
		$templateCache.put('app/product/list/phone.html', '');
		$templateCache.put('app/product/view/phone.html', '');
	}));

	it('should main page location is / and controller is MainCtrl', function() {
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

	it('should location /products resolve products', inject(function($injector) {
		expect($state.href('products')).toEqual('/products');

		$state.go('products');
		$rootScope.$digest();
		expect($state.current.name).toEqual('products');

		expect($injector.invoke($state.current.resolve.products)).toEqual(['All']);
	}));

	it('should location /products/:productId resolve product', inject(function($injector) {
		expect($state.href('products.detail', {productId: 1})).toEqual('/products/detail/1');

		$state.go('products.detail', { productId:1 });
		$rootScope.$digest();
		expect($state.current.name).toEqual('products.detail');

		expect($injector.invoke($state.current.resolve.product)).toEqual(['Detail']);
	}));

	it('should redirect to the main page when state/location not exists', function() {
		$location.path('/non-existent/route');
		$rootScope.$digest();
		expect($location.path()).toBe('/');
	});
});
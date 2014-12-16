'use strict';

describe('Routes test', function() {

	var $location, $state, $rootScope, productServiceMock;

  	beforeEach(module('exampleAppApp', function($provide) {
		productServiceMock = {
			query: angular.noop,
			get: angular.noop
		};
		$provide.value('productService', productServiceMock);
  	}));

	beforeEach(inject(function(_$location_, _$state_, _$rootScope_, $templateCache) {
		$location = _$location_;
		$state = _$state_;
		$rootScope = _$rootScope_;

		$templateCache.put('app/main/main.html', '');
		$templateCache.put('app/product/index.html', '');
		$templateCache.put('app/product/list/product.html', '');
		$templateCache.put('app/product/detail/product.html', '');

		spyOn(productServiceMock, 'query').andReturn({ $promise:'ProductsList' });
		spyOn(productServiceMock, 'get').andReturn({ $promise:'ProductDetail' });
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
		expect($state.href('products.category', {category:'phones'})).toEqual('/products/category/phones');

		$state.go('products.category', {category:'phones'});
		$rootScope.$digest();

		expect($state.current.name).toEqual('products.category');
		expect($state.current.controller).toBe('ProductsListCtrl');
		expect(productServiceMock.query).toHaveBeenCalledWith({'criteria[category]':'phones'});
		expect($injector.invoke($state.current.resolve.products)).toEqual('ProductsList');
	}));

	it('should location /products/:productId resolve product', inject(function($injector) {
		expect($state.href('products.detail', {productId: 1})).toEqual('/products/1');

		$state.go('products.detail', { productId:1 });
		$rootScope.$digest();

		expect($state.current.name).toEqual('products.detail');
		expect($state.current.controller).toBe('ProductsDetailCtrl');
		expect(productServiceMock.get).toHaveBeenCalledWith({ id:1 });
		expect($injector.invoke($state.current.resolve.product)).toEqual('ProductDetail');
	}));

	it('should redirect to the main page when state/location not exists', function() {
		$location.path('/random/route');
		$rootScope.$digest();
		expect($location.path()).toBe('/');
	});
});
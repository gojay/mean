'use strict';

describe('Controller: ProductsSideCtrl ->', function () {

	beforeEach(module('exampleAppApp'));

	var $scope, $rootScope, $state, $timeout, $event, productDummy;

	beforeEach(inject(function($controller, $templateCache, _$rootScope_, _$state_, _$timeout_, _productDummy_){
      	$templateCache.put('app/main/main.html', '');

		$event = jasmine.createSpyObj('event', ['preventDefault', 'stopPropagation']);

		productDummy = _productDummy_;

		$rootScope = _$rootScope_;
		$scope = $rootScope.$new();
		$scope.search = productDummy.search;

		$state = _$state_;
		spyOn($state, 'go').and.callFake(function(state, params){
			// dump('callFake', state, params);
		});

		$timeout = _$timeout_;

		$controller('ProductsSideCtrl', {
			$scope: $scope,
			$rootScope: $rootScope,
			$state: $state
		})
	}));

	it('searchByCategory $state.go not called, when category is opened & dont have childs', function(){
		var category = {
			_id: 'mobile-phones',
			open: true,
			count: 10,
			children: []
		};
		$scope.searchByCategory(category, $event);
		expect($event.preventDefault).not.toHaveBeenCalled();
		expect($state.go).not.toHaveBeenCalled();
	});

	it('searchByCategory state have been called', function(){
		var category = {
			_id: 'mobile-phones',
			open: false,
			count: 10,
			children: [{ _id: 'android' }]
		};
		// var event = $scope.$emit("click");
		$scope.searchByCategory(category, $event);
		expect($event.preventDefault).toHaveBeenCalled();
		// expect(event.defaultPrevented).toBeTruthy();
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'mobile-phones' });
	});

	it('searchByBrand', function(){
		var event = {
			target: {
				checked: true
			}
		};
		$scope.searchByBrand(event, 'htc');
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', brand: 'htc' });

		$scope.searchByBrand(event, 'samsung');
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', brand: 'htc_samsung' });

		// unchecked brand htc
		event.target.checked = false;
		$scope.searchByBrand(event, 'htc');
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', brand: 'samsung' });
	});

	it('searchByFilter', function(){
		$scope.searchByFilter('os', { value: 'android 1.5' });
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', os: 'android 1.5' });

		$scope.searchByFilter('ram', { query: '512-1024' });
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', os: 'android 1.5', ram: '512-1024' });

		$scope.searchByFilter('flash', { query: '1024' });
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', os: 'android 1.5', ram: '512-1024', flash: '1024' });

		$scope.searchByFilter('display', { query: '3-4' });
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', os: 'android 1.5', ram: '512-1024', flash: '1024', display: '3-4' });

		$scope.searchByFilter('camera', { query: '4-5' });
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', os: 'android 1.5', ram: '512-1024', flash: '1024', display: '3-4', camera: '4-5' });

		spyOn($scope.search.display, 'clear').and.callThrough();

		$scope.clearFilter('display');
		expect($scope.search.display.clear).toHaveBeenCalled();
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', os: 'android 1.5', ram: '512-1024', flash: '1024', display: null, camera: '4-5' });
	});

	it('searchByPrice', function(){
		$rootScope.$broadcast('slider:end');
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', price: '0-100' });

		$scope.setPriceDown('max');
		expect($state.go).toHaveBeenCalledWith('products.query', { category: 'all', price: '0-99' });
	});

	it('searchByPrice $state.go not called, when number decreased less than 0', function(){
		$scope.setPriceDown('min');
		expect($state.go).not.toHaveBeenCalled();
	});

	describe('products:loaded ->', function() {
		var data = {
			params: {},
			filters: {
				brands: [
					{ id: 'apple', name: 'Apple', selected: false },
					{ id: 'htc', name: 'HTC', selected: false },
					{ id: 'samsung', name: 'Samsung', selected: false }
				],
				price: {
					min: 0,
					max: 100
				},
				os: [],
				flash: [],
				ram: [],
				display: [],
				camera: []
			}
		};

		function setParam(name, value) {
			data.params[name] = value;
		}

		function setParams(params) {
			_.assign(data.params, params);
		}

		function setFilters(name, value) {
			data.filters[name] = value;
		}

		/*
		jasmine 2.0
		var customMatcher = {
		    toContain : function(util, customEqualityTesters) {
		        return {
		            compare : function(actual, expected){
		                if (expected === undefined) {
		                  expected = '';
		                }
		                var result = {};
		                _.map(actual, function(item){
		                    _.map(item, function(subItem, key){
		                        result.pass = util.equals(subItem,
		                        expected[key], customEqualityTesters);
		                    });
		                });
		                if(result.pass){
		                    result.message = 'Expected '+ actual + 'to contain '+ expected;
		                }
		                else{
		                    result.message = 'Expected '+ actual + 'to contain '+ expected+' but it was not found';
		                }
		                return result;
		            }
		        };
		    }
		};
		beforeEach(function(){
	        jasmine.addMatchers(customMatcher);
	    });
		*/
	
		it('load parameter undefined', function() {
			$rootScope.$broadcast('products:loaded', data);

			var everyCategoriesHasOpen = _.every($scope.search.category.data, { open: false, loading: false });
			expect(everyCategoriesHasOpen).toBeTruthy();
			var everyBrandsAreNotSelected = _.every($scope.search.brand.data, { selected: false });
			expect(everyBrandsAreNotSelected).toBeTruthy();

			expect($scope.search.brand.selected).toEqual([]);
			expect($scope.search.os.selected).toEqual(null);
			expect($scope.search.storage.ram.selected).toEqual(null);
			expect($scope.search.storage.flash.selected).toEqual(null);
			expect($scope.search.display.selected).toEqual(null);
			expect($scope.search.camera.selected).toEqual(null);
		});

		it('load parameter & filter : category', function() {
			// add categories into the 'products:loaded' data
			data.categories = productDummy.search.category.data;
			// set category parameter of products:loaded data
			setParam('category', 'android');
			// set category filters of products:loaded data
			setFilters('category', [
				{ "_id" : "android", "total" : 10 },
				{ "_id" : "phones", "total" : 20 }
	        ]);
			$rootScope.$broadcast('products:loaded', data);

			// this category is opened
			var category = _.findDeep($scope.search.category.data, { _id: 'android' });
			expect(category.open).toBeTruthy();

			// the category sibling is closed
			var categorySibling = _.findDeep($scope.search.category.data, { _id: 'phones' });
			expect(categorySibling.open).toBeFalsy();

			// number of this parent category to be 30
			var parent = _.find($scope.search.category.data, { _id: category.parent });
			expect(parent.count).toBe(30);
		});

		it('load parameter : brand', function() {
			setParam('brand', 'apple');
			$rootScope.$broadcast('products:loaded', data);

			expect($scope.search.brand.selected).toEqual(['apple']);
			expect($scope.search.brand.data).toEqual([
				{ id: 'apple', name: 'Apple', selected: true },
				{ id: 'htc', name: 'HTC', selected: false },
				{ id: 'samsung', name: 'Samsung', selected: false }
			]);

			setParam('brand', ['apple', 'htc']);
			$rootScope.$broadcast('products:loaded', data);

			expect($scope.search.brand.selected).toEqual(['apple', 'htc']);
			expect($scope.search.brand.data).toEqual([
				{ id: 'apple', name: 'Apple', selected: true },
				{ id: 'htc', name: 'HTC', selected: true },
				{ id: 'samsung', name: 'Samsung', selected: false }
			]);
		});

		it('load parameter : price', function() {
			setParam('price', { min: 10, max: 1600 });
			$rootScope.$broadcast('products:loaded', data);

			expect($scope.search.price.selected.min).not.toBe(10);
			expect($scope.search.price.selected.min).not.toBe(1600);
			$timeout.flush();
			
			expect($scope.search.price.selected.min).toBe(10);
			expect($scope.search.price.selected.max).toBe(1600);
		});

		it('load parameter: other filters', function() {
			setParams({
				os: 'android 1.5',
				ram: '512-1024',
				flash: '1024',
				display: '3-4',
				camera: '4-5'
			});
			$rootScope.$broadcast('products:loaded', data);

			expect($scope.search.os.selected).toBe('android 1.5');
			expect($scope.search.storage.ram.selected).toBe('512-1024');
			expect($scope.search.storage.flash.selected).toBe('1024');
			expect($scope.search.display.selected).toBe('3-4');
			expect($scope.search.camera.selected).toBe('4-5');
		});
	})

});
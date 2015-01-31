'use strict';

describe('route: Cloudinary', function() {

	beforeEach(module('exampleAppApp'));

	var $rootScope, $state;

	beforeEach(inject(function(_$rootScope_, _$state_, $templateCache){
		$rootScope = _$rootScope_;
		$state = _$state_;

		$templateCache.put('app/main/main.html', '');
		$templateCache.put('app/cloudinary/index/cloudinary.html', '');
		$templateCache.put('app/cloudinary/upload/upload.html', '');
		$templateCache.put('app/cloudinary/resources/resources.html', '');
		$templateCache.put('app/cloudinary/resources/list/list.html', '');
		$templateCache.put('app/cloudinary/resources/detail/detail.html', '');
		$templateCache.put('app/cloudinary/resources/custom/custom.html', '');
		$templateCache.put('app/cloudinary/url/url.html', '');
	}));

	describe('home', function() {
		beforeEach(function() {
			$state.go('cloudinary');
			$rootScope.$digest();
		});

		it('should url /cloudinary and have 2 views', function() {
			expect($state.current.url).toEqual('/cloudinary');
			expect(_.size($state.current.views)).toEqual(2);
		});

		it('should parent controller is CloudinaryCtrl', function() {
			var parent = $state.current.views[''];
			expect(parent).toBeDefined();
			expect(parent.controller).toEqual('CloudinaryCtrl');
		});

		it('should tab1 is upload controller', function() {
			expect($state.current.views['tab1@cloudinary']).toBeDefined();
			expect($state.current.views['tab1@cloudinary'].controller).toEqual('CloudinaryUploadCtrl');
		});

		it('should tab2 & tab3 undefined', function() {
			expect($state.current.views['tab2@cloudinary']).toBeUndefined();
			expect($state.current.views['tab3@cloudinary']).toBeUndefined();
		});
	});

	describe('tab resources', function() {
		beforeEach(function() {
			$state.go('cloudinary.resources');
			$rootScope.$digest();
		});

		it('should url undefined', function() {
			expect($state.current.url).toBeUndefined();
		});

		it('should view in tab2', function() {
			expect($state.current.views['tab2']).toBeDefined();
		});

		it('should tab upload and url is empty / undefined', function() {
			expect($state.current.views['tab1']).toEqual({});
			expect($state.current.views['tab3']).toBeUndefined();
		});

		describe('nested views', function() {
			var views;

			function getViewName(name) {
				return name + '@cloudinary.resources';
			}

			beforeEach(function() {
				views = _.pick($state.current.views, function(v, k) {
					return /\.(resources)$/.test(k);
				});
			});

			it('should have views and total is 3', function() {
				expect(views).toBeDefined();
				expect(_.size(views)).toEqual(3);
			});

			it('should have list view', function() {
				var list = getViewName('list');
				expect(views[list]).toBeDefined();
				expect(views[list].controller).toEqual('CloudinaryResourcesListCtrl');
			});

			it('should have detail view', function() {
				var detail = getViewName('detail');
				expect(views[detail]).toBeDefined();
				expect(views[detail].controller).toEqual('CloudinaryResourcesDetailCtrl');
			});

			it('should have custom view', function() {
				var custom = getViewName('custom');
				expect(views[custom]).toBeDefined();
				expect(views[custom].controller).toEqual('CloudinaryResourcesCustomCtrl');
			});
		});
	});
});
'use strict';

describe('Main Routes test', function() {

	var $location, $state, $rootScope;

  	beforeEach(module('exampleAppApp'));

	beforeEach(inject(function(_$location_, _$state_, _$rootScope_, $templateCache ) {
		$location = _$location_;
		$state = _$state_;
		$rootScope = _$rootScope_;

		$templateCache.put('app/main/main.html', '');
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

	it('should redirect to the main page when state/location not exists', function() {
		$location.path('/random/route');
		$rootScope.$digest();
		expect($location.path()).toBe('/');
	});
});
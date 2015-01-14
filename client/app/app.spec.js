'use strict';

describe('Main Routes test', function() {

	var $location, $state, $rootScope, Auth;

  	beforeEach(module('exampleAppApp'));

	beforeEach(inject(function(_$location_, _$state_, _$rootScope_, $templateCache, _Auth_) {
		$location = _$location_;
		$state = _$state_;
		$rootScope = _$rootScope_;

		$templateCache.put('app/main/main.html', '');

		Auth = _Auth_;
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

	xit('should redirect to /login if unauthenticated', function() {
		spyOn(Auth, 'logout').andCallThrough();
		$rootScope.$broadcast('unauthenticated', { message: 'You\'re not authenticated' });
		expect(Auth.logout).toHaveBeenCalled();
		expect($location.path()).toBe('/login');
	});

	it('should show modal auth if unauthenticated', inject(function(Modal) {
		spyOn(Auth, 'logout').andCallThrough();
		spyOn(Modal, 'auth').andCallThrough();

		$rootScope.$broadcast('unauthenticated', { message: 'You\'re not authenticated' });
		
		expect(Auth.logout).toHaveBeenCalled();
		expect(Modal.auth).toHaveBeenCalled();
	}));

	describe('jwtInterceptor', function() {
		beforeEach(inject(function($q, $cookieStore, jwtHelper) {
			spyOn(Auth, 'getToken').andReturn('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NGFiNzBiNDliOTQ3NTYwMDYyZmE5Y2YiLCJpYXQiOjE0MjExNzEyNTQ2NzYsImV4cCI6MTQyMTE3NDg1NDY3Niwic3ViIjoiZ2l0aHVifDE2MTg2MzcifQ.FN_5pRmc9YyHsxhrvW6hNDP9wO-yjND1cleUrNt-RSc');
			spyOn(Auth, 'refreshToken').andCallFake(function() {
				var deferred = $q.defer();
				var token = 'newToken';
				$cookieStore.put('token', token)
				deferred.resolve(token);
				return deferred.promise;
			});
			this.jwtHelper = jwtHelper;
			this.cookieStore = $cookieStore;
		}));

		it('should refresh token when token expired', function() {
			spyOn(this.jwtHelper, 'isTokenExpired').andReturn(true);
			$rootScope.$digest();

			expect(this.jwtHelper.isTokenExpired).toHaveBeenCalled();
			expect(Auth.refreshToken).toHaveBeenCalled();
			expect(this.cookieStore.get('token')).toBe('newToken');
		});
	});
});
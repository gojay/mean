'use strict';

describe('Service: Auth', function() {

	var Auth, $httpBackend, $cookieStore, User;

  	beforeEach(module('exampleAppApp'));

	beforeEach(inject(function ($q, _User_, _Auth_, _$httpBackend_, _$cookieStore_, $templateCache) {
    	$templateCache.put('app/main/main.html', '');

    	Auth = _Auth_;
    	spyOn(Auth, 'logout').andCallThrough();

		User = _User_;
		spyOn(User, 'get').andCallThrough();

    	$httpBackend = _$httpBackend_;

    	$cookieStore = _$cookieStore_;
	}));

	describe('simulate login - changePassword - logout', function() {
		beforeEach(function() {
	    	$httpBackend.expectPOST('/auth/local').respond({ token: 'token' });
	    	$httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });

			Auth.login({ email: 'test@test.com', password: 'password' });
			$httpBackend.flush();
	    });

	    it('login', function() {
			Auth.isLoggedInAsync(function(loggedIn){
				expect(isLoggedIn).toBeTruthy();
			});

			expect(Auth.logout).not.toHaveBeenCalled();
			expect(User.get).toHaveBeenCalled();

			expect(Auth.getCurrentUser().name).toEqual('user');
			expect(Auth.isLoggedIn()).toBeTruthy();
			expect(Auth.getToken()).toEqual('token');
			expect(Auth.isAdmin()).toBeFalsy();
	    });

	    it('changePassword', function() {
	    	var respond;

			expect(Auth.getToken()).not.toBeUndefined();
			expect(Auth.getCurrentUser()._id).toEqual(3);

    		$httpBackend.expectPUT('/api/users/3/password').respond(200);
    		Auth.changePassword({ oldPassword: '123', newPassword: '345' })
    			.then(function() {
    				respond = 'updated';
    			})
    			.catch(function() {
    				respond = 'fail';
    			});
    		$httpBackend.flush();

    		expect(respond).toBe('updated');
	    });

	    it('logout', function() {
	    	Auth.logout();
			expect(Auth.getToken()).toBeUndefined();
			expect(Auth.getCurrentUser()).toEqual({});
			expect(Auth.isLoggedIn()).toBeFalsy();
	    });
	});

	describe('createUser', function() {
    	var respond;
    	beforeEach(function() {
			$httpBackend.expectPOST('/api/users').respond(201, { token: 'token' });
	    	$httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });

			Auth.createUser({
				name: 'user',
				email: 'test@test.com'
			}).then(function() {
				respond = 'created';
			}).catch(function() {
				respond = 'fail';
			});
			$httpBackend.flush();
    	});

		it('respond to be created', function() {
			expect(respond).toBe('created');
		});

		it('get token', function() {
			expect(Auth.getToken()).toEqual('token');
		});

		it('get current user name to equal "user"', function() {
			expect(Auth.getCurrentUser().name).toEqual('user');
		});
	});

	describe('login fail', function() {
		var result = {
			success: null,
			error: null
		};

		beforeEach(function() {
	    	$httpBackend.expectPOST('/auth/local').respond(404, 'User not found');

			Auth.login({ email: 'test@test.com', password: 'password' })
				.then(function(data) {
					result.success = data;
				}, function(err) {
					result.error = err;
				});

			$httpBackend.flush();
		});

		it('Auth logout to have been called, result success is null, and result error to be "user not found"', function() {
			expect(Auth.logout).toHaveBeenCalled();
			expect(result.success).toBeNull();
			expect(result.error).toBe('User not found');
		});

		it('current user is empty, is logged in to be false and token undefined', function() {
			expect(Auth.getCurrentUser()).toEqual({});
			expect(Auth.isLoggedIn()).toBeFalsy();
			expect(Auth.getToken()).toBeUndefined();
		});
	});
});

describe('Service: Oauth', function() {
  	beforeEach(module('exampleAppApp'));

  	describe('window', function() {
  		var oauthWindow;
  		beforeEach(inject(['Oauth.window', function(_oauthWindow_) {
  			oauthWindow = _oauthWindow_
  		}]));

  		it('options for facebook, google, twitter & github are defined', function() {
  			expect(oauthWindow.facebook).toBeDefined();
  			expect(oauthWindow.google).toBeDefined();
  			expect(oauthWindow.twitter).toBeDefined();
  			expect(oauthWindow.github).toBeDefined();
  		});
  	});

  	describe('popup', function() {
  		var $q, $window, $interval, popup;
  		beforeEach(inject(['$q', '$window', '$interval', '$templateCache', 'Oauth.popup', function(_$q_, _$window_, _$interval_, $templateCache, _popup_) {
    		$templateCache.put('app/main/main.html', '');
  			$q = _$q_;
  			$window = _$window_;
  			spyOn($window, 'open').andCallThrough();

  			$interval = _$interval_;
  			popup = _popup_;
  		}]));

		it('should be defined', function() {
		    expect(popup).toBeDefined();
		});

		it('should add left and top offset options', function() {
		    var preparedOptions = popup.prepareOptions('github');
		    expect(preparedOptions.left).toBeDefined();
		    expect(preparedOptions.top).toBeDefined();
		});

	  	it('should stringify popup options', function() {
		    var options = {
		        width: 481,
		        height: 269
		    };
		    var stringOptions = popup.stringifyOptions(options);
		    expect(stringOptions).toBe('width=481,height=269');
		});

		it('should open a new popup', function() {
		    var open = popup.open('github.com', 'github');
		    $interval.flush(300);
		    expect(angular.isObject(open)).toBe(true);
		    expect($window.open).toHaveBeenCalled();
		});
  	});
});
'use strict';

describe('Service: Auth', function() {

	var Auth, $httpBackend, $cookieStore, User;

  	beforeEach(module('exampleAppApp'));

	beforeEach(inject(function ($q, _User_, _Auth_, _$httpBackend_, _$cookieStore_, $templateCache) {
    	$templateCache.put('app/main/main.html', '');

    	Auth = _Auth_;
    	spyOn(Auth, 'logout').andCallThrough();

    	/*User = _User_;
		spyOn(User, 'get').andCallFake(function(){
			var deferred = $q.defer();
			deferred.resolve({ role: 'user', name: 'user' });
			return { $promise: deferred.promise };
		});*/

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

	it('createUser', function() {
    	var respond;

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

		expect(respond).toBe('created');
		expect(Auth.getToken()).toEqual('token');
		expect(Auth.getCurrentUser().name).toEqual('user');
	});

	it('login fail', function() {
		var result = {
			success: null,
			error: null
		};

    	$httpBackend.expectPOST('/auth/local').respond(404, 'User not found');

		Auth.login({ email: 'test@test.com', password: 'password' })
			.then(function(data) {
				result.success = data;
			}, function(err) {
				result.error = err;
			});
		$httpBackend.flush();

		expect(Auth.logout).toHaveBeenCalled();
		expect(result.success).toBeNull();
		expect(result.error).toBe('User not found');

		expect(Auth.getCurrentUser()).toEqual({});
		expect(Auth.isLoggedIn()).toBeFalsy();
		expect(Auth.getToken()).toBeUndefined();
	});
});
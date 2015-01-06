'use strict';

describe('Directive: loginForm', function () {

  // load the directive's module and view
  beforeEach(module('exampleAppApp'));
  beforeEach(module('components/loginForm/loginForm.html'));

  var element, scope, Auth, $httpBackend, $location;

  beforeEach(inject(function ($rootScope, $templateCache, _$location_, _$httpBackend_, _Auth_) {
    $templateCache.put('app/main/main.html', '');
    $templateCache.put('app/account/settings/settings.html', '');

    scope = $rootScope.$new();

    Auth = _Auth_;

    spyOn(Auth, 'login').andCallThrough();
    
    $httpBackend = _$httpBackend_;

    $location = _$location_;
    spyOn($location, 'path').andCallThrough();
  }));

  describe('Login Auth successful', function() {

    beforeEach(function() {
      $httpBackend.expectPOST('/auth/local').respond({ token: 'token' });
      $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });
    });

    it('should redirect to / when user click login button', inject(function ($compile) {
      element = angular.element('<login-form></login-form>');
      element = $compile(element)(scope);
      
      scope.$apply();

      scope.user = {
        email: 'test@test.com',
        password: 'password'
      };
      scope.$digest();

      element.find('button[type="submit"]').click();

      expect(scope.form.$valid).toBeTruthy();

      $httpBackend.flush();

      expect(Auth.login).toHaveBeenCalled();
      expect(scope.errors).toEqual({});
      expect($location.path).toHaveBeenCalledWith('/');
    }));

    it('should redirect to /products when directive has attr loginReferrer user click login button', inject(function ($compile) {
      element = angular.element('<login-form login-referrer="/settings"></login-form>');
      element = $compile(element)(scope);

      scope.$apply();
      
      element.find('input[name="email"]').val('test@test.com').trigger('input');
      element.find('input[name="password"]').val('password').trigger('input');

      scope.$digest();

      element.find('button[type="submit"]').click();
      
      expect(scope.form.$valid).toBeTruthy();

      $httpBackend.flush();

      expect(Auth.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password'
      });
      expect($location.path).toHaveBeenCalledWith('/settings');
    }));

    it('should login fail when password empty', inject(function ($compile) {
      element = angular.element('<login-form></login-form>');
      element = $compile(element)(scope);
      
      scope.$apply();

      element.find('input[name="email"]').val('test@test.com').trigger('input');
      
      scope.$digest();

      element.find('button[type="submit"]').click();

      expect(element.find('.help-block:first-child').hasClass('ng-hide')).toBeFalsy();

      expect(scope.form.email.$valid).toBeTruthy();

      expect(scope.form.$valid).toBeFalsy();
      expect(scope.form.password.$valid).toBeFalsy();
      expect(scope.form.password.$error.required).toBeTruthy();
    }));
  });

  it('should login fail when user not found', inject(function ($compile) {
    $httpBackend.expectPOST('/auth/local').respond(404, { message: 'user not found!' });

    element = angular.element('<login-form></login-form>');
    element = $compile(element)(scope);
    
    scope.$apply();
    
    element.find('input[name="email"]').val('test@test.com').trigger('input');
    element.find('input[name="password"]').val('password').trigger('input');

    scope.$digest();

    element.find('button[type="submit"]').click();

    expect(scope.form.$valid).toBeTruthy();

    $httpBackend.flush();

    expect(Auth.login).toHaveBeenCalled();

    expect(scope.errors.other).toBe('user not found!');

    expect(element.find('.help-block:last-child').text()).toEqual('user not found!');
  }));
});
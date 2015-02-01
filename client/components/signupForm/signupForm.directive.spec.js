'use strict';

describe('Directive: signupForm', function () {
  var $window;

  // load the directive's module and view
  beforeEach(module('exampleAppApp', function($provide){
    /* http://stackoverflow.com/questions/20029474/writing-a-test-for-a-directive-that-does-a-full-page-reload-in-karma#answer-20030723 */
    $window = {
      location: {},
      document: window.document
    };
    $provide.value('$window', $window);
  }));
  beforeEach(module('components/signupForm/signupForm.html'));
  beforeEach(module('components/loginForm/loginOauth.html'));

  var element, scope, Auth, $httpBackend, $location;

  /* Helpers */

  var getEl = function(type, name, errType) {
    var el = {
      input: function() {
        return element.find('input[name="'+ name +'"]');
      },
      message: function() {
        var errClass = '.err-' + errType.toLowerCase();
        return this.input().siblings(errClass).not('.ng-hide');
      },
      submit: function() {
        return element.find('button[type="submit"]');
      }
    };
    return el[type]();
  };
  var setEl = function(name, value) {
    var el = getEl('input', name);
    el.val(value).trigger('input');
  };
  var submitForm = function(inputs) {
    if(inputs) {
      angular.forEach(inputs, function(v,k) {
        setEl(k,v);
      });
      scope.$digest();
    }
    getEl('submit').click();
  };

  /* /Helpers */

  beforeEach(inject(function ($rootScope, $templateCache, _$location_, _$httpBackend_, _Auth_, jwtHelper) {
    $templateCache.put('app/main/main.html', '');
    $templateCache.put('app/account/settings/settings.html', '');

    scope = $rootScope.$new();

    Auth = _Auth_;

    spyOn(Auth, 'createUser').and.callThrough();
    
    $httpBackend = _$httpBackend_;

    $location = _$location_;
    spyOn($location, 'path').and.callThrough();

    spyOn(jwtHelper, 'isTokenExpired').and.returnValue(false);
  }));

  describe('default', function() {
    beforeEach(inject(function($compile) {
      element = angular.element('<signup-form></signup-form>');
      element = $compile(element)(scope);
      scope.$apply();
    }));

    describe('form invalid', function() {
      it('should show all message are required', function() {
        submitForm();

        expect(getEl('message', 'name', 'required')).toBeTruthy();
        expect(getEl('message', 'email', 'required')).toBeTruthy();
        expect(getEl('message', 'password', 'required')).toBeTruthy();

        expect(scope.form.$invalid).toBeTruthy();
        expect(scope.form.name.$invalid).toBeTruthy();
        expect(scope.form.name.$error.required).toBeTruthy();
        expect(scope.form.email.$invalid).toBeTruthy();
        expect(scope.form.email.$error.required).toBeTruthy();
        expect(scope.form.password.$invalid).toBeTruthy();
        expect(scope.form.password.$error.required).toBeTruthy();
      });

      it('should show email & password error required messages', function() {
        submitForm({ name: 'name' });

        expect(getEl('message', 'email', 'required')).toBeTruthy();
        expect(getEl('message', 'password', 'required')).toBeTruthy();

        expect(scope.form.$invalid).toBeTruthy();
        expect(scope.form.email.$invalid).toBeTruthy();
        expect(scope.form.email.$error.required).toBeTruthy();
        expect(scope.form.password.$invalid).toBeTruthy();
        expect(scope.form.password.$error.required).toBeTruthy();
      });

      it('should show message error email not valid', function() {
        submitForm({
          name: 'test',
          email: 'email',
          password: 'password',
        });

        expect(getEl('message', 'email', 'email')).toBeTruthy();

        expect(scope.form.$invalid).toBeTruthy();
        expect(scope.form.email.$invalid).toBeTruthy();
        expect(scope.form.email.$error.email).toBeTruthy();
      });

      it('should show message error password minlength', function() {
        submitForm({
          name: 'test',
          email: 'email',
          password: '12',
        });
        
        expect(getEl('message', 'password', 'minlength')).toBeTruthy();

        expect(scope.form.$invalid).toBeTruthy();
        expect(scope.form.password.$invalid).toBeTruthy();
        expect(scope.form.password.$error.minlength).toBeTruthy();
      });
    });

    describe('Auth: local', function() {
      describe('signup successful', function() {
        beforeEach(function() {
          $httpBackend.expectPOST('/api/users').respond(201, { token: 'token' });
          $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });

          submitForm({
            name: 'test',
            email: 'test@test.com',
            password: 'password',
          });

          $httpBackend.flush();
        });

        it('should Auth createUser to have been called', function() {
          expect(Auth.createUser).toHaveBeenCalled();
        });

        it('should errors are empty', function() {
          expect(scope.errors).toEqual({});
        });

        it('should location path to /', function() {
          expect($location.path).toHaveBeenCalledWith('/');
        });
      });

      describe('signup fail: 422', function() {
        beforeEach(function() {
          $httpBackend.expectPOST('/api/users').respond(422, { message: 'email already taken!' });
          
          submitForm({
            name: 'test',
            email: 'test@test.com',
            password: 'password',
          });

          $httpBackend.flush();
        });

        it('should show email mongoose error message', inject(function ($compile) {
          expect(getEl('message', 'email', 'mongoose')).toBeTruthy();
        }));
      });
    });
  });

  describe('with referrer query', function() {
    beforeEach(inject(function($compile) {
      element = angular.element('<signup-form signup-referrer="/settings"></signup-form>');
      element = $compile(element)(scope);
      scope.$apply();
    }));

    describe('Auth: local', function() {
      beforeEach(function() {
        $httpBackend.expectPOST('/api/users').respond(201, { token: 'token' });
        $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });
          
        submitForm({
          name: 'test',
          email: 'test@test.com',
          password: 'password'
        });
        
        $httpBackend.flush();
      });

      it('should to have been called', function() {
        expect(Auth.createUser).toHaveBeenCalledWith({
          name: 'test',
          email: 'test@test.com',
          password: 'password'
        });
      });

      it('should redirect to referrer', function() {
        expect($location.path).toHaveBeenCalledWith('/settings');
      });
    });

    describe('Auth: oauth', function() {
      it('should redirect to auth facebook with referrer query', inject(function($compile) {
        scope.loginOauth('facebook');
        expect($window.location.href).toBe('/auth/facebook?referrer=/settings');
      }));
      it('should redirect to auth twitter with referrer query', inject(function($compile) {
        scope.loginOauth('twitter');
        expect($window.location.href).toBe('/auth/twitter?referrer=/settings');
      }));
      it('should redirect to auth google with referrer query', inject(function($compile) {
        scope.loginOauth('google');
        expect($window.location.href).toBe('/auth/google?referrer=/settings');
      }));
      it('should redirect to auth github with referrer query', inject(function($compile) {
        scope.loginOauth('github');
        expect($window.location.href).toBe('/auth/github?referrer=/settings');
      }));
    });
  });

  describe('with callback signupSuccess', function() {
    beforeEach(inject(function($compile) {
      scope.signupSuccess = angular.noop;
      spyOn(scope, 'signupSuccess').and.callThrough();

      element = angular.element('<signup-form signup-success="signupSuccess()"></signup-form>');
      element = $compile(element)(scope);
      scope.$apply();
    }));

    it('signupSuccess toHaveBeenCalled', function() {
      $httpBackend.expectPOST('/api/users').respond(201, { token: 'token' });
      $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });
      
      submitForm({
        name: 'test',
        email: 'test@test.com',
        password: 'password'
      });
      
      $httpBackend.flush();

      expect(scope.signupSuccess).toHaveBeenCalled();
    });
  });

});
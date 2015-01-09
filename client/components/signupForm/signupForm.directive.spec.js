'use strict';

xdescribe('Directive: signupForm', function () {
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
  beforeEach(module('components/signupForm/loginOauth.html'));

  var element, scope, Auth, $httpBackend, $location;

  beforeEach(inject(function ($rootScope, $templateCache, _$location_, _$httpBackend_, _Auth_) {
    $templateCache.put('app/main/main.html', '');
    $templateCache.put('app/account/settings/settings.html', '');

    scope = $rootScope.$new();

    Auth = _Auth_;

    spyOn(Auth, 'signup').andCallThrough();
    
    $httpBackend = _$httpBackend_;

    $location = _$location_;
    spyOn($location, 'path').andCallThrough();
  }));

  describe('default', function() {
    beforeEach(inject(function($compile) {
      element = angular.element('<signup-form></signup-form>');
      element = $compile(element)(scope);
      scope.$apply();
    }));

    describe('form invalid', function() {
      it('should show message error email && password required', function() {
        element.find('button[type="submit"]').click();

        expect(element.find('#input-email > .help-block:first-child').hasClass('ng-hide')).toBeFalsy();
        expect(element.find('#input-password > .help-block').hasClass('ng-hide')).toBeFalsy();

        expect(scope.form.$valid).toBeFalsy();
        expect(scope.form.email.$invalid).toBeTruthy();
        expect(scope.form.email.$error.required).toBeTruthy();
        expect(scope.form.password.$invalid).toBeTruthy();
        expect(scope.form.password.$error.required).toBeTruthy();
      });

      it('should show message error email required', function() {
        element.find('input[name="password"]').val('password').trigger('input');
        
        scope.$digest();
          
        element.find('button[type="submit"]').click();

        expect(element.find('#input-email > .help-block:first-child').hasClass('ng-hide')).toBeFalsy();

        expect(scope.form.$valid).toBeFalsy();
        expect(scope.form.email.$invalid).toBeTruthy();
        expect(scope.form.email.$error.required).toBeTruthy();
        expect(scope.form.password.$valid).toBeTruthy();
      });

      it('should show message error email not valid', function() {
        element.find('input[name="email"]').val('test').trigger('input');
        element.find('input[name="password"]').val('password').trigger('input');
        
        scope.$digest();
          
        element.find('button[type="submit"]').click();

        expect(element.find('#input-email > .help-block:last-child').hasClass('ng-hide')).toBeFalsy();

        expect(scope.form.$valid).toBeFalsy();
        expect(scope.form.email.$invalid).toBeTruthy();
        expect(scope.form.email.$error.email).toBeTruthy();
        expect(scope.form.password.$valid).toBeTruthy();
      });

      it('should show message error password required', function() {
        element.find('input[name="email"]').val('test@test.com').trigger('input');
        
        scope.$digest();
          
        element.find('button[type="submit"]').click();

        expect(element.find('#input-password > .help-block').hasClass('ng-hide')).toBeFalsy();

        expect(scope.form.email.$valid).toBeTruthy();

        expect(scope.form.$valid).toBeFalsy();
        expect(scope.form.password.$valid).toBeFalsy();
        expect(scope.form.password.$error.required).toBeTruthy();
      });
    });

    describe('Auth: local', function() {
      describe('signup successful', function() {
        beforeEach(function() {
          $httpBackend.expectPOST('/auth/local').respond({ token: 'token' });
          $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });

          scope.user = {
            email: 'test@test.com',
            password: 'password'
          };
          scope.$digest();

          element.find('button[type="submit"]').click();

          expect(scope.form.$valid).toBeTruthy();

          $httpBackend.flush();
        });

        it('should form valid & Auth signup have been called', function() {
          expect(Auth.signup).toHaveBeenCalled();
        });

        it('should errors are empty', function() {
          expect(scope.errors).toEqual({});
        });

        it('should location path to /', function() {
          expect($location.path).toHaveBeenCalledWith('/');
        });
      });

      describe('signup fail: 404', function() {
        beforeEach(function() {
          $httpBackend.expectPOST('/auth/local').respond(404, { message: 'user not found!' });
          
          element.find('input[name="email"]').val('test@test.com').trigger('input');
          element.find('input[name="password"]').val('password').trigger('input');

          scope.$digest();

          element.find('button[type="submit"]').click();

          $httpBackend.flush();
        });

        it('should form valid & Auth signup have been called', inject(function ($compile) {
          expect(Auth.signup).toHaveBeenCalled();
        }));

        it('should error others defined', inject(function ($compile) {
          expect(scope.errors.other).toBeDefined();
          expect(scope.errors.other).toBe('user not found!');
        }));

        it('should show error message', inject(function ($compile) {
          expect(element.find('#error-others > .help-block').text()).toEqual('user not found!');
        }));
      });
    });

    describe('Auth: oauth', function() {
      it('should redirect to auth facebook', function() {
        scope.signupOauth('facebook');
        expect($window.location.href).toBe('/auth/facebook');
      });
      it('should redirect to auth twitter', function() {
        scope.signupOauth('twitter');
        expect($window.location.href).toBe('/auth/twitter');
      });
      it('should redirect to auth google', function() {
        scope.signupOauth('google');
        expect($window.location.href).toBe('/auth/google');
      });
      it('should redirect to auth github', function() {
        scope.signupOauth('github');
        expect($window.location.href).toBe('/auth/github');
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
        $httpBackend.expectPOST('/auth/local').respond({ token: 'token' });
        $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });
        element.find('input[name="email"]').val('test@test.com').trigger('input');
        element.find('input[name="password"]').val('password').trigger('input');

        scope.$digest();

        element.find('button[type="submit"]').click();
        
        expect(scope.form.$valid).toBeTruthy();

        $httpBackend.flush();
      });

      it('should to have been called', function() {
        expect(Auth.signup).toHaveBeenCalledWith({
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
        scope.signupOauth('facebook');
        expect($window.location.href).toBe('/auth/facebook?referrer=/settings');
      }));
      it('should redirect to auth twitter with referrer query', inject(function($compile) {
        scope.signupOauth('twitter');
        expect($window.location.href).toBe('/auth/twitter?referrer=/settings');
      }));
      it('should redirect to auth google with referrer query', inject(function($compile) {
        scope.signupOauth('google');
        expect($window.location.href).toBe('/auth/google?referrer=/settings');
      }));
      it('should redirect to auth github with referrer query', inject(function($compile) {
        scope.signupOauth('github');
        expect($window.location.href).toBe('/auth/github?referrer=/settings');
      }));
    });
  });

  describe('with callback signup success', function() {
    beforeEach(inject(function($compile) {
      scope.signupSuccess = angular.noop;
      spyOn(scope, 'signupSuccess').andCallThrough();

      element = angular.element('<signup-form signup-success="signupSuccess()"></signup-form>');
      element = $compile(element)(scope);
      scope.$apply();
    }));

    it('signupSuccess toHaveBeenCalled', function() {
      $httpBackend.expectPOST('/auth/local').respond({ token: 'token' });
      $httpBackend.expectGET('/api/users/me').respond({ _id: 3, role: 'user', name: 'user' });

      element.find('input[name="email"]').val('test@test.com').trigger('input');
      element.find('input[name="password"]').val('password').trigger('input');

      scope.$digest();

      element.find('button[type="submit"]').click();
      
      expect(scope.form.$valid).toBeTruthy();

      $httpBackend.flush();

      expect(scope.signupSuccess).toHaveBeenCalled();
    });
  });

  describe('with dialog', function() {
    var $q, $timeout, Auth, popup;

    beforeEach(inject(['$q', '$timeout', '$compile', 'Auth', 'Oauth.popup', 
      function(_$q_, _$timeout_, $compile, _Auth_, _popup_) {
        $q = _$q_;
        $timeout = _$timeout_;

        // mock oauth.popup sevice
        popup = _popup_;
        spyOn(popup, 'open').andCallFake(function(){
          var deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        });

        // mock Auth sevice
        Auth = _Auth_;
        spyOn(Auth, 'getUserInAsync').andCallFake(function(){
          var deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        });

        scope.signupSuccess = angular.noop;
        spyOn(scope, 'signupSuccess').andCallThrough();

        element = angular.element('<signup-form signup-success="signupSuccess()" signup-dialog="true"></signup-form>');
        element = $compile(element)(scope);
        scope.$apply();
      }]
    ));

    it('should show popup when signup oauth', function() {
      scope.signupOauth('github');
      expect(popup.open).toHaveBeenCalled();
      scope.$digest();

      expect(Auth.getUserInAsync).toHaveBeenCalled();
      expect(scope.oauthLoading).toBeTruthy();

      $timeout.flush();

      expect(scope.oauthLoading).toBeFalsy();
      expect(scope.signupSuccess).toHaveBeenCalled();
    });
  });

});
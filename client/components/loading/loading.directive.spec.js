'use strict';

describe('Directive: loading', function () {

  // load the directive's module
  beforeEach(module('exampleAppApp'));

  var element,
    scope, $rootScope;

  beforeEach(inject(function (_$rootScope_, $templateCache) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $templateCache.put('app/main/main.html', '');
  }));

  describe('default', function(){
    beforeEach(inject(function ($compile) {
      element = angular.element('<loading-spinkit></loading-spinkit>');
      element = $compile(element)(scope);
    }));
    
    describe('loading inactive', function() {
      beforeEach(function() {
        $rootScope.$digest();
      });

      it('should element is hidden', function() {
        expect(element.hasClass('ng-hide')).toBeTruthy();
      });

      it('should wrapper has class spinner-wrapper-primary', function () {
        expect(element.hasClass('spinner-wrapper-primary')).toBeTruthy();
      });

      it('should first-child has class cube-grid-spinner', function() {
        expect(element.children(0).children(0).hasClass('cube-grid-spinner')).toBeTruthy();
      });

      it('should last-child has class text-primary and text is empty', function () {
        expect(element.children(1).hasClass('text-primary')).toBeTruthy();
        expect(element.children(1).text().trim()).toEqual('');
      });
    });

    describe('loading active', function() {
      beforeEach(inject(function($loading) {
        this.$loading = $loading;
        this.$loading.start('please wait');
        $rootScope.$digest();
      }));
      
      it('should element is hidden', function() {
        expect(element.hasClass('ng-hide')).toBeFalsy();
      });

      it('should show text message', function () {
        expect(element.children(1).text().trim()).toEqual('please wait');
      });

      it('should text message is changed', function () {
        this.$loading.start('another message');
        $rootScope.$digest();
        expect(element.children(1).text().trim()).toEqual('another message');
      });

      afterEach(function() {
        this.$loading.stop();
      });
    });
  });
    
  describe('custom', function() {
    beforeEach(inject(function($compile) {
      element = angular.element('<loading-spinkit spinkit="double-bounce-spinner" wrapper-class="success" class="custom-class" style="left:10px"></loading-spinkit>');
      element = $compile(element)(scope);
      $rootScope.$digest();
    }));

    it('should wrapper has class spinner-wrapper-success', function () {
      expect(element.hasClass('spinner-wrapper-success')).toBeTruthy();
    });

    it('should wrapper has class custom-class', function () {
      expect(element.hasClass('custom-class')).toBeTruthy();
    });

    it('should wrapper has class attribute style', function () {
      expect(element[0].hasAttribute('style')).toBeTruthy();
      expect(element[0].style.left).toBe('10px');
    });

    it('should first-child has class cube-grid-spinner', function() {
      expect(element.children(0).children(0).hasClass('double-bounce-spinner')).toBeTruthy();
    });

    it('should last-child has class text-success', function () {
      expect(element.children(1).hasClass('text-success')).toBeTruthy();
    });
  });

  describe('class', function() {

    describe('default', function() {
      beforeEach(inject(function ($compile, $loading) {
        element = angular.element('<div loading-spinkit-class></div>');
        element = $compile(element)(scope);
        this.$loading = $loading;
      }));
      it('should add loading class, when loading', function() {
        this.$loading.start();
        $rootScope.$apply();
        expect(element.hasClass('loading')).toBeTruthy();

        this.$loading.stop();
        $rootScope.$apply();
        expect(element.hasClass('loading')).toBeFalsy();
      });
    });
    
    describe('custom', function() {
      beforeEach(inject(function ($compile, $loading) {
        element = angular.element('<div loading-spinkit-class="custom-class"></div>');
        element = $compile(element)(scope);
        this.$loading = $loading;
      }));
      it('should add custom-class class, when loading', function() {
        this.$loading.start();
        $rootScope.$apply();
        expect(element.hasClass('custom-class')).toBeTruthy();

        this.$loading.stop();
        $rootScope.$apply();
        expect(element.hasClass('custom-class')).toBeFalsy();
      });
    })
  })
});
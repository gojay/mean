'use strict';

describe('Directive: imgLazyLoad', function () {

  // load the directive's module
  beforeEach(module('exampleAppApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<img-lazy-load></img-lazy-load>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('');
  }));
});
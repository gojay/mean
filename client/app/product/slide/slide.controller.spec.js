'use strict';

describe('Controller: ProductSlideCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var ProductSlideCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProductSlideCtrl = $controller('ProductSlideCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});

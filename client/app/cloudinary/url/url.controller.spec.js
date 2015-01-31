'use strict';

describe('Controller: CloudinaryUrlCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var CloudinaryUrlCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CloudinaryUrlCtrl = $controller('CloudinaryUrlCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});

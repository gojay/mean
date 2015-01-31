'use strict';

xdescribe('Controller: CloudinaryResourcesDetailCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var CloudinaryResourcesDetailCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CloudinaryResourcesDetailCtrl = $controller('CloudinaryResourcesDetailCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});

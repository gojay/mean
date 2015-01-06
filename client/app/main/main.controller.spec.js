'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));
  beforeEach(module('socketMock'));

  var MainCtrl,
      scope,
      $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope, $templateCache) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/things')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    $templateCache.put('app/main/main.html', '');

    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of things to the scope', inject(function (socket) {
    $httpBackend.flush();
    expect(scope.awesomeThings.length).toBe(4);

    socket.fire('thing:save', 'fromSocket');
    expect(scope.awesomeThings.length).toBe(5);

    socket.fire('thing:remove', 'fromSocket');
    expect(scope.awesomeThings.length).toBe(4);
  }));
});

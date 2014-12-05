'use strict';

describe('Controller: PhoneViewCtrl', function () {

  // load the controller's module
  beforeEach(angular.mock.module('exampleAppApp'));

  var PhoneViewCtrl, scope, $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    var product = {
      title: 'Motorola',
      meta: {
        images: {
          cdnUri: '/images/phones',
          files: ['motorola.0.jpg', 'motorola.1.jpg']
        }
      }
    };

    // $httpBackend = _$httpBackend_;
    // $httpBackend.expectGET('/api/products/1').respond(product);

    scope = $rootScope.$new();
    PhoneViewCtrl = $controller('PhoneViewCtrl', {
      $scope: scope,
      product: product
    });
  }));

  it('should get product when fetched from xhr and type of object', function () {
    // $httpBackend.flush();
    expect(scope.phone).toEqual(jasmine.any(Object));
    expect(scope.thumbnail).toEqual('/images/phones/original_motorola.0.jpg');
  });

  it('should set thumbnail', function() {
    // $httpBackend.flush();
    scope.setThumb(1);
    expect(scope.activeThumb).toEqual(1);
    expect(scope.thumbnail).toEqual('/images/phones/original_motorola.1.jpg');
  });
});

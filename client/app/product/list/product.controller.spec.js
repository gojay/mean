'use strict';

describe('Controller: ProductsListCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var ProductsListCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    var products = [{
        "_id": "548093f0088353a02b7646fb",
        "image": "/images/phones/original_motorola-charm-with-motoblur.2.jpg",
        "body": "Motorola CHARM fits easily in your pocket or palm.  Includes MOTOBLUR service.",
        "category": "motorola",
        "createdAt": "2014-12-04T17:03:44.248Z",
        "slug": "motorola-charm-with-motoblur",
        "title": "Motorola CHARM™ with MOTOBLUR™"
    },
    {
        "_id": "548093ef088353a02b7646fa",
        "image": "/images/phones/original_t-mobile-g2.2.jpg",
        "body": "The T-Mobile G2 with Google is the first smartphone built for 4G speeds on T-Mobile's new network. Get the information you need, faster than you ever thought possible.",
        "category": "t-mobile",
        "createdAt": "2014-12-04T17:03:43.878Z",
        "slug": "t-mobile-g2",
        "title": "T-Mobile G2"
    }];
    scope = $rootScope.$new();
    ProductsListCtrl = $controller('ProductsListCtrl', {
      $scope: scope,
      products: products
    });
  }));

  it('should get array products fetched from xhr', function () {
    // $httpBackend.flush();
    expect(scope.products).toEqual(jasmine.any(Array));
    expect(scope.products.length).toBe(2);
    expect(scope.orderProp).toEqual('createdAt');
  });
});

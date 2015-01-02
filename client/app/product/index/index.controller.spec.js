'use strict';

xdescribe('Controller: ProductsCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var $scope, ProductsCtrl;

  beforeEach(inject(function ($controller, $rootScope) {
    var productData = [{
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
    $scope = $rootScope.$new();
    ProductsCtrl = $controller('ProductsCtrl', {
      $scope: $scope,
      productData: productData
    });
  }));

  it('should products filters init', function () {
    
  });
});

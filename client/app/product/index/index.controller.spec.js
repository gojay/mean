'use strict';

describe('Controller: ProductsCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var $scope, ProductsCtrl;

  beforeEach(inject(function ($controller, $rootScope) {
    var productData = {
      categories: {
        data: []
      },
      filters: {
        data: {
          brands: [
            { id: 'apple', name: 'Apple' },
            { id: 'htc', name: 'HTC' },
            { id: 'samsung', name: 'Samsung' }
          ],
          price : [{
            min: 0,
            max: 1000
          }],
          os: [],
          flash: [],
          ram: [],
          camera: [],
          display: []
        }
      }
    };
    $scope = $rootScope.$new();
    ProductsCtrl = $controller('ProductsCtrl', {
      $scope: $scope,
      productData: productData
    });
  }));

  it('should products filters init', function () {
    $scope.$digest();
    expect($scope.filters.search.filterBy).toBe('$');
    expect($scope.filters.search.selected).toBeDefined();
    expect($scope.filters.search.title).toBe('Filter by Anything');
    expect($scope.filters.search.product).toEqual($scope.filters.search.query);
    expect($scope.filters.order.by).toEqual(jasmine.objectContaining({ id: 'title' }));
    expect($scope.filters.view.selected).toEqual('list');
  });

  it('should products search init', function () {
    $scope.$digest();
    expect($scope.search.price.selected.min).toBe(0);
    expect($scope.search.price.selected.max).toBe(1000);

    expect($scope.search.brand.get('htc')).toEqual({ id: 'htc', name: 'HTC' });
  });

  it('should products breadcrumb init', function () {
    expect($scope.breadcrumb.getTitle()).toBe('All Products');

    $scope.breadcrumb.set({ category: 'all', brand: 'htc_apple' });
    expect($scope.breadcrumb.getTitle()).toBe('HTC & Apple');
  });
});

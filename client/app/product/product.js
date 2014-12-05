'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('products', {
        url: '/products',
        templateUrl: 'app/product/list/phone.html',
        controller: 'PhoneListCtrl',
        resolve: {
          products: ['productService', function(productService) {
            return productService.all();
          }]
        }
      })
      .state('products.detail', {
        url: '/detail/:productId',
        templateUrl: 'app/product/view/phone.html',
        controller: 'PhoneViewCtrl',
        resolve: {
          product: ['productService', '$stateParams', function(productService, $stateParams) {
            return productService.get({ id:$stateParams.productId });
          }]
        }
      });
  });
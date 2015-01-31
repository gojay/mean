'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {

    $stateProvider
      .state('products', {
        url: '/products',
        data: {
          title: 'Products'
        },
        views: {
          '': { 
            templateUrl: 'app/product/index/index.html',
            controller: 'ProductsCtrl'
          },
          'breadcrumb@products': {
            templateUrl: 'app/product/breadcrumb.html'
          },
          'slides@products': {
            templateUrl: 'app/product/slides.html',
            controller: 'ProductSlideCtrl'
          },
          'categories@products': {
            templateUrl: 'app/product/categories.html'
          },
          'content@products': {
            templateUrl: 'app/product/list/product.html',
            controller: 'ProductsContentCtrl'
          },

          'side@products': {
            templateUrl: 'app/product/side/side.html',
            controller: 'ProductsSideCtrl'
          }
        }
      })
      .state('products.query', {
        url: '/category/{category:[a-zA-Z0-9_-]{1,}}/{brand}?price&os&display&flash&ram&camera&page',
        params: {
          category: 'all',
          brand: null,
          price: null,
          os: null,
          display: null,
          flash: null,
          ram: null,
          camera: null,
          page: 1
        },
        views: {
          'slides@products': { /* hidden */ },
          'categories@products': { /* hidden */ },
          'content@products': {
            templateUrl: 'app/product/list/product.html',
            controller: 'ProductsQueryContentCtrl'
          }
        }
      })
      .state('products.detail', {
        url: '/detail/:productId',
        /*resolve: {
          product: function($stateParams, productService) {
            return productService.get($stateParams.productId).$promise;
          }
        },*/
        views: {
          'content@products': {
            templateUrl: 'app/product/detail/product.html',
            controller: 'ProductsDetailCtrl'
          },
          'slides@products': {},
          'categories@products': {},
          'filters@products': {},
          'side@products': {}
        }
      })
  });
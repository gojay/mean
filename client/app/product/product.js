'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {

    var findDeep = function(items, attrs) {
      function match(value) {
        for (var key in attrs) {
          if(!_.isUndefined(value)) {
            if (attrs[key] !== value[key]) {
              return false;
            }
          }
        }

        return true;
      }
      function traverse(value) {
        var result;

        _.forEach(value, function (val) {
          if (match(val)) {
            result = val;
            return false;
          }

          if (_.isObject(val) || _.isArray(val)) {
            result = traverse(val);
          }

          if (result) {
            return false;
          }
        });

        return result;
      }
      return traverse(items);
    }
    _.mixin({ 'findDeep': findDeep });

    var query = {};

    $stateProvider
      .state('products', {
        url: '/products',
        data: {
          title: 'Products'
        },
        resolve: {
          // get products categories & filters
          productData: function(productService) {
            return productService.all(null, { exclude: 'products' });
          }
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
            controller: function($scope, $window, $state, $stateParams) {
              console.log('slides:$scope', $scope);

              var width = parseInt(angular.element('.carousel').width(), 10), 
                  height = 200;

              $scope.slides = {
                interval: 5000,
                data: [
                  {
                    image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/1',
                    title: 'Example headline.',
                    description: 'Note: If you\'re viewing this page via a <code>file://</code> URL, the "next" and "previous" Glyphicon buttons on the left and right might not load/display properly due to web browser security rules.',
                    link: $state.href('products.query({ productId:\'motorola\'})')
                  },
                  {
                    image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/2',
                    title: 'Another example headline.',
                    description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
                    link: $state.href('products.query({ productId:\'samsung\'})')
                  },
                  {
                    image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/3',
                    title: 'Another example headline.',
                    description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
                    link: $state.href('products.query({ productId:\'t-mobile\'})')
                  }
                ]
              };
            }
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
        resolve: {
          product: function($stateParams, productService) {
            return productService.get({ id: $stateParams.productId }).$promise;
          }
        },
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
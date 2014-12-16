'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('products', {
        url: '/products',
        data: {
          title: 'Products'
        },
        resolve: {
          categories: function($q, $http) {
            var deferred = $q.defer();
            $http.get('/api/categories/phones')
              .success(function(categories) {
                deferred.resolve(categories);
              });
            return deferred.promise;
          },
          products: function(productDummy) {
            return productDummy.list;
          }
        },
        views: {
          '': { 
            templateUrl: 'app/product/index.html',
            controller: function($scope) {
              $scope.filters = {
                search: {
                  data: [{
                    id: 'title',
                    type: 'text',
                    title: 'Title'
                  }, {
                    id: 'body',
                    type: 'text',
                    title: 'Description'
                  }, {
                    id: 'price',
                    type: 'number',
                    title: 'Greather than >'
                  }, {
                    id: 'price',
                    type: 'number',
                    title: 'Less than <'
                  }, {
                    id: '$',
                    type: 'text',
                    title: 'Anything'
                  }],
                  query: {
                    $: '',
                    title: '',
                    body: '',
                    price: '',
                  }, 
                  selected: null
                },
                order: {
                  data: [{
                    id: 'title',
                    title: 'Name - asc',
                    group: 'Name'
                  }, {
                    id: '-title',
                    title: 'Name - desc',
                    group: 'Name'
                  }, {
                    id: 'price',
                    title: 'Price - asc',
                    group: 'Price'
                  }, {
                    id: '-price',
                    title: 'Price - desc',
                    group: 'Price'
                  }, {
                    id: 'rating',
                    title: 'Rating - asc',
                    group: 'Rating'
                  }, {
                    id: '-rating',
                    title: 'Rating - desc',
                    group: 'Rating'
                  }]
                },
                view: {
                  data: [{
                    name: 'grid',
                    className: 'fa fa-th-large'
                  }, {
                    name: 'list',
                    className: 'fa fa-th-list'
                  }],
                  selected: 'list'
                }
              };
            }
          },
          'breadcrumb@products': {
            templateUrl: 'app/product/breadcrumb.html',
            contoller: function($scope) {
              console.log('breadcrumb@products:$scope', $scope)
            }
          },
          'slides@products': {
            templateUrl: 'app/product/slides.html',
            controller: function($scope, $window, $state, $stateParams) {
              console.log('slides:$scope', $scope);
              console.log('slides:$stateParams', $stateParams);

              var width = parseInt(angular.element('.carousel').width(), 10), 
                  height = 200;

              $scope.slides = {
                interval: 5000,
                data: [
                  {
                    image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/1',
                    title: 'Example headline.',
                    description: 'Note: If you\'re viewing this page via a <code>file://</code> URL, the "next" and "previous" Glyphicon buttons on the left and right might not load/display properly due to web browser security rules.',
                    link: $state.href('products.category({ productId:\'motorola\'})')
                  },
                  {
                    image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/2',
                    title: 'Another example headline.',
                    description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
                    link: $state.href('products.category({ productId:\'samsung\'})')
                  },
                  {
                    image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/3',
                    title: 'Another example headline.',
                    description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
                    link: $state.href('products.category({ productId:\'t-mobile\'})')
                  }
                ]
              };
            }
          },
          'categories@products': {
            templateUrl: 'app/product/categories.html',
            controller: function($scope, categories) {
              console.log('categories@products:$scope', $scope)
              $scope.categories = categories;
            }
          },
          'filters@products': {
            templateUrl: 'app/product/filter.html',
            controller: function($scope, $compile) {
              var $input = angular.element('input.input-filter');
              var searchFilters = $scope.filters.search;

              /* search */

              $scope.title = 'Filter by';
              $scope.filterBy = '$';
              $scope.setFilterBy = function(search) {
                $scope.filterBy = search.id;
                $scope.title = search.title;

                var recentQuery = $input.val();
                
                // set selected index query
                searchFilters.selected = search;
                // reset filter query
                _.forEach(searchFilters.query, function(item, key){ searchFilters.query[key] = '' });
                // change input type & set query
                if(search.type == 'number') {
                  $input.prop('type', 'number');
                  if(/^[0-9]+$/.test(recentQuery)) {
                    searchFilters.query[search.id] = recentQuery;
                  }
                } else {
                  $input.prop('type', 'text');
                  if(!/^[0-9]+$/.test(recentQuery)) {
                    searchFilters.query[search.id] = recentQuery;
                  }
                }
              }

              /* order */

              $scope.filters.order.by = $scope.filters.order.data[0];
            }
          },
          'content@products': {
            templateUrl: 'app/product/list/product.html',
            controller: function($scope, products) {
              $scope.products = products;

              $scope.priceFilters = function(product){
                var searchFilters = $scope.filters.search;
                var search = searchFilters.selected;
                if(/\>/.test(search.title))
                  return product.price > searchFilters.query.price;
                else
                  return searchFilters.query.price ? product.price < searchFilters.query.price : true ;
              }

              $scope.$watchCollection('filters.search.selected', function(searchSelected) {
                if (!searchSelected) {
                  $scope.productFilters = $scope.filters.search.query;
                  return;
                }

                // var searchFilters = $scope.filters.search;
                // var filter = searchFilters.data[newCollection];
                if(searchSelected.type == 'number') {
                  $scope.productFilters = $scope.priceFilters;
                } else {
                  $scope.productFilters = $scope.filters.search.query;
                }
              });
            }
          },

          'side@products': {
            templateUrl: 'app/product/side.html',
            controller: function($scope, $timeout) {
              
              $scope.search = {
                category: {
                  data: [
                    {
                      "title":"First",
                      "content":"Content A",
                      "loading": false,
                      "open":false,
                      "childs": ['Child 1','Child 2','Child 3']
                    },
                    {
                      "title":"Second",
                      "content":"Content B",
                      "loading": false,
                      "open":false,
                      "childs": ['Child 1','Child 2','Child 3','Child 4','Child 5']
                    },
                    {
                      "title":"Third",
                      "content":"Content C",
                      "loading": false,
                      "open":false,
                      "childs": ['Child 1','Child 2']
                    },
                  ]
                },
                brand: {
                  query: '',
                  selection: [],
                  data: [
                    {
                      name: 'Samsung',
                      selected: false
                    },{
                      name: 'Motorola',
                      selected: false
                    },{
                      name: 'T-Mobile',
                      selected: false
                    }
                  ]
                },
                price: {
                  options: {
                    min: 10,
                    max: 100,
                    step: 1
                  },
                  selected: {
                    min: 20,
                    max: 50
                  }
                } 
              };

              /* category */

              $scope.searchByCategory = function (group, $event) {
                // $http.get(group.url).success(function (data) {
                //   group.loaded = data
                // });
                $event.stopPropagation();
                group.loading = true;
                $timeout(function() {
                  group.loading = false;
                  group.open = true;
                }, 1000);
              }

              /* brand */

              // $scope.searchBrand = '';
              // $scope.selectionBrands = [];
              // $scope.brands = [{
              //   name: 'Samsung',
              //   selected: false
              // },{
              //   name: 'Motorola',
              //   selected: false
              // },{
              //   name: 'T-Mobile',
              //   selected: false
              // }];
              $scope.$watch('search.brand.data|filter:search.brand.query', function (nv) {
                var diff = _.xor($scope.search.brand.data, nv);
                if(diff.length) {
                  _.map(diff, function(brand) {
                    brand.selected = false;
                  })
                }
                console.log('brand:', $scope.search.brand.data);
              }, true);
              $scope.$watch('search.brand.data|filter:{selected:true}', function (nv) {
                $scope.search.brand.selection = nv.map(function (item) {
                  return item.name;
                });
                console.log('brand:selection', $scope.search.brand.selection);
              }, true);

              // $scope.$watch('brands|filter:searchBrand', function (nv) {
              //   var diff = _.xor($scope.brands, nv);
              //   if(diff.length) {
              //     _.map(diff, function(brand) {
              //       brand.selected = false;
              //     })
              //   }
              // }, true);
              // $scope.$watch('brands|filter:{selected:true}', function (nv) {
              //   $scope.selectionBrands = nv.map(function (fruit) {
              //     return fruit.name;
              //   });
              //   console.log('brands:selected', $scope.selectionBrands);
              // }, true);

              /* price */
              
              // $scope.price = {
              //   min: 10,
              //   max: 100,
              //   step: 1,
              //   selected: {
              //     min: 20,
              //     max: 50
              //   }
              // };
              $scope.currencyFormatting = function(value) { 
                return "$ " + value; 
              };

              $scope.setPriceDown = function(type) {
                $scope.search.price.selected[type] = parseInt($scope.search.price.selected[type]) - 1;
              };

              $scope.setPriceUp = function(type) {
                $scope.search.price.selected[type] = parseInt($scope.search.price.selected[type]) + 1;
              };
            }
          }
        }
      })
      .state('products.category', {
        url: '/category/{category:[a-zA-Z0-9_-]{1,}}',
        resolve: {
          data: function($stateParams, products) {
            var category = $stateParams.category;
            return _.find(products, {category:category})
          }
        },
        views: {
          'content@products': {
            template: '<div class="col-md-12"><h2>Category : {{category}}</h2><pre>{{ data | json }}</pre>',
            controller: function($scope, data, $stateParams) {
              var category = $stateParams.category;
              $scope.category = category;
              $scope.data = data;

              $scope.$on('$stateChangeSuccess', function(event, toState) {
                  toState.data.title = category;
               });
            }
          }
        }
      })
      .state('products.detail', {
        url: '/:productId',
        template: '<p>{{productsByCategory}}</p>',
        controller: function($scope, $stateParams) {
          $scope.product = 'Product ' + $stateParams.productId
        }
      })
      // .state('products', {
      //   url: '/products',
      //   templateUrl: 'app/product/index.html',
      //   controller: function($scope, categories) {
      //     console.log('parent called', categories);
      //     $scope.categories = categories;
      //   },
      //   resolve: {
      //     categories: function($q, $http) {
      //       var q = $q.defer();
      //       $http.get('/api/categories')
      //         .success(function(data){
      //           q.resolve(data);
      //         });
      //       return q.promise;
      //     },
      //     products: function(productService) {
      //       return productService.query().$promise;
      //     }
      //   }
      // })
      // .state('products.category', {
      //   url: '/category/{category:[a-zA-Z0-9_-]{1,}}',
      //   templateUrl: 'app/product/list/product.html',
      //   controller: 'ProductsListCtrl',
      //   resolve: {
      //     products: ['productService', '$stateParams', function(productService, $stateParams) {
      //       return productService.query({ 'criteria[category]': $stateParams.category }).$promise;
      //       // return productService.getProducts({ 'criteria': { category: $stateParams.category }});
      //     }]
      //   }
      // })
      // .state('products.detail', {
      //   url: '/:productId',
      //   templateUrl: 'app/product/detail/product.html',
      //   controller: 'ProductsDetailCtrl',
      //   resolve: {
      //     product: ['productService', '$stateParams', function(productService, $stateParams) {
      //       return productService.get({ id:$stateParams.productId }).$promise;
      //       // return productService.getProductDetail($stateParams.productId);
      //     }]
      //   }
      // });
  });
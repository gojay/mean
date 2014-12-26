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

    function setCollapsibleGroup(data, old) { 
      _.forEach(data, function(item) {
        item.loading = false;
        item.open = false;
        if(item.children && item.children.length) {
          setCollapsibleGroup(item.children);
        }
      })
    }

    $stateProvider
      .state('products', {
        url: '/products',
        data: {
          title: 'Products'
        },
        resolve: {
          categories: function($q, $http) {
            var deferred = $q.defer();
            $http.get('/api/categories/products')
              .success(function(categories) {
                deferred.resolve(categories);
              });
            return deferred.promise;
          },
          filters: function($q, $http) {
            var deferred = $q.defer();
            $http.get('/api/products/filters')
              .success(function(filters) {
                deferred.resolve(filters);
              });
            return deferred.promise;
          }
        },
        views: {
          '': { 
            templateUrl: 'app/product/index.html',
            controller: function($scope, categories, filters) {

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

              $scope.search = {
                loading: false,
                category: {
                  data: categories
                },
                brand: {
                  query: '',
                  selection: [],
                  data: filters.brands
                },
                price: {
                  options: filters.price,
                  selected: {
                    min: 0,
                    max: 0
                  }
                },
                os:{
                  selected: null,
                  data: filters.os
                },
                storage: {
                  flash: {
                    selected: null,
                    data: filters.flash
                  },
                  ram: {
                    selected: null,
                    data: filters.ram
                  }
                },
                camera: {
                  selected: null,
                  data: filters.camera
                },
                display: {
                  selected: null,
                  data: filters.display
                } 
              };

              $scope.$watch('search.price.options', function(newValue, oldValue, scope) {
                if(newValue[0]) {
                  var price = _.mapValues(newValue[0], function(val) {
                    return parseInt(val);
                  });
                  $scope.search.price.options = price;
                  $scope.search.price.selected.min = 0;
                  $scope.search.price.selected.max = price.max;
                }
              }, true);
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
            templateUrl: 'app/product/categories.html',
            controller: function($scope) {
              console.log('categories@products:$scope', $scope)
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
            controller: function($scope, $rootScope, products, categories, filters) {

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
            controller: function($scope, $rootScope, $location, $http, $state, $timeout) {

              var query = {};

              var categories = $scope.search.category.data;

              // indentifier for $watch price
              var oldMaxPrice;

              /* state go */

              function go(key, value) {
                console.log('go', key, value);
                if(!_.isEmpty(value)) {
                  value = _.isArray(value) ? value.join('_') : value ;
                  query[key] = value;
                } else {
                  query[key] = null;
                }

                if(key == 'category') {
                  // if categories count is null, remove parameter brand
                  var count = _.findDeep(categories, { _id: query.category }).count;
                  if( count == 0 ) {
                    query.brand = null;
                  }
                }

                $state.go('products.query', query);
              }

              /* products on loaded */
              
              function onLoaded(evt, data) {
                console.log('products:loaded', data);
                
                oldMaxPrice = $scope.search.price.options.max;

                /* set filters data */
                var filters = data.filters;
                $scope.search.brand.data = filters.brands;
                $scope.search.price.options = filters.price;
                $scope.search.storage.flash.data = filters.flash;
                $scope.search.storage.ram.data = filters.ram;
                $scope.search.os.data = filters.os;
                $scope.search.camera.data = filters.camera;
                $scope.search.display.data = filters.display;

                /* 
                atur filter berdasarkan parameter (url)
                memungkinkan auto set filter, jika direct url 
                */
                var params = data.params;
                var paramsFn = {
                  /* category */
                  category: function() {

                    /* 
                    set category filters

                    mengatur jumlah produk tiap kategori,
                    berdasarkan filter(brand, price, dll)
                    */
                    if(!_.isEmpty(filters.category)) {

                      // tambahkan default filter dgn nilai total 0,
                      // jika filter kategori tidak terdaftar
                      var filterCategories = _.chain(categories)
                                              .flatten('children')
                                              .pluck('_id')
                                              .transform(function(result, val){ 
                                                var total = 0; 
                                                var f = _.find(filters.category, { '_id': val }); 
                                                if(f){ total = f.total; } 
                                                result.push({ _id: val, total: total }) ;
                                              })
                                              .value();
                      // set count kategori                      
                      var parents = {};
                      _.forEach(filterCategories, function(item){
                        var c = _(categories).findDeep({ _id: item._id}).tap(function(cat){ cat.count = item.total }).value();
                        if(parents[c.parent]) {
                          parents[c.parent] += c.count;
                        } else {
                          parents[c.parent] = c.count;
                        }
                      });
                      // atur jumlah total kategori 'parent' berdasarkan jumlah 'children'
                      if(parents){
                        _.forEach(parents, function(count, id){
                          _(categories).findDeep({ _id: id }).tap(function(cat){ cat.count = count });
                        })
                      } 
                    }

                    /* 
                    open(parents & self) selected category

                    atur 'open' dan 'loading' untuk kategori yg dipilih
                    dan juga untuk 'parent' nya
                    */

                    var id = params.category;
                    if(!id || id == 'all') {
                      setCollapsibleGroup($scope.search.category.data);
                      return;
                    }

                    var paths = [];

                    var category = _.findDeep(categories, { _id: id });
                    var parents = _.xor(category.path.split('/'), id);
                    if(parents.length) {
                      _.forEach(parents, function(path) {
                        var parent = _(categories).findDeep({ _id: path }).tap(function(cat) {
                          if(cat && cat.children.length) {
                            _.forEach(cat.children, function(item){
                              item.loading = false;
                              item.open = false;
                            });
                          }
                        }).value();
                        if(parent) paths.push(parent);
                      });
                    }
                    paths.push(category);

                    _.map(paths, function(item) {
                      item.loading = false;
                      item.open = true;
                      return item;
                    });
                  },
                  /* brand */
                  brand: function() {
                    var brand = $scope.search.brand,
                        selection = params.brand;
                    // set brands selection
                    if( selection ) {
                      // nilai selection adalah array
                      // atur menjadi array jika string
                      if(_.isString(selection)) selection = [selection]; 

                      // set selection 
                      // atur 'selection' berdasarkan 'filter brands' (perubahan nilai 'brands' dari kategori yg dpilih)
                      // krn memungkinkan tiap kategori berbeda nilai 'brands' nya 
                      selection = _.intersection(_.pluck(filters.brands, 'id'), selection);

                      _(brand.data)
                        .filter(function(item) {
                          return _.indexOf(selection, item.id) > -1;
                        })
                        .map(function(item) {
                          item.selected = true;
                          return item;
                        });

                        brand.selection = selection;

                        // change brand parameters
                        // var brandParameter = selection.length ? selection.join('_') : null;
                        // $location.search('brand', brandParameter)
                    } else {
                      _.map($scope.search.brand.data, function(item){ item.selected = false; return item; });
                      $scope.search.brand.selection = [];
                    }
                  },
                  /* price */
                  price: function() {
                    var price = params.price;
                    if(!price) return;

                    var prices = _.isObject(price) ? _.values(price) : price.split('-') ;
                    prices = _.map(prices, function(num) { return parseInt(num); });
                    $timeout(function(){
                      $scope.search.price.selected = {
                        min: prices[0],
                        max: prices[1]
                      };
                    });
                  },
                  os: function() {
                    $scope.search.os.selected = params.os;
                  },
                  flash: function() {
                    $scope.search.storage.flash.selected = params.flash;
                  },
                  ram: function() {
                    $scope.search.storage.ram.selected = params.ram;
                  },
                  camera: function() {
                    $scope.search.camera.selected = params.camera;
                  },
                  display: function() {
                    $scope.search.display.selected = params.display;
                  },
                  default: function() {
                    setCollapsibleGroup($scope.search.category.data);
                  }
                };

                if(params) {
                  _.forEach(_.keys(params), function(filter){
                      paramsFn[filter]();
                  });
                } else {
                  // products home
                  // set default collapsible group categories
                  paramsFn['default']();
                }

                $scope.search.loading = false;
              }

              $scope.$on('products:loaded', onLoaded);

              /* category */

              $scope.searchByCategory = function (category, $event) {
                if((category.open && _.isEmpty(category.children)) || category.count == 0) return;
                
                $event.stopPropagation();

                $scope.search.loading = true;
                category.loading = true;

                go('category', category._id);
              }

              /* brand */

              $scope.searchByBrand = function($event, id){
                var checkbox = $event.target;
                var action = (checkbox.checked ? 'add' : 'remove');
                selectBrand(action, id);
              }

              var selectBrand = function(action, id) {
                if (action === 'add' && $scope.search.brand.selection.indexOf(id) === -1) {
                  $scope.search.brand.selection.push(id);
                }
                if (action === 'remove' && $scope.search.brand.selection.indexOf(id) !== -1) {
                  $scope.search.brand.selection.splice($scope.search.brand.selection.indexOf(id), 1);
                }

                $scope.search.loading = true;
                go('brand', $scope.search.brand.selection);
              };

              /* price */

              var getPrice = function(){
                if($scope.search.price.options.max == 0) return;

                $scope.search.loading = true;

                var price = $scope.search.price.selected;
                var pQuery = price.min + '-'  + price.max;

                go('price', pQuery);
              }

              $scope.currencyFormatting = function(value) { 
                return "$ " + value; 
              };

              $scope.setPriceDown = function(type) {
                var value = parseInt($scope.search.price.selected[type]);
                $scope.search.price.selected[type] = value - 1;
                $scope.search.price.options.onChange = true;
              };

              $scope.setPriceUp = function(type) {
                var value = parseInt($scope.search.price.selected[type]);
                $scope.search.price.selected[type] = value + 1;
                $scope.search.price.options.onChange = true;
              };

              /* angular-slider custom events */

              $scope.$on('slider:end', getPrice);

              $scope.$watchCollection('search.price.selected', function(newValue, oldValue, scope) {
                newValue = _.mapValues(newValue, parseInt);
                if(newValue.min > $scope.search.price.selected.max) {
                  $scope.search.price.selected.min = $scope.search.price.selected.max;
                }
                if(newValue.min < $scope.search.price.options.min) {
                  $scope.search.price.selected.min = $scope.search.price.options.min;
                }
                if(newValue.max > $scope.search.price.options.max) {
                  $scope.search.price.selected.max = $scope.search.price.options.max;
                }

                oldValue = _.mapValues(oldValue, parseInt);
                if(_.isEqual(newValue, oldValue) || oldValue.max == oldMaxPrice || newValue.max > $scope.search.price.options.max || newValue.min < $scope.search.price.options.min) return;
                
                if(scope.search.price.options.onChange) {
                  scope.search.price.options.onChange = false;
                  getPrice();
                }
              });

              /* other selected filters */

              $scope.selectFilter = function(type, filter) {
                console.log('filter:select:%s', type, filter);
                go(type, filter.query || filter.value);
              };

            }
          }
        }
      })
      .state('products.query', {
        url: '/{category:[a-zA-Z0-9_-]{1,}}/{brand}?price&os&display&flash&ram&camera',
        params: {
          category: 'all',
          brand: null,
          price: null,
          os: null,
          display: null,
          flash: null,
          ram: null,
          camera: null
        },
        views: {
          'content@products': {
            templateUrl: 'app/product/list/product.html',
            controller: function($scope, $rootScope, $stateParams, productFilters) {
              console.log('content@category:$stateParams', $stateParams);
                            
              $scope.loading = true;
              var params = _.mapValues($stateParams, function(value) {
                return value && /\_/.test(value) ? value.split('_') : value ;
              });

              productFilters(params).then(function(results) {
                $scope.products = results.products.data;
                $rootScope.$broadcast('products:loaded', { params: params, filters: results.filters.data });
                $scope.loading = false;
              });

              $scope.category = params.category;
              $scope.$on('$stateChangeSuccess', function(event, toState) {
                  toState.data.title = $scope.category;
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
      // .state('products.query', {
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
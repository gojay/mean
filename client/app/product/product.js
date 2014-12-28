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

    var query = {};

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
            controller: function($scope, $state, $q, categories, filters) {

              /* breadcrumb */

              $scope.breadcrumb = {
                init: function(params) {
                  var breadcrumbs = this.data;
                  breadcrumbs.splice(1, breadcrumbs.length);

                  var breadcrumbs = [];
                  if( params.category != 'all' ) {
                    var category = $scope.search.category.get(params.category);
                    if(category.children.length == 0) {
                      var pCategory = $scope.search.category.get(category.parent);
                      breadcrumbs = [
                        { title: 'Category', href: $state.href('products.query', { category: 'all', brand: null }) },
                        { title: pCategory.name, href: $state.href('products.query', { category: pCategory._id, brand: null }) },
                        { title: category.name, href: $state.href('products.query', { category: params.category, brand: null }) }
                      ];
                    } else {
                      breadcrumbs = [
                        { title: 'Category', href: $state.href('products.query', { category: 'all', brand: null }) },
                        { title: category.name, href: $state.href('products.query', { category: params.category, brand: null }) }
                      ];
                    }
                  }
                  if( params.brand && params.brand != '' && params.brand != 'all' ) {
                    var brands = params.brand.split('_');
                    var brandName = _.map(brands, function(id) {
                      var brand = $scope.search.brand.get(id);
                      return brand ? brand.name : null;
                    });
                    breadcrumbs = _.union(breadcrumbs, [
                      { title: 'Brand', href: $state.href('products.query', { brand: 'all' }) },
                      { title: brandName.join(' & ')}
                    ]);
                  }
                  this.add(breadcrumbs);
                },
                add : function(data) {
                  if(_.isEmpty(data)) return;

                  var breadcrumbs = this.data;
                  _.forEach(data, function(value, key){
                    breadcrumbs.push({
                      title: value.title,
                      href: value.href
                    });
                  });

                },
                getTitle: function(){
                  var breadcrumbs = this.data;
                  return breadcrumbs.length > 1 ? _.last(breadcrumbs).title :  'All Products' ;
                },
                data: [{ title: 'Products', href: '/products' }]
              }

              /* filters */

              $scope.filters = {
                search: {
                  filterBy: '$',
                  data: [
                    {
                      id: 'title',
                      type: 'text',
                      title: 'Filter by Title',
                      placeholder: 'Enter the title..'
                    }, {
                      id: 'body',
                      type: 'text',
                      title: 'Filter by Description',
                      placeholder: 'Enter the description..'
                    }, {
                      id: 'price',
                      type: 'number',
                      title: 'Filter by Price: Greather than >',
                      placeholder: 'Enter the price'
                    }, {
                      id: 'price',
                      type: 'number',
                      title: 'Filter by Price: Less than <',
                      placeholder: 'Enter the price'
                    }, {
                      id: '$',
                      type: 'text',
                      title: 'Filter by Anything',
                      placeholder: 'Enter the text..'
                    }
                  ],
                  title: null,
                  placeholder: null,
                  inputEl: angular.element('input.input-filter'),
                  selected: null,
                  setFilterBy: function(search) {
                    var self = this;

                    self.filterBy = search.id;
                    self.title = search.title;
                    self.placeholder = search.placeholder;

                    var recentQuery = self.inputEl.val();
                    
                    // set selected index query
                    self.selected = search;
                    // reset filter query
                    _.forEach(self.query, function(item, key){ self.query[key] = '' });
                    // change input type & set query
                    if(search.type == 'number') {
                      self.inputEl.prop('type', 'number');
                      if(/^[0-9]+$/.test(recentQuery)) {
                        self.query[search.id] = recentQuery;
                      }
                    } else {
                      self.inputEl.prop('type', 'text');
                      if(!/^[0-9]+$/.test(recentQuery)) {
                        self.query[search.id] = recentQuery;
                      }
                    }
                  },
                  product: null,
                  query: {
                    $: '',
                    title: '',
                    body: '',
                    price: '',
                  },
                  priceFilter: function(product) {
                    var searchFilters = $scope.filters.search;
                    var search = searchFilters.selected;
                    if(/\>/.test(search.title))
                      return product.price > searchFilters.query.price;
                    else
                      return searchFilters.query.price ? product.price < searchFilters.query.price : true ;
                  }
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
                  }],
                  by: null
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
                },
                init: function() {
                  // search
                  var search = this.search;
                  search.setFilterBy(search.data[search.data.length - 1]);
                  // order by
                  this.order.by = this.order.data[0];
                  // filter selected
                  // query (string) or price (number)
                  $scope.$watchCollection('filters.search.selected', function(searchSelected) {
                    $scope.filters.search.product = (searchSelected.type == 'number') ?  $scope.filters.search.priceFilter : search.query ;
                  });
                }
              };

              $scope.filters.init();

              /* search */

              $scope.search = {
                loading: false,
                category: {
                  get: function(id) {
                    return _.findDeep(this.data, { _id: id });
                  },
                  data: categories
                },
                brand: {
                  query: '',
                  selection: [],
                  data: filters.brands,
                  get: function(id) {
                    return _.find(this.data, { id: id });
                  }
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
            templateUrl: 'app/product/categories.html',
            controller: function($scope, categories) {
              console.log('categories@products:$scope', $scope);
              $scope.categories = categories;
            }
          },
          /*'filters@products': {
            templateUrl: 'app/product/filter.html',
            controller: function($scope, $compile) {
            }
          },*/
          'content@products': {
            templateUrl: 'app/product/list/product.html',
            controller: function($scope, $rootScope, $location, productResource, filters) {
              console.log('content@products', filters);
              var params = $location.search();

              $scope.loading = true;
              productResource.query(params, function(products){
                $scope.products = products;
                $scope.products.title = 'All Products';
                $scope.products.currentPage = 1;
                $rootScope.$broadcast('products:loaded', { filters: filters });
                $scope.loading = false;
              });

              $scope.doPaging = function(page) {
                $scope.loading = true;
                params['page'] = page;
                productResource.query(params, function(products){
                  $scope.products = products;
                  $scope.products.title = 'All Products';
                  $scope.loading = false;
                });
              }
            }
          },

          'side@products': {
            templateUrl: 'app/product/side.html',
            controller: function($scope, $rootScope, $stateParams, $http, $state, $timeout) {

              var categories = $scope.search.category.data;

              // indentifier for $watch price
              var oldMaxPrice;

              /* state go */

              function go(key, value) {
                if(!_.isEmpty(value)) {
                  value = _.isArray(value) ? value.join('_') : value ;
                  query[key] = value;
                } else {
                  query[key] = null;
                }

                /*if(key == 'category') {
                  // if categories count is null, remove parameter brand
                  var count = _.findDeep(categories, { _id: query.category }).count;
                  if( count == 0 ) {
                    query.brand = null;
                  }
                }*/

                if(!_.has(query, 'category')) {
                  query.category = 'all';
                }

                console.log('go', query);
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
                      // set jumlah kategori                      
                      var parents = {};
                      _.forEach(filterCategories, function(item){
                        var c = _(categories).findDeep({ _id: item._id }).tap(function(cat){ cat.count = item.total }).value();
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
                    // category
                    setCollapsibleGroup($scope.search.category.data);
                    // brand
                    _.map($scope.search.brand.data, function(item){ item.selected = false; return item; });
                    $scope.search.brand.selection = [];
                    $scope.search.os.selected = null;
                    $scope.search.storage.flash.selected = null;
                    $scope.search.storage.ram.selected = null;
                    $scope.search.camera.selected = null;
                    $scope.search.display.selected = null;
                    // query
                    query = {};
                  }
                };

                if(params) {
                  _.forEach(_.keys(params), function(filter){
                      if(paramsFn[filter]) paramsFn[filter]();
                  });
                } else {
                  // all products
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
          'breadcrumb@products': {
            templateUrl: 'app/product/breadcrumb.html',
            controller: function($scope, $stateParams) {
              $scope.breadcrumb.init($stateParams);
            }
          },
          'slides@products': {},
          'categories@products': {},
          'content@products': {
            templateUrl: 'app/product/list/product.html',
            controller: function($scope, $rootScope, $state, $stateParams, productService) {
              $scope.loading = true;

              var title = null;
              var query = $stateParams;

              var params = _.mapValues($stateParams, function(value) {
                return value && /\_/.test(value) ? value.split('_') : value ;
              });

              productService(params).then(function(results) {
                $scope.products = results.products.data;
                $scope.products.title = title = $scope.breadcrumb.getTitle();

                $rootScope.$broadcast('products:loaded', { params: params, filters: results.filters.data });
                $scope.loading = false;

                $state.current.data.title = title;
              });

              $scope.doPaging = function(page) {
                // query['page'] = page;
                // $state.go('products.query', query, {reload: true});

                params['page'] = page;
                $scope.loading = true;
                productService(params).then(function(results) {
                  $scope.products = results.products.data;
                  $scope.products.title = title;
                  $scope.loading = false;
                });
              }
            }
          }
        }
      })
      .state('products.detail', {
        url: '/view/:productId',
        views: {
          'content@products': {
            template: '<p>{{product}}</p>',
            controller: function($scope, $stateParams, $state) {
              $scope.product = 'Product ' + $stateParams.productId
            }
          },
          'slides@products': {},
          'categories@products': {},
          'filters@products': {},
          'side@products': {}
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
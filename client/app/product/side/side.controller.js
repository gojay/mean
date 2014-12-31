'use strict';

angular.module('exampleAppApp')
    .controller('ProductsSideCtrl', function($scope, $rootScope, $stateParams, $http, $state, $timeout) {

        function setCollapsibleGroup(data, old) { 
          _.forEach(data, function(item) {
            item.loading = false;
            item.open = false;
            if(item.children && item.children.length) {
              setCollapsibleGroup(item.children);
            }
          })
        }

        var categories = $scope.search.category.data;

        // indentifier for $watch price
        var oldMaxPrice;

        /* state go */
        var query = {};
        function go(key, value) {
            if (!_.isEmpty(value)) {
                value = _.isArray(value) ? value.join('_') : value;
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

            if (!_.has(query, 'category')) {
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
                    if (!_.isEmpty(filters.category)) {

                        // tambahkan default filter dgn nilai total 0,
                        // jika filter kategori tidak terdaftar
                        var filterCategories = _.chain(categories)
                            .flatten('children')
                            .pluck('_id')
                            .transform(function(result, val) {
                                var total = 0;
                                var f = _.find(filters.category, {
                                    '_id': val
                                });
                                if (f) {
                                    total = f.total;
                                }
                                result.push({
                                    _id: val,
                                    total: total
                                });
                            })
                            .value();
                        // set jumlah kategori                      
                        var parents = {};
                        _.forEach(filterCategories, function(item) {
                            var c = _(categories).findDeep({
                                _id: item._id
                            }).tap(function(cat) {
                                cat.count = item.total
                            }).value();
                            if (parents[c.parent]) {
                                parents[c.parent] += c.count;
                            } else {
                                parents[c.parent] = c.count;
                            }
                        });
                        // atur jumlah total kategori 'parent' berdasarkan jumlah 'children'
                        if (parents) {
                            _.forEach(parents, function(count, id) {
                                _(categories).findDeep({
                                    _id: id
                                }).tap(function(cat) {
                                    cat.count = count
                                });
                            })
                        }
                    }

                    /* 
                    open(parents & self) selected category

                    atur 'open' dan 'loading' untuk kategori yg dipilih
                    dan juga untuk 'parent' nya
                    */

                    var id = params.category;
                    if (!id || id == 'all') {
                        setCollapsibleGroup($scope.search.category.data);
                        return;
                    }

                    var paths = [];

                    var category = _.findDeep(categories, {
                        _id: id
                    });
                    var parents = _.xor(category.path.split('/'), id);
                    if (parents.length) {
                        _.forEach(parents, function(path) {
                            var parent = _(categories).findDeep({
                                _id: path
                            }).tap(function(cat) {
                                if (cat && cat.children.length) {
                                    _.forEach(cat.children, function(item) {
                                        item.loading = false;
                                        item.open = false;
                                    });
                                }
                            }).value();
                            if (parent) paths.push(parent);
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
                    if (selection) {
                        // nilai selection adalah array
                        // atur menjadi array jika string
                        if (_.isString(selection)) selection = [selection];

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
                        _.map($scope.search.brand.data, function(item) {
                            item.selected = false;
                            return item;
                        });
                        $scope.search.brand.selection = [];
                    }
                },
                /* price */
                price: function() {
                    var price = params.price;
                    if (!price) return;

                    var prices = _.isObject(price) ? _.values(price) : price.split('-');
                    prices = _.map(prices, function(num) {
                        return parseInt(num);
                    });
                    $timeout(function() {
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
                    _.map($scope.search.brand.data, function(item) {
                        item.selected = false;
                        return item;
                    });
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

            if (params) {
                _.forEach(_.keys(params), function(filter) {
                    if (paramsFn[filter]) paramsFn[filter]();
                });
            } else {
                // all products
                paramsFn['default']();
            }

            $scope.search.loading = false;
        }

        $scope.$on('products:loaded', onLoaded);

        /* category */

        $scope.searchByCategory = function(category, $event) {
            if ((category.open && _.isEmpty(category.children)) || category.count == 0) return;

            $event.stopPropagation();

            $scope.search.loading = true;
            category.loading = true;

            go('category', category._id);
        }

        /* brand */

        $scope.searchByBrand = function($event, id) {
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

        var getPrice = function() {
            if ($scope.search.price.options.max == 0) return;

            $scope.search.loading = true;

            var price = $scope.search.price.selected;
            var pQuery = price.min + '-' + price.max;

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
            if (newValue.min > $scope.search.price.selected.max) {
                $scope.search.price.selected.min = $scope.search.price.selected.max;
            }
            if (newValue.min < $scope.search.price.options.min) {
                $scope.search.price.selected.min = $scope.search.price.options.min;
            }
            if (newValue.max > $scope.search.price.options.max) {
                $scope.search.price.selected.max = $scope.search.price.options.max;
            }

            oldValue = _.mapValues(oldValue, parseInt);
            if (_.isEqual(newValue, oldValue) || oldValue.max == oldMaxPrice || newValue.max > $scope.search.price.options.max || newValue.min < $scope.search.price.options.min) return;

            if (scope.search.price.options.onChange) {
                scope.search.price.options.onChange = false;
                getPrice();
            }
        });

        /* other selected filters */

        $scope.selectFilter = function(type, filter) {
            console.log('filter:select:%s', type, filter);
            go(type, filter.query || filter.value);
        };
        $scope.clearFilter = function(filter) {
            var value = (filter == 'brand') ? [] : null;
            if( filter == 'flash' || filter == 'ram' ) {
                $scope.search.storage[filter].clear();
            } else {
                $scope.search[filter].clear();
            }

            go(filter, value);
        };
    });

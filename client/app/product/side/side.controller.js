'use strict';

angular.module('exampleAppApp')
    .controller('ProductsSideCtrl', function($scope, $rootScope, $state, $timeout) {

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
        // var oldMaxPrice;

        /* state go */
        var query = {};
        function go(key, value) {
            $scope.search.loading = true;

            if (!_.isEmpty(value)) {
                // brand
                if(_.isArray(value)) {
                    value = value.join('_');
                }
                // price
                else if(_.isObject(value)) {
                    value = _.values(value).join('-');
                }
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

            console.log('$state.go', query);

            $state.go('products.query', query);
        }

        /* products on loaded */

        function onLoaded(evt, data) {
            console.log('products:loaded', data);

            // oldMaxPrice = $scope.search.price.options.max;

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
                                var f = _.find(filters.category, {'_id': val});
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

                    var id = params.category;
                    if (!id || id == 'all') {
                        /*
                        hanya atur semua attribut open & loading false,
                        jika category id 'all'
                         */
                        setCollapsibleGroup(categories);
                        return;
                    }

                    /* 
                    open(parents & self) selected category

                    atur 'open' dan 'loading' untuk kategori yg dipilih
                    dan juga untuk 'parent' nya
                    */

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
                        selected = params.brand;
                    // set brands selected
                    if (selected) {
                        // nilai selected adalah array
                        // atur menjadi array jika string
                        if (_.isString(selected)) selected = [selected];

                        // set selected 
                        // atur 'selected' berdasarkan 'filter brands' (perubahan nilai 'brands' dari kategori yg dpilih)
                        // krn memungkinkan tiap kategori berbeda nilai 'brands' nya 
                        selected = _.intersection(_.pluck(filters.brands, 'id'), selected);

                        _(brand.data)
                            .filter(function(item) {
                                return _.indexOf(selected, item.id) > -1;
                            })
                            .map(function(item) {
                                item.selected = true;
                                return item;
                            });

                        brand.selected = selected;

                        // change brand parameters
                        // var brandParameter = selected.length ? selected.join('_') : null;
                        // $location.search('brand', brandParameter)
                    } else {
                        _.map($scope.search.brand.data, function(item) {
                            item.selected = false;
                            return item;
                        });
                        $scope.search.brand.selected = [];
                    }
                },
                /* price */
                price: function() {
                    var price = params.price;
                    if (!price) return;

                    var prices = _.isObject(price) ? _.values(price) : price.split('-') ;
                    prices = _.map(prices, function(num) {
                        return parseInt(num);
                    });
                    // $timeout(function() {
                        $scope.search.price.selected = {
                            min: prices[0],
                            max: prices[1]
                        };
                    // });
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
                    $scope.search.brand.selected = [];
                    $scope.search.os.selected = null;
                    $scope.search.storage.flash.selected = null;
                    $scope.search.storage.ram.selected = null;
                    $scope.search.camera.selected = null;
                    $scope.search.display.selected = null;
                    // query
                    query = {};
                }
            };

            if (!_.isEmpty(params)) {
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

            $event.preventDefault();

            category.loading = true;

            go('category', category._id);
        }

        /* brand */

        $scope.searchByBrand = function($event, id) {
            var checkbox = $event.target;
            var action = (checkbox.checked ? 'add' : 'remove');

            if (action === 'add' && $scope.search.brand.selected.indexOf(id) === -1) {
                $scope.search.brand.selected.push(id);
            }
            if (action === 'remove' && $scope.search.brand.selected.indexOf(id) !== -1) {
                $scope.search.brand.selected.splice($scope.search.brand.selected.indexOf(id), 1);
            }

            go('brand', $scope.search.brand.selected);
        };

        /* price */

        var searchByPrice = function() {
            if ($scope.search.price.options.max == 0) return;
            go('price', $scope.search.price.selected);
        }

        $scope.currencyFormatting = function(value) {
            return "$ " + value;
        };

        $scope.setPriceDown = function(type) {
            var price = $scope.search.price;
            var value = parseInt(price.selected[type]);
            var newValue = value - 1;

            if(newValue < 0 || (type == 'max' && newValue < price.options.min)) return;

            $scope.search.price.selected[type] = newValue;
            // $scope.search.price.options.onChange = true;

            searchByPrice();
        };

        $scope.setPriceUp = function(type) {
            var price = $scope.search.price;
            var value = parseInt($scope.search.price.selected[type]);
            var newValue = value + 1;

            if(newValue > price.options.max || (type == 'min' && newValue > price.selected.max)) return;

            $scope.search.price.selected[type] = newValue;
            // $scope.search.price.options.onChange = true;
            
            searchByPrice();
        };

        /* angular-slider custom events */

        $scope.$on('slider:end', searchByPrice);

        /*$scope.$watchCollection('search.price.selected', function(newValue, oldValue) {
            console.log('watch', newValue, oldValue);
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

            if ($scope.search.price.options.onChange) {
                $scope.search.price.options.onChange = false;
                console.log('[price]', $scope.search.price.selected);
                searchByPrice();
            }
        });*/

        /* other selected filters */

        $scope.searchByFilter = function(type, filter) {
            // console.log('filter:select:%s', type, filter);
            var query = filter.query || filter.value;
            go(type, query);
        };
        $scope.clearFilter = function(name) {
            var filter = $scope.search[name];
            if( name == 'flash' || name == 'ram' ) {
                filter = $scope.search.storage[name];
            } 

            filter.clear();

            go(name, filter.selected);
        };
    });

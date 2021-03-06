/**
 * ProductsCtrl
 *
 * populate categories & filters
 * 
 */
'use strict';

angular.module('exampleAppApp')
    .controller('ProductsCtrl', function($scope, $state, productService) {

        /* breadcrumb */

        $scope.breadcrumb = {
            load: function(product){
                var self = this;
                if(_.isEmpty(product)) return;
                    console.log(product)
                
                var breadcrumbs = this.data;
                breadcrumbs.splice(1, breadcrumbs.length);

                var breadcrumbs = [];
                var query = { category: product.category };
                breadcrumbs.push({ title: product.category, href: $state.href('products.query', query) });
                breadcrumbs.push({ title: product.brand, href: $state.href('products.query', _.assign(query, { brand: product.brand})) });
                breadcrumbs.push({ title: product.title, href: null });
                this.add(breadcrumbs);
            },
            set: function(params) { 
                if(_.isEmpty($scope.search.category.data)) return;
                
                var breadcrumbs = this.data;
                breadcrumbs.splice(1, breadcrumbs.length);

                if(_.isEmpty(params)) return;

                var breadcrumbs = [];
                if (params.category != 'all') {
                    var category = $scope.search.category.get(params.category);
                    if (category.children.length == 0) {
                        var pCategory = $scope.search.category.get(category.parent);
                        breadcrumbs = [{
                            title: 'Category',
                            href: $state.href('products.query', {
                                category: 'all',
                                brand: null
                            })
                        }, {
                            title: pCategory.name,
                            href: $state.href('products.query', {
                                category: pCategory._id,
                                brand: null
                            })
                        }, {
                            title: category.name,
                            href: $state.href('products.query', {
                                category: params.category,
                                brand: null
                            })
                        }];
                    } else {
                        breadcrumbs = [{
                            title: 'Category',
                            href: $state.href('products.query', {
                                category: 'all',
                                brand: null
                            })
                        }, {
                            title: category.name,
                            href: $state.href('products.query', {
                                category: params.category,
                                brand: null
                            })
                        }];
                    }
                }
                if (params.brand && params.brand != '' && params.brand != 'all') {
                    var brands = params.brand.split('_');
                    var brandName = _.map(brands, function(id) {
                        var brand = $scope.search.brand.get(id);
                        return brand ? brand.name : null;
                    });
                    breadcrumbs = _.union(breadcrumbs, [{
                        title: 'Brand',
                        href: $state.href('products.query', {
                            brand: 'all'
                        })
                    }, {
                        title: brandName.join(' & ')
                    }]);
                }
                this.add(breadcrumbs);
            },
            add: function(data) {
                if (_.isEmpty(data)) return;

                var breadcrumbs = this.data;
                _.forEach(data, function(value, key) {
                    breadcrumbs.push({
                        title: value.title,
                        href: value.href
                    });
                });
            },
            getTitle: function() {
                var breadcrumbs = this.data;
                return breadcrumbs.length > 1 ? _.last(breadcrumbs).title : 'All Products';
            },
            data: [{
                title: 'Products',
                href: '/products'
            }]
        }

        /* filters */

        $scope.filters = {
            search: {
                data: [{
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
                }],
                title: null,
                placeholder: null,
                inputEl: angular.element('input.input-filter'),
                selected: null,
                filterBy: null,
                setFilterBy: function(search) {
                    var self = this;

                    self.filterBy = search.id;
                    self.title = search.title;
                    self.placeholder = search.placeholder;

                    var recentQuery = self.inputEl.val();

                    // set selected index query
                    self.selected = search;
                    // reset filter query
                    _.forEach(self.query, function(item, key) {
                        self.query[key] = ''
                    });
                    // change input type & set query
                    if (search.type == 'number') {
                        self.inputEl.prop('type', 'number');
                        if (/^[0-9]+$/.test(recentQuery)) {
                            self.query[search.id] = recentQuery;
                        }
                    } else {
                        self.inputEl.prop('type', 'text');
                        if (!/^[0-9]+$/.test(recentQuery)) {
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
                    if (/\>/.test(search.title))
                        return product.price > searchFilters.query.price;
                    else
                        return searchFilters.query.price ? product.price < searchFilters.query.price : true;
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
                    $scope.filters.search.product = (searchSelected.type == 'number') ? $scope.filters.search.priceFilter : search.query;
                });
            }
        };

        $scope.filters.init();

        /* search */

        $scope.search = {
            loading: false,
            category: {
                get: function(id) {
                    return _.findDeep(this.data, {
                        _id: id
                    });
                },
                data: []
            },
            brand: {
                query: '',
                selected: [],
                data: [],
                get: function(id) {
                    return _.find(this.data, {
                        id: id
                    });
                },
                clear: function() {
                	this.selected = [];
                }
            },
            price: {
                options: {
                    min: 0,
                    max: 0,
                    step: 1
                },
                selected: {
                    min: 0,
                    max: 0
                }
            },
            os: {
                selected: null,
                data: [],
                clear: function() {
                	this.selected = null;
                }
            },
            storage: {
                flash: {
                    selected: null,
                    data: [],
	                clear: function() {
	                	this.selected = null;
	                }
                },
                ram: {
                    selected: null,
                    data: [],
	                clear: function() {
	                	this.selected = null;
	                }
                }
            },
            camera: {
                selected: null,
                data: [],
                clear: function() {
                	this.selected = null;
                }
            },
            display: {
                selected: null,
                data: [],
                clear: function() {
                	this.selected = null;
                }
            }
        };

        $scope.$watch('search.price.options', function(newValue, oldValue, scope) {
            var price = _.mapValues(newValue, function(val) {
                return parseInt(val);
            });
            $scope.search.price.options = price;
            $scope.search.price.selected.min = price.min;
            $scope.search.price.selected.max = price.max;
        }, true);

        /* populate dummy products */

        $scope.populate = {
            response: null,
            loading: false,
            selected: '',
            do: function(type, upload) {
                var self = this;
                self.loading = true;
                self.selected = type == 'product' ? 'semantics' : type ;

                var param = { type: type, upload: upload };
                productService.populate(param)
                    .then(function(data) {
                        self.response = data;
                        self.loading = false;
                    }).catch(function(err) {
                        self.response = err;
                        self.loading = false;
                    });
            }
        };
    });

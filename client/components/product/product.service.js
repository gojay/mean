'use strict';

angular.module('exampleAppApp')
    .factory('productService', function($q, $http, $resource) {
        return {
            params: '',
            resource: $resource('/api/products/:id/:controller',  { id: '@_id' }, {
                query: {
                    method: 'GET',
                    isArray: false,
                    cache: true
                },
                get: {
                    method: 'GET',
                    cache: true
                },
                update: {
                    method: 'PUT'
                },
                getReviews: {
                    method: 'GET',
                    params: {
                        controller: 'reviews'
                    }
                },
                postReview: {
                    method: 'POST',
                    params: {
                        controller: 'reviews'
                    }
                }
            }),
            getReviews: function(params) {
                return this.resource.getReviews(params);
            },
            sendReview: function(id, data) {
                return this.resource.postReview({ id: id }, data);
            },
            get: function(id) {
                return this.resource.get({ id: id });
            },
            query: function(params, callback) {
                return this.resource.query(params, callback);
            },
            all: function(filters, options) {
                var deferred = $q.defer();

                var urlParameter = this.urlParameter(filters);

                var urls = {
                    categories : $http.get('/api/categories/products'),
                    filters    : $http.get('/api/products/filters'+ urlParameter),
                    products   : $http.get('/api/products'+ urlParameter),
                };

                if( options ) {
                    
                    if( options.exclude && _.has(urls, options.exclude) ) {
                        urls = _.pick(urls, function(v,k){ 
                            return k != options.exclude; 
                        });
                    }

                    if( options.select ) {
                        var select = _.isString(options.select) ? [options.select] : options.select ;
                        urls = _.pick(urls, function(v,k){ 
                            return _.indexOf(select, k) > -1; 
                        });
                    }

                }

                $q.all(urls).then(function resolve(results) {
                    deferred.resolve(results)
                }, function reject(errors) {
                    deferred.reject(errors);
                }, function update(updates) {
                    deferred.update(updates);
                });
                return deferred.promise;
            },
            urlParameter: function(filters) {
                var urlParameter = '';
                if(!_.isEmpty(filters)) {
                    // define string field parameters 
                    var fieldStr = ['category', 'brand', 'os'];
                    // filtering 
                    // - value not null
                    // - transform not string values to range
                    var params = _(filters).pick(function(v, k){
                        return k != 'page';
                    }).omit(function(value) {
                        return _.isUndefined(value) || _.isEmpty(value) || value == 'all';
                    }).transform(function(res, v, k) {
                        if(_.indexOf(fieldStr, k) == -1) {
                            var inSep = v.indexOf('-');
                            if(inSep > -1) {
                                var vArr = v.split('-');
                                v = (inSep == 0) ? { lt: vArr[1] } : { gte: vArr[0], lte: vArr[1] };
                            } else {
                                v = { gt: v };
                            }
                        }
                        res[k] = v;
                    }).value();

                    this.params = { q: params };
                    if(_.has(filters, 'page')) {
                        var page = parseInt(filters.page);
                        this.params['page'] = _.isNaN(page) ? 1 : page ;
                    }

                    urlParameter = '?' + jQuery.param(this.params);
                }
                else if(this.params) {
                    urlParameter = '?' + jQuery.param(this.params);
                }

                // console.log('urlParameter', urlParameter);

                return urlParameter;
            },
            getParams: function() {
                return this.params;
            },
            setParam: function(key, value) {
                this.params[key] = value;
                return this;
            },
            setParams: function(params) {
                this.params = _.assign(this.params, params);
                return this;
            },
            // populate dummy products
            populate: function(param) {
                param = param || 'all';
                var deferred = $q.defer();
                $http.post('/api/seeds/'+param.type, { upload: param.upload })
                    .success(deferred.resolve)
                    .error(deferred.reject);
                return deferred.promise;
            }
        }
    })
    .factory('productDummy', function() {
        return {
            list: [{
                "_id": "548093f0088353a02b7646fb",
                "image": "/images/phones/original_motorola-charm-with-motoblur.2.jpg",
                "body": "Motorola CHARM fits easily in your pocket or palm.  Includes MOTOBLUR service.",
                "category": "motorola",
                "createdAt": "2014-12-04T17:03:44.248Z",
                "slug": "motorola-charm-with-motoblur",
                "title": "Motorola CHARM™ with MOTOBLUR™",
                "price": 123,
                'rating': 4,
                'review': 1
            }, {
                "_id": "548093ef088353a02b7646fa",
                "image": "/images/phones/original_t-mobile-g2.2.jpg",
                "body": "The T-Mobile G2 moto with Google is the first smartphone built for 4G speeds on T-Mobile's new network. Get the information you need, faster than you ever thought possible.",
                "category": "t-mobile",
                "createdAt": "2014-12-04T17:03:43.878Z",
                "slug": "t-mobile-g2",
                "title": "T-Mobile G2",
                "price": 456,
                'rating': 2,
                'review': 2
            }, {
                "_id": "548093ef088353a02b7646f9",
                "image": "/images/phones/original_samsung-transform.1.jpg",
                "body": "The Samsung Transform™ brings you a fun way to customize your Android powered touch screen phone to just the way you like it through your favorite themed “Sprint ID Service Pack”.",
                "category": "samsung",
                "createdAt": "2014-12-04T17:03:43.440Z",
                "slug": "samsung-transform",
                "title": "Samsung Transform™",
                "price": 789,
                'rating': 3,
                'review': 3
            }],
            detail: {
                "_id": "5480a14ce3bc38c82510ad3e",
                "image": "/images/phones/motorola-charm-with-motoblur.0.jpg",
                "meta": {
                    "additionalFeatures": "MOTOBLUR-enabled; battery manager; seven home screens; customize by moving or resizing widgets; Android HTML WebKit w/Flash Lite; BACKTRACK™ navigation pad behind screen",
                    "android": {
                        "os": "Android 2.1",
                        "ui": "MOTOBLUR"
                    },
                    "availability": [
                        "T-Mobile,",
                        "Telus"
                    ],
                    "battery": {
                        "standbyTime": "267 hours",
                        "talkTime": "5 hours",
                        "type": "Lithium Ion (Li-Ion) (1170 mAH)"
                    },
                    "camera": {
                        "features": [
                            "Video"
                        ],
                        "primary": "3.0 megapixels"
                    },
                    "connectivity": {
                        "bluetooth": "Bluetooth 2.0",
                        "cell": "WCDMA 1700/2100, GSM 850/900/1800/1900, HSDPA 3.6 Mbps (Category 5/6), EDGE Class 12, GPRS Class 12",
                        "gps": true,
                        "infrared": false,
                        "wifi": "802.11 b/g"
                    },
                    "description": "Motorola CHARM fits easily in your pocket or palm. Includes MOTOBLUR so you can sync and merge your contacts, emails, messages and posts with continuous updates and back-ups.",
                    "display": {
                        "screenResolution": "QVGA (320 x 240)",
                        "screenSize": "2.8 inches",
                        "touchScreen": true
                    },
                    "hardware": {
                        "accelerometer": true,
                        "audioJack": "3.5mm",
                        "cpu": "600 MHz",
                        "fmRadio": false,
                        "physicalKeyboard": true,
                        "usb": "USB 2.0"
                    },
                    "id": "motorola-charm-with-motoblur",
                    "images": {
                        "cdnUri": "/images/phones",
                        "files": [
                            "motorola-charm-with-motoblur.0.jpg",
                            "motorola-charm-with-motoblur.2.jpg",
                            "motorola-charm-with-motoblur.1.jpg"
                        ]
                    },
                    "name": "Motorola CHARM™ with MOTOBLUR™",
                    "sizeAndWeight": {
                        "dimensions": [
                            "67.2 mm (w)",
                            "98.4 mm (h)",
                            "11.4 mm (d)"
                        ],
                        "weight": "110.0 grams"
                    },
                    "storage": {
                        "flash": "150MB",
                        "ram": "512MB"
                    }
                },
                "body": "Motorola CHARM fits easily in your pocket or palm.  Includes MOTOBLUR service.",
                "category": "motorola",
                "createdAt": "2014-12-04T18:00:44.751Z",
                "tags": [],
                "slug": "motorola-charm-with-motoblur",
                "title": "Motorola CHARM™ with MOTOBLUR™",
                "__v": 0,
                "comments": []
            },
            search: {
                loading: false,
                category: {
                    data: [
                        {
                            "_id": "electronics",
                            "path": "products/electronics",
                            "name": "Electronics",
                            "parent": "products",
                            "count": 200,
                            "__v": 0,
                            "children": [
                                {
                                    "_id": "desktops",
                                    "path": "products/electronics/desktops",
                                    "name": "Desktops",
                                    "parent": "electronics",
                                    "count": 100,
                                    "__v": 0,
                                    "children": []
                                },
                                {
                                    "_id": "laptops",
                                    "path": "products/electronics/laptops",
                                    "name": "Laptops",
                                    "parent": "electronics",
                                    "count": 100,
                                    "__v": 0,
                                    "children": []
                                }
                            ]
                        },
                        {
                            "_id": "mobile-phones",
                            "path": "products/mobile-phones",
                            "name": "Mobile Phones",
                            "parent": "products",
                            "count": 192,
                            "__v": 0,
                            "children": [
                                {
                                    "_id": "android",
                                    "path": "products/mobile-phones/android",
                                    "parent": "mobile-phones",
                                    "name": "Android",
                                    "count": 32,
                                    "__v": 0,
                                    "children": []
                                },
                                {
                                    "_id": "phones",
                                    "path": "products/mobile-phones/phones",
                                    "name": "Phones",
                                    "parent": "mobile-phones",
                                    "count": 150,
                                    "__v": 0,
                                    "children": []
                                },
                                {
                                    "_id": "tablets",
                                    "path": "products/mobile-phones/tablets",
                                    "name": "Tablets",
                                    "parent": "mobile-phones",
                                    "count": 10,
                                    "__v": 0,
                                    "children": []
                                }
                            ]
                        }
                    ]
                },
                brand: {
                    selected: [],
                    data: []
                },
                price: {
                    options: {},
                    selected: {
                        min: 0,
                        max: 100
                    }
                },
                os: {
                    selected: null,
                    data: []
                },
                storage: {
                    flash: {
                        selected: null,
                        data: []
                    },
                    ram: {
                        selected: null,
                        data: []
                    }
                },
                display: {
                    selected: null,
                    data: [],
                    clear: function() {
                        this.selected = [];
                    }
                },
                camera: {
                    selected: null,
                    data: []
                }
            }
        };
    });

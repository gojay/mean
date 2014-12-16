'use strict';

angular.module('exampleAppApp')
    .service('productService', function($q, $http, $resource) {
        // return {
        // 	get: function(query) {
        // 		var start = new Date().getTime();
        // 		var defer = $q.defer();

        // 		$http.get('/api/products' + query, {
        // 			cache: true
        // 		}).success(function(data) {
        // 			console.log('time taken for request: ' + (new Date().getTime() - start) + 'ms');
        // 			defer.resolve(data);
        // 		});

        // 		return defer.promise;
        // 	},
        // 	getProducts: function(params) {
        // 		var query = params ? '?' + $.param(params) : '';
        // 		return this.get(query);
        // 	},
        // 	getProductDetail: function(id) {
        // 		return this.get('/' + id);
        // 	}
        // };

        return $resource('/api/products/:id', {
            id: '@_id'
        }, {
            query: {
                method: 'GET',
                isArray: true,
                cache: true
            },
            get: {
                method: 'GET',
                cache: true
            },
            update: {
                method: 'PUT'
            }
        });
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
            }
        };
    });

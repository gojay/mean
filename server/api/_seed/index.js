'use strict';

var express = require('express');

// models
var User = require('../user/user.model'),
	Category = require('../category/category.model'),
    Blog = require('../blog/blog.model'),
	Product = require('../product/product.model');

// modules
var faker = require('faker'),
    async = require('async'),
    _ = require('lodash');

_.str = require('underscore.string');
_.mixin(_.str.exports());

var config = require('../../config/environment');
var fs = require('fs');

var PHONES_UPLOAD = false;
var PHONES_DIRECTORY = 'assets/data';
// var PHONES_DIRECTORY = 'assets/data/phones';

var api_key = 'SEM3CD98EEC1BC2D8AC45C093BD923966239';
var api_secret = 'NzQwZGQ5NzBlOTAyNGI5MWEzMGI2MGVjZDBmZDUwMjA';
var sem3 = require('semantics3-node/lib/main')(api_key,api_secret);
var semantics = [
   {
        name: 'Mobile phones',
        meta: ["color", "operatingsystem", "manufacturer", "weight", "length", "width", "height", "size", "images", "features"],
        fields: ["name", "description", "price", "brand", "color", "operatingsystem", "manufacturer", "images", "weight", "length", "width", "height", "size", "features", "created_at"],
        childs: [{
            id: 12181,
            name: 'Phones',
            range: 5
        }, {
            id: 23130,
            name: 'Tablets',
            range: 1
        }]
    },
    {
        name: 'Electronics',
        meta: ["color", "manufacturer", "weight", "length", "width", "height", "size", "images", "features"],
        fields: ["name", "description", "price", "brand", "color", "manufacturer", "images", "weight", "length", "width", "height", "size", "features", "created_at"],
        childs: [{
            id: 12855,
            name: 'Laptops'
        }, {
            id: 23130,
            name: 'Netbooks'
        }, {
            id: 4672,
            name: 'Desktops'
        }]
    }
];

var router = express.Router();

console.log('sem3', sem3)

function getCategoryName(phone) {
    var category;
    var name = phone.name;
    var indexName = name.indexOf('by');
    // check name
    if(indexName > 0) {
        category = name.substr(indexName + 2, name.length).trim().toLowerCase();
    } else {
        var id = _.strLeft(phone.id, '-');
        category = id.length == 1 ? _.words(phone.id, '-').splice(0,2).join('-') : id ;
    }
    return category;
}

function populateCategory(q, callback) {
    var productCategory;

    var queues = {
        /*blog: function(callback) {
            console.info('seed category blog...');

            var programming = new Category({ _id: 'programming'});
            programming.save(function(){
                async.parallel([
                    function (_callback) {
                        var childs = ['php', 'javascript', 'ruby'];
                        var languages = new Category({ _id: 'languages'});
                        languages.parent = programming;
                        languages.save(function(){
                            async.each(childs, function(id, __callback) {
                                var category = new Category({ _id:id });
                                category.parent = languages;
                                category.save();
                                __callback();
                            }, function(err) {
                                _callback(err, 'The categories of child language have been saved');
                            });
                        });
                    },
                    function (_callback) {
                        var childs = ['MongoDB', 'MySQL', 'Oracle'];
                        var databases = new Category({ _id: 'databases'});
                        databases.parent = programming;
                        databases.save(function(){
                            async.each(childs, function(id, __callback) {
                                var category = new Category({ _id:id });
                                category.parent = databases;
                                category.save();
                                __callback();
                            }, function(err) {
                                _callback(err, 'The categories of child database have been saved');
                            });
                        });
                    }
                ], function(err, results) {
                    callback(err, results);
                });
            });
        },*/
        product: function(done) {
            // console.info('seed category product...');
            
            async.waterfall([
                function(callback) {
                    var cats = [], childs = [];

                    var q = async.queue(function (category, callback) {
                        var parent = new Category({ _id:category.name, name:category.name, parent:'products' });
                        parent.save(function(err) {
                            childs.push(_.map(category.childs, function(cat) {
                                return _.assign(cat, {
                                    parent: parent._id,
                                    meta: category.meta,
                                    fields: category.fields,
                                });
                            }));
                            callback();
                        });
                    });

                    // assign a callback
                    q.drain = function() {
                        // console.log('all parent items have been processed');
                        callback(null, childs);
                    };

                    _.forEach(semantics, function(item) {
                        q.push(item);
                    });
                },
                function(childs, callback) {
                    var categories = [];

                    var q = async.queue(function (task, callback) {
                        var category = new Category({ _id:task.name, name:task.name, parent:task.parent });
                        category.save(function(err, cat) {
                            task._id = cat._id;
                            categories.push(task);
                            callback();
                        });
                    });

                    // assign a callback
                    q.drain = function() {
                        // console.log('all child items have been processed');
                        callback(null, categories);
                    };

                    _.forEach(childs, function(item) {
                        q.push(item);
                    });
                }
            ], done);
        },
        android: function(done) {
            // console.info('seed category android...');

            async.waterfall([
                function(callback) {
                    // console.info('getting android from json...');
                    var phones = [];

                    fs.readFile(config.root + '/'+ PHONES_DIRECTORY + '/phones.json', 'utf8', function (err, data) {
                        if (err) return callback(err);

                        var phoneData = JSON.parse(data);

                        var categories = [];
                        async.each(phoneData, function(phone, _callback) {
                            var category = getCategoryName(phone);
                            categories.push(category);
                            // set phone category
                            // phone.category = category;
                            phone.category = 'android';
                            phone.brand = _.titleize(category);
                            phones.push(phone);
                            _callback();
                        }, function(err) {
                            categories = _.uniq(categories);
                            callback(err, categories, phones);
                        });
                    });
                },
                function(categories, phones, callback){
                    // console.info('saving android categories...');

                    var android = new Category({ _id: 'android', name: 'Android'});
                    Category.findOne({ _id: /mobile/i }, function(err, mobile) {
                        if(mobile) {
                            android.parent = mobile;
                            android.save(function() {
                                return callback(null, phones);
                            });
                        }

                        var mobile = new Category({ _id: 'Mobile phones', name: 'Mobile phones', parent: 'products'});
                        // mobile.parent = products;
                        mobile.save(function() {
                            android.parent = mobile;
                            android.save();
                            callback(null, phones);
                        });

                        // phones.parent = products;
                        // phones.save(function() {
                        //     async.each(categories, function(id, _callback) {
                        //         var category = new Category({ _id:id });
                        //         category.parent = phones;
                        //         category.save();
                        //         _callback();
                        //     }, function(err) {
                        //         callback(err, 'completed');
                        //     });
                        // });
                    })
                },
            ], function (err, phones) {
                done(err, phones);
            });
        }
    };

    var series = {};
    if(q && _.has(queues, q)) {
        series[q] = queues[q];
    } else {
        series = queues;
    }

    Category.remove(function (err) {
        productCategory = new Category({ _id: 'products' });
        productCategory.save(function() {
            async.series(series, function(err, results) {
                if(err) return callback(err);
                if(q) return callback(null, results[q]);
                callback(null, results)
            });
        });
    });
}

function populateUser(maximum, done) {
    User.count({}, function(err, count) {
        if (count < maximum) {
            // create user
            var until = maximum - count;
            // console.info('populate:user:create:%d...', until);

            var createUser = function(id, callback) {
                callback(null, {
                    name: faker.name.firstName() + ' ' + faker.name.lastName(),
                    email: faker.internet.email(),
                    provider: 'local',
                    password: 'user' + id
                });
            }
            // generate user
            async.times(until, function(n, next){
                createUser(n, function(err, user) {
                  next(err, user)
                })
            }, function(err, users) {
                // we should now have n users
                User.create(users, function(err) {
                    if(err) return callback(err);
                     User.find({ role:{ $nin:['admin'] }}, '_id', function(err, users) {
                        var results = _.map(users, function(user) {
                            return user._id;
                        });
                        done(err, results);
                    });
                });
            });
        } else {
            // console.info('populate:user:get...');
            User.find({ role:{ $nin:['admin'] }}, /*'_id', */function(err, users) {
                // var results = _.map(users, function(user) {
                //     return user._id;
                // });
                done(err, users);
            });
        }
    });
}

/* Populate */

var Populate = {
    android: {
        do: function(removeAll, data, done) {
            var self = this;

            Populate.users = data.users;
            var phones = data.phones;
            
            console.info('saving %d phones...\n-----------\n', phones.length);

            var q = async.queue(function (phone, callback) {
                console.info('\n-----------\n');
                console.info('queue : %s', phone.name);

                var jsonFile = _.sprintf('%s/%s/%s.json', config.root, PHONES_DIRECTORY, phone.id);
                fs.readFile(jsonFile, 'utf8', function (err, data) {
                    if(err) return callback(err);

                    // meta
                    var meta = JSON.parse(data);

                    meta.camera.primary = parseFloat(meta.camera.primary);
                    meta.display.screenSize = parseFloat(meta.display.screenSize);
                    meta.storage.flash = parseFloat(meta.storage.flash);
                    meta.storage.ram = parseFloat(meta.storage.ram);
            
                    // create fake reviews
                    async.times(_.random(1, 10), function(n, next) {
                        Populate.createReviews(n, function(err, review) {
                          next(err, review)
                        });
                    }, function(err, reviews) { 
                        // images
                        var images = [];
                        if(!/phones/.test(PHONES_DIRECTORY) && PHONES_UPLOAD) {
                            images = _.map(meta.images, function(image) {
                                return config.root + '/' + image.replace('img', 'assets');
                            });
                        }

                        // save product
                        var product = new Product();
                        product.category = phone.category;
                        product.title = phone.name;
                        product.slug = phone.id;
                        product.body = phone.snippet;
                        product.brand = phone.brand;
                        product.price = faker.finance.amount();
                        product.stock = _.random(1,99);
                        product.reviews = reviews;
                        product.meta = meta;
                        product.createdAt = faker.date.between('Jan 1, 2014', 'Nov 23, 2014');

                        if(_.isEmpty(images) || !PHONES_UPLOAD ) {

                            product.save(callback);

                        } else {

                            product.uploadAndSave(images, function(err, product) {
                                if(err) return callback(err);
                                callback();
                            });

                        }
                    }); 
                });
            });

            q.drain = function() {
                console.log('all items have been processed');
                done(null, 'android:completed');
            };

            if(removeAll) {
                Product.remove(function() {
                    q.push(phones);
                });
            } else {
                // self.add(phones, done);
                q.push(phones);
            }
        }
    },
    products: {
        do: function(removeAll, data, done) {
            var self = this;

            self.total = 0;

            Populate.users = data.users;

            // get semantics
            self.q = async.queue(function (category, callback) {
                console.info('\n---------------- %s ------------\n', category.name);
                console.log('[queue]', category.name);
                self.semantics.populate(category, callback);
            });
            // assign a callback
            self.q.drain = function() {
                console.info('\n---------------- completed (%d) ------------\n', self.total);
                return done(null, 'products:completed');
            };

            var categories = data.categories;
            if(removeAll) {
                Product.remove(function() {
                    self.add(categories);
                });
            } else {
                self.add(categories);
            }
        },
        add: function(categories) {
            var self = this;
            _.forEach(categories, function(childs){
                self.q.push(childs, function (err, result) {
                    if (err) {
                        return self.done({ message: "Error:semantic product category " + childs.name, error: err });
                    }   
                    self.total += result.count;
                    console.log('[%s] finished get semantic (%d)', childs.name, result.count);
                });
            });
        },
        semantics: {
            populate: function(category,  done) {
                var self = this;

                self.count = 0;
                self.category = category;
                self.done = done;

                self.q = async.queue(function (id, callback) {
                    console.log('[%s] ------------ page %d ------------', category.name, id + 1);
                    self.getProducts(id, callback);
                });

                // assign a callback
                self.q.drain = function() {
                    console.log('[%s] all items have been processed', category.name);
                    return done(null, { name: category.name, count: self.count });
                };

                // add some items to the queue
                var range = category.range ? category.range : _.random(2,4); 
                console.log('[%s] get products until %d pages', category.name, range);
                _.forEach(_.range(range), function(n){
                    self.q.push(n, function (err) {
                        if(err) return self.done(err);
                        console.log('[%s] finished processing product on page %d', category.name, n + 1);
                    });
                });
            },
            getProducts: function(id, callback) {
                var self = this;
                var category = self.category;

                var info = id > 0 ? "iterate_products" : "get_products" ;
                var offset = id * 10;

                sem3.products.products_field("cat_id", category.id);
                sem3.products.products_field("fields", category.fields);
                // sem3.products.products_field("sort", "created_at", "asc");
                sem3.products.products_field("offset", offset);
                    
                var constructedJson = sem3.products.get_query_json( "products" );

                // console.log('[%s] %s:%d', category.name, info, id);
                // console.log('[%s] query', constructedJson);

                sem3.products.get_products(function(err, response) {
                    if (err) {
                        return callback({
                            message:"Couldn't execute query : offset : " + offset, 
                            error:err
                        });
                    }
                    self.saveProducts(response, callback);
               });
            },
            saveProducts: function(response, callback) {
                var self = this;

                var category = self.category;
                var data = JSON.parse(response);

                var products = [];

                console.log('[%s] response count : %d, total: %d', category.name, data['results_count'], data['total_results_count'])

                async.each(data.results, function(item, _callback) {
                    var meta = self.getMetaFields(item);
                    // generate reviews
                    async.times(_.random(1, 10), function(n, next) {
                        Populate.createReviews(n, function(err, review) {
                          next(err, review)
                        });
                    }, function(err, reviews) {           
                        products.push({
                            category: category._id,
                            title: item.name,
                            body: item.description || '',
                            brand: item.brand || 'NA',
                            image: item.images ? item.images[0] : '',
                            price: item.price ? parseFloat(item.price) : 0 ,
                            stock: _.random(1,99),
                            reviews: reviews,
                            meta: meta,
                            createdAt: item['created_at']*1000
                        });
                        _callback();
                    });
                }, function(err) {
                    Product.create(products, function(err, results) {
                        if(err) {
                            console.log('[%] error: saved products', category.name, err);
                            return callback(err);
                        }
                        self.count += products.length;
                        callback();
                    });
                });
            },
            getMetaFields: function(item) {
                var self = this;

                var meta = _.pick(item, function(value, key) {
                    return _.indexOf(self.category.meta, key) > -1;
                });

                meta.height = meta.height ? parseFloat(meta.height) : 0;
                meta.width  = meta.width  ? parseFloat(meta.width) : 0;
                meta.length = meta.length ? parseFloat(meta.length) : 0;
                meta.weight = meta.weight ? parseFloat(meta.weight) : 0;

                if(meta.features) {
                    var features = _.map(meta.features, function(v,k) {
                        var obj = {};
                        var key = _.underscored(k.replace(/\./g, ''));
                        obj[key] = {
                            title: k,
                            value: v
                        }
                        return obj;
                    });
                    meta.features = features;
                }

                return meta;
            }
        }
    },
    createReviews: function(id, callback) {
        var self = this;
        callback(null, {
            user: self.users[_.random(10)],
            body: faker.lorem.paragraph(),
            rate: _.random(1, 5),
            createdAt: faker.date.between('Jan 1, 2014', 'Nov 23, 2014')
        });
    }
};

router.post('/categories', function(req, res) {
    populateCategory(null, function(err, categories) {
        if(err) return res.json(500, err);
        console.log(categories)
        res.json(201, categories);
    });
});
router.post('/category/:name', function(req, res) {
    var name = req.params.name;
    populateCategory(name, function(err, categories) {
        if(err) return res.json(500, err);
        res.json(201, categories[name]);
    });
});
/*
router.post('/blogs/:count', function(req, res) {
    var until = req.params.count;
    var minimum = 1,
        maximum = 10;

    async.waterfall([
        // get user ids
        function(callback) {
            populateUser(maximum, callback);
        },
        // get categories descendants ["Databases","Languages"]
        function(users, callback) {
            console.info('get categories...');
            populateCategory('blog', function(_err, _res) {
                if(_err) return callback(err);
                Category.getPathDescendants(["Databases", "Languages"], function(err, categories) {
                    callback(err, users, categories);
                });
            });
        },
        // create fake posts
        function(users, categories, callback) {
            console.info('create fake posts...');
            var posts = [];
            // create fake post comments
            for (var i = 1; i <= until; i++) {
                var randomNumber = _.random(1, maximum);
                var comments = [];
                for (var j = 1; j <= randomNumber; j++) {
                	var randomDate = faker.date.between('Jan 1, 2014', 'Nov 23, 2014');
                    comments.push({
                        body: faker.lorem.paragraph(),
                        user: users[_.random(maximum)],
                        createdAt: randomDate
                    });
                }

                var title = (i-1) + ' ' + faker.lorem.sentence(),
                    slug  = faker.helpers.slugify(title),
                    likes = _.shuffle(users).slice(0, _.random(1, maximum)),
                    votes = _.random(0, 100);

            	var randomDate = faker.date.between('Jan 1, 2014', 'Nov 23, 2014');
                posts.push({
                    title: title,
                    slug: slug,
                    body: faker.lorem.paragraph(),
                    tags: faker.lorem.words(),
                    user: users[Math.floor(Math.random() * users.length)],
                    category: categories[Math.floor(Math.random() * categories.length)],
                    comments: comments,
                    likes: likes,
                    votes: votes,
                    createdAt: randomDate
                });
            }
            callback(null, posts);
        }
    ], function(err, posts) {
        if (err) return res.json(500, err);

        Blog.remove(function(err) {
            // create blog posts
            Blog.create(posts, function(err) {
                if (err) return handleError(res, err);
                return res.json(201, 'Created!!');
            });
        });
    });
});
*/
router.post('/android', function(req, res) {
    var minimum = 1,
        maximum = 20;

    if(req.body.upload) {
        PHONES_UPLOAD = req.body.upload;
    }

    console.log('PHONES_UPLOAD', PHONES_UPLOAD);

    async.series({
        // create users
        users: function(callback) {
            populateUser(maximum, callback);
        },
        // create phone categories
        phones: function(callback) {
            populateCategory('android', callback);
        }
    }, function(err, results) {
        if (err) return res.json(500, err);
        Populate.android.do(true, results, function(err) {
            if (err) return res.json(500, err);
            res.json(201, { message: 'Created!' });
        });
    });
});

router.post('/products', function(req, res) {
    var maximum = 20;

    console.log('seed products by semantics..');

    async.series({
        // create users
        users: function(callback) {
            populateUser(maximum, callback);
        },
        // create categories
        categories: function(callback) {
            populateCategory('product', callback);
        }
    }, function (err, results) {
        if(err) return res.json(500, err);
        Populate.products.do(true, results, function(err, results) {
            if(err) return res.json(500, err);
            return res.json(201, results);
        });
    });
});

router.post('/all', function(req, res) {
    var maximum = 20;
    
    if(req.body.upload) {
        PHONES_UPLOAD = req.body.upload;
    }

    Product.remove(function() {
        async.auto({
            users: function(callback) {
                console.log('[all:users] creating...');
                populateUser(maximum, callback);
            },
            categories: function(callback) {
                console.log('[all:categories] creating...');
                populateCategory(null, callback);
            },
            android: ['users', 'categories', function(callback, results) {
                console.log('\n[all:android] populate...');

                var data = { 
                    users: results.users, 
                    phones: results.categories.android 
                };

                Populate.android.do(false, data, callback);
            }],
            semantics: ['android', function(callback, results) {
                console.log('[all:semantics] populate...');

                var data = { 
                    users: results.users, 
                    categories: results.categories.product 
                };

                Populate.products.do(false, data, function(err) {
                    if(err) return callback(err);
                    res.json(201, { message: 'Created!' });
                });
            }]
        }, function(err, results) {
            if(err) return res.json(500, err);
        });
    });
});

module.exports = router;

'use strict';

var express = require('express');

// models
var User = require('../user/user.model'),
	Category = require('../category/category.model'),
    Blog = require('../blog/blog.model'),
	Product = require('../product/product.model');

// modules
var faker = require('Faker'),
    async = require('async'),
    _ = require('lodash');

_.str = require('underscore.string');
_.mixin(_.str.exports());

var config = require('../../config/environment');
var fs = require('fs');

var router = express.Router();

function seedCategories(q, done) {
    var queue = {
        blog: function(callback) {
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
        },
        product: function(callback) {
            console.info('seed category product...');

            var _phones_ = [];
            async.waterfall([
                function(_callback) {
                    console.info('getting phones from json...');

                    fs.readFile(config.root + '/assets/data/phones.json', 'utf8', function (err, data) {
                        if (err) return _callback(err);

                        var phones = JSON.parse(data);

                        var _categories = [];
                        async.each(phones, function(phone, __callback) {
                            var id = _.strLeft(phone.id, '-');
                            var catId = id.length == 1 ? _.words(phone.id, '-').splice(0,2).join('-') : id ;
                            _categories.push(catId);
                            // set phone category
                            phone.category = catId;
                            _phones_.push(phone);
                            __callback();
                        }, function(err) {
                            var categories = _.uniq(_categories);
                            _callback(err, categories);
                        });
                    });
                },
                function(categories, _callback){
                    console.info('saving phone categories...');

                    var products = new Category({ _id: 'products'});
                    var phones   = new Category({ _id: 'phones'});
                    products.save(function() {
                        phones.parent = products;
                        phones.save(function() {
                            async.each(categories, function(id, __callback) {
                                var category = new Category({ _id:id });
                                category.parent = phones;
                                category.save();
                                __callback();
                            }, function(err) {
                                _callback(err, 'completed');
                            });
                        });
                    });
                },
            ], function (err, result) {
                callback(err, _phones_);
            });
        }
    };

    var func = {};
    if(q && _.has(queue, q)) {
        func[q] = queue[q];
    } else {
        func = queue;
    }
    async.series(func, function(err, results) {
        done(err, results);
    });
}

router.post('/categories', function(req, res) {
    Category.remove(function (err) {
        seedCategories(null, function(err, categories) {
            if(err) return res.json(500, err);
            res.json(201, categories);
        });
    });
});
router.post('/category/:name', function(req, res) {
    Category.remove(function (err) {
        seedCategories(req.params.name, function(err, categories) {
            if(err) return res.json(500, err);
            res.json(201, categories);
        });
    });
});

router.post('/blog/:count', function(req, res) {
    var until = req.params.count;
    var minimum = 1,
        maximum = 10;

    async.waterfall([
        // get user ids
        function(callback) {
            console.info('get users...');
            // get count users
            User.count({}, function(err, count) {
                if (count < maximum) {
                    // create user
                    console.info('create %d users', maximum - count);
                    var users = [];
                    for (var i = count + 1; i <= maximum; i++) {
                        users.push({
                            name: faker.name.firstName() + ' ' + faker.name.lastName(),
                            email: faker.internet.email(),
                            provider: 'local',
                            password: 'user' + i
                        });
                    };
                    User.create(users, function(err, users) {
                        if (err) callback(err);
                        User.find({}, '_id', function(err, users) {
                            callback(err, users);
                        });
                    });
                } else {
                    // console.info('has %d users', count);
                    User.find({}, '_id', function(err, users) {
                        callback(err, users);
                    });
                }
            });
        },
        // get categories descendants ["Databases","Languages"]
        function(users, callback) {
            console.info('get categories...');
            seedCategories('blog', function(_err, _res) {
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
                var randomNumber = _.random(maximum);
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

router.post('/phone', function(req, res) {
    seedCategories('product', function(_err, _res) {
        if(_err) return res.send(500);

        var phones = _res.product;

        console.info('saving phones...\n-----------\n');

        var q = async.queue(function (phone, callback) {
            console.info('\n-----------\n');
            console.info('queue : %s', phone.name);

            var jsonFile = _.sprintf('%s/assets/data/%s.json', config.root, phone.id);
            fs.readFile(jsonFile, 'utf8', function (err, data) {
                if(err) return callback(err);
                var meta = JSON.parse(data);
                // set null images
                var images = _.map(meta.images, function(image) {
                    return config.root + '/' + image.replace('img', 'assets');
                });
                // save phone
                var product = new Product();
                product.category = phone.category;
                product.title = phone.name;
                product.slug = phone.id;
                product.body = phone.snippet;
                product.meta = meta;
                product.uploadAndSave(images, function(err, product) {
                    console.log('error : %s', phone.name, err);
                    if(err) return callback(err);
                    callback();
                });
            });
        });
            
        Product.remove(function() {
            _.forEach(phones, function(phone) {
                // add phone to the queue
                q.push(phone, function (err) {
                    if(err) {
                        console.log('error processing %s', phone.name);
                        return res.send(500, err);
                    }
                    console.log('finished : processing %s', phone.name);
                });
            });
        });

        q.drain = function() {
            console.log('all items have been processed');
            return res.send(201);
        };
    });
});

module.exports = router;

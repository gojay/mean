'use strict';

var express = require('express');
// models
var User = require('../user/user.model'),
	Category = require('../category/category.model'),
	Blog = require('../blog/blog.model');
// helpers
var faker = require('Faker'),
    async = require('async'),
    _ = require('lodash');

var router = express.Router();

router.get('/', function(req, res) {
    return res.send('seeders');
});

router.post('/category', function(req, res) {
  Category.remove({}, function (err) {
    var programming = new Category({ _id: 'programming'});
    var languages   = new Category({ _id: 'languages'});
    var databases   = new Category({ _id: 'databases'});
    var php         = new Category({ _id: 'PHP'});
    var javascript  = new Category({ _id: 'Javascript'});
    var ruby        = new Category({ _id: 'ruby'});
    var mongoDB     = new Category({ _id: 'Mongo DB'});
    var mysql       = new Category({ _id: 'MySQL'});
    var oracle      = new Category({ _id: 'Oracle'});
    // set parent
    languages.parent = programming;
    databases.parent = programming;
    php.parent        = languages;
    javascript.parent = languages;
    ruby.parent = languages;
    mongoDB.parent = databases;
    mysql.parent   = databases;
    oracle.parent   = databases;
    // save parent n child
    programming.save(function(){
    	async.series([
    		function (callback) {
		      	languages.save(function(){
			        php.save();
			        javascript.save();
			        ruby.save();
    				callback(null, 'The categories of child language have been saved');
		      	});
    		},
    		function (callback) {
		      	databases.save(function(){
			        mongoDB.save();
			        mysql.save();
			        oracle.save();
    				callback(null, 'The categories of child database have been saved');
		      	});
    		}
    	], function(err, results) {
    		if(err) return res.send(500);
    		Category.find({}, function (err, categories) {
			    if(err) { return handleError(res, err); }
			    return res.json(201, categories);
		  	});
    	});
    });
  });
});

router.post('/blog', function(req, res) {
    var until = 50;
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
                    console.info('has %d users', count);
                    User.find({}, '_id', function(err, users) {
                        callback(err, users);
                    });
                }
            });
        },
        // get categories path descendants
        // ["Databases","Languages"]
        function(users, callback) {
            console.info('get categories...');
            Category.getPathDescendants(["Databases", "Languages"], function(err, categories) {
                callback(err, users, categories);
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
        if (err) {
            console.log('[ERR]', err);
            return res.json(500, err);
        }

        // return res.json(posts);

        Blog.remove({}, function(err) {
            // create blog posts
            Blog.create(posts, function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.json(201, 'Created!!');
            });
        });
    });
});

module.exports = router;

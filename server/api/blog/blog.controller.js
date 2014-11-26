'use strict';

var mongoose = require('mongoose');
// imager
var Imager = require('imager');
// var imagerConfig = require('../../config/imager');

// models
var Blog     = require('./blog.model'),
    Category = require('../category/category.model'),
    User     = require('../user/user.model');
// utils
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());
// helpers
var faker = require('Faker'), 
    async = require('async');

exports.createDummy = function(req, res) {
  var until = 50;
  var minimum = 1, maximum = 5;

  async.waterfall([
    // get user ids
    function(callback){
      // create users
      // var users = [];
      // for (var i = 3; i <= 5; i++) {
      //   users.push({
      //     name: faker.name.firstName() + ' ' + faker.name.lastName(),
      //     email: faker.internet.email(),
      //     provider: 'local',
      //     password: 'user'+i
      //   });
      // };

      // User.create(users, function (err) {
      //   if(err) callback(err);
      //   callback(users);
      //   User.find({}, '_id', function(err, users) {
      //     users = users.map(function (user) {
      //       return user._id;
      //     });
      //     callback(err, users);
      //   });
      // });

      User.find({}, '_id', function(err, users) {
        users = users.map(function (user) {
          return user._id;
        });
        callback(err, users);
      });
    },
    // get categories path descendants
    // ["Databases","Languages"]
    function(users, callback){
      Category.getPathDescendants(["Databases","Languages"], function (err, categories) {
        callback(err, users, categories);
      });
    },
    // create fake posts
    function(users, categories, callback){
      var posts = [];

      for (var i = 1; i <= until; i++) {

        var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        var comments = [];
        for (var j = 1; j <= randomnumber; j++) {
          comments.push({
            body: faker.lorem.paragraph(),
            user: users[Math.floor(Math.random() * users.length)]
          });
        }

        var title = i + ' ' + faker.lorem.sentence(),
          slug = faker.helpers.slugify(title);

        posts.push({
          title: title,
          slug: slug, 
          body: faker.lorem.paragraph(),
          tags: faker.lorem.words(),
          user: users[Math.floor(Math.random() * users.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          comments: comments
        });
      }
      callback(null, posts);
    }
  ], function (err, posts) {
    if(err) { 
      console.log('[ERR]', err);
      return res.json(500, err);
    }

    // return res.json(posts);

    Blog.remove({}, function (err) {
      // create blog posts
      Blog.create(posts, function (err) {
        if(err) { 
          return handleError(res, err); 
        }
        return res.json(201, 'Created!!');
      });
    });
  });
};

exports.load = function (req, res, next, id){
  Blog.load(id, function (err, blog) {
    if (err) return next(err);
    if (!blog) return res.send(404, 'blog not found');
    req.blog = blog;
    next();
  });
};

// Get list of blogs
exports.index = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 10;
  var options = {
    page: page,
    perPage: perPage
  };

  Blog.list(options, function(err, blogs) {
    if(err) return handleError(res, err);
    return res.json(blogs);
  });
};

// Get a single blog
exports.show = function(req, res) {
  return res.json(200, req.blog);
};

// Creates a new blog in the DB.
exports.create = function(req, res) {
  var blog = new Blog(req.body);
  var images = req.files
    ? _.isArray(req.files.images) ? req.files.images : [req.files.images]
    : undefined;

  // blog.user = req.user;
  blog.user = "54520392bfdeb7fc21ab199e";

  blog.uploadAndSave(null, function(err, blog) {
    if(err) { 
      return handleError(res, err); 
    }
    return res.json(201, blog);
  });
};

// Updates an existing blog in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Blog.findById(req.params.id, function (err, blog) {
    if (err) { return handleError(res, err); }
    if(!blog) { return res.send(404); }
    var updated = _.merge(blog, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, blog);
    });
  });
};

// Deletes a blog from the DB.
exports.destroy = function(req, res) {
  Blog.findById(req.params.id, function (err, blog) {
    if(err) { return handleError(res, err); }
    if(!blog) { return res.send(404); }
    blog.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

/**
 * Comments
 */

exports.loadComments = function(req, res, next, id) {
  var blog = req.blog;
  var comment = blog.comments.id(id);
  if (!comment) return res.send(404, 'comment not found');
  req.comment = comment;
  next();
}

// Get list of comments 
exports.showComments = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 10;
  var options = {
    page: page,
    perPage: perPage
  };
  Blog.getComments(req.params.id, options, function (err, comments) {
    console.log(err, comments)
    return res.json(200, comments);
  });
};

// Get a single comment
exports.showComment = function(req, res) {
  return res.json(200, req.comment);
};

// Creates a new blog comment in the DB.
exports.addComment = function(req, res) {
  var blog = req.blog;
  var user = req.user;

  blog.addComment(user, req.body, function(err) {
    if(err) { 
      return handleError(res, err); 
    }
    return res.json(201, 'comment added');
  });
};

// Updates an existing blog comment in the DB.
exports.updateComment = function(req, res) {
  var blog = req.blog;
  var comment = req.comment;
  comment.body = req.body.body;

  if(!req.user.role == 'admin' || !_.isEqual(req.user._id, blog.user._id) || _.isEqual(req.user._id, comment.user._id)) {
    return res.json(403, 'Forbidden to updating this comment');
  }

  // var query   = { _id:req.params.id, 'comments._id':'545205dec1413ab00e894fb3' };
  // var set     = { $set: { 'comments.$.body': 'update comment' } };
  // var options = { multi: false };
  // Blog.update(query, set, options, function(err, n) {
  //   console.log('updated', err, n);
  // });

  blog.save(function(err, blog){
    if(err) { return handleError(res, err); }
    return res.json(200, blog);
  });
};

/**
 * Tags
 */

exports.showAllTags = function(req, res) {
  Blog.getAllTags(function (err, tags) {
    var tags = tags.map(function(tag) { return tag._id; });
    return res.json(tags);
  });
};
exports.showMostUsedTags = function(req, res) {
  Blog.getMostUsedTags(function (err, tags) {
    console.log(err, tags)
    return res.json(tags);
  });
};

exports.tags = function (req, res) {
  var tags = req.blog.tags;
  return res.json(tags);
};

exports.addTag = function (req, res) {
  var blog = req.blog;
  var tag = req.body.tag;

  blog.tags.addToSet(tag);    // add
  blog.save(function (err) {
    if(err) return handleError(err, res);
    return res.json('Tags updated');
  });
};
exports.updateTag = function (req, res) {
  var blog = req.blog;
  var tag = req.body.tag;

  if(!req.params.tagIndex) {
    return res.json(404, 'tag not found');
  }

  blog.tags.set(1, tag);      // update
  blog.save(function (err) {
    if(err) return handleError(err, res);
    return res.json('Tags updated');
  });
};
exports.deleteTag = function (req, res) {
  var blog = req.blog;

  if(!req.params.tagIndex) {
    return res.json(404, 'tag not found');
  }

  blog.tags.pull(tagIndex);        // remove
  blog.save(function (err) {
    if(err) return handleError(err, res);
    return res.json('Tags updated');
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
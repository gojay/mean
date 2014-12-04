'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var _ = require('lodash');
var async = require('async');

var Blog = require('./blog.model');
var Category = require('../category/category.model');
var User = require('../user/user.model');

var account = {
  name: 'Test user 2',
  email: 'test2@test.com',
  password: 'test'
};
var token, blogId, category;

describe('API blogs : ', function() {

  // remove all blogs, create user & seed categories
  before(function(done) {
    async.series([
        function(callback){
          var user = new User(account);
          user.save(function(err) {
            callback(err, 'user created');
          });
        },
        function(callback){
          request(app)
            .post('/api/seeds/category/blog')
            .expect(201, callback);
        },
        function(callback){
          Blog.remove(function(err) {
            callback(err, 'blog removed');
          });
        }
    ],
    function(err, results){
      if(err) return done(err);
      done();
    });
  });

  it('should blogs respond with JSON array and empty', function(done) {
    request(app)
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array).and.empty;
        done();
      });
  });

  it('should get token user', function(done) {
    request(app)
      .post('/auth/local')
      .send({ email:account.email, password: account.password })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.have.property('token');
        token = 'Bearer ' + res.body.token;
        done();
      })
  });

  it('should respond 401 when created blog is not authenticated', function(done) {
    request(app)
      .post('/api/blogs')
      .send({ 'title': 'Test title' })
      .expect(401, done)
  });

  it('should respond 422 when authenticated user creating blog without category', function(done) {
    request(app)
      .post('/api/blogs')
      .set('Authorization', token)
      .send({ 'title': 'Test title' })
      .expect(422, done);
  });

  it('should respond 201 and count of the relevant category increased when created blog is authenticated', function(done) {
    category = 'php';

    request(app)
      .post('/api/blogs')
      .set({ 
        'Authorization': token,
        'Content-Type': 'multipart/form-data'
      })
      .field('category', category)
      .field('title', 'Test blog')
      .field('body', 'body test')
      .field('tags', ['tag1', 'test'])
      .attach('images', "C:/Users/Asus/Pictures/dummy/Koala.jpg")
      .attach('images', "C:/Users/Asus/Pictures/dummy/Tulips.jpg")
      .expect(201)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object);
        blogId = res.body._id;

        Category.findById(category, function(err, category) {
          category.should.containEql({ count:1 });
          category.getAncestors({}, "_id, count", function (err, categories) {
            categories.should.containDeep([{ _id: 'programming', count: 1 }]).and.containDeep([{ _id: 'languages', count: 1 }])
            done();
          });
        });

      });
  });

  it('should respond 200 and count of the relevant category increased when edited blog is authenticated', function(done) {
    category = 'mysql';

    request(app)
      .put('/api/blogs/' + blogId)
      .set({ 
        'Authorization': token,
        'Content-Type': 'multipart/form-data'
      })
      .field('category', category)
      .attach('images', "C:/Users/Asus/Pictures/dummy/Penguins.jpg")
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object);

        Category.findById(category, function(err, category) {
          category.should.containEql({ count:1 });
          category.getAncestors({}, "_id, count", function (err, categories) {
            categories.should.containDeep([{ _id: 'programming', count: 1 }]).and.containDeep([{ _id: 'databases', count: 1 }])
            done();
          });
        });

      });
  });

  it('should respond 204 and count of the relevant category is null  when deleted blog is authenticated', function(done) {
    request(app)
      .del('/api/blogs/' + blogId)
      .set('Authorization', token)
      .expect(204)
      .end(function(err, res) {
        if(err) return done(err);

        Category.findById(category, function(err, category) {
          category.should.containEql({ count: 0 });
          category.getAncestors({}, "_id, count", function (err, categories) {
            categories.should.containDeep([{ _id: 'programming', count: 0 }]).and.containDeep([{ _id: 'databases', count: 0 }])
            done();
          });
        });
      });
  });

  // remove all users, categories & blogs
  after(function(done) {
    // User.remove(function() {
      Category.remove(done);
    // });
  });

});
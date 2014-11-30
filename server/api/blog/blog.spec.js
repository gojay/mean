'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var Blog = require('./blog.model');
var Category = require('../category/category.model');
var User = require('../user/user.model');

var _ = require('lodash');

var user = {
  email: 'test@test.com',
  password: 'test'
};
var token = null;

var categories = null;
var blogId = null;

describe('API blogs', function() {

  before(function(done) {
    Category.remove().exec(function() {
      Blog.remove().exec(function() {
        request(app)
          .post('/api/seeds/category')
          .expect(201)
          .end(function(err, res) {
            if(err) return done(err);
            res.body.should.be.instanceof(Array);
            categories = res.body;
            done();
          });
      });
    });
  });

  it('should GET blogs respond with JSON array', function(done) {
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

  it('should have test users', function(done) {
    User.count().exec(function(err, count) {
      count.should.have.equal(2);
      done();
    });
  });

  it('should user logged in successfully', function(done) {
    request(app)
      .post('/auth/local')
      .send(user)
      .expect(200)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object).and.have.property('token');
        token = 'Bearer ' + res.body.token;
        done();
      })
  });

  it('should guest create blog is unauthorized', function(done) {
    request(app)
      .post('/api/blogs')
      .send({
        'title': 'Test title',
        'body': 'Edit body'
      })
      .expect(401, done);
  });

  it('should authenticated user created blog successfully', function(done) {
    request(app)
      .post('/api/blogs')
      .set({ 
        'Authorization': token,
        'Content-Type': 'multipart/form-data'
      })
      .field('category', 'php')
      .field('title', 'Test blog')
      .field('body', 'body test')
      .field('tags', ['tag1', 'test'])
      .attach('images', "C:/Users/Asus/Pictures/dummy/Koala.jpg")
      .expect(201)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object);
        blogId = res.body._id;
        done();
      });
  });

  it('should authenticated user edited blog successfully', function(done) {
    /*request(app)
      .put('/api/blogs/' + blogId)
      .set('Authorization', token)
      .send({
        'body': 'Edit body',
        'tags': 'tag1, tag2'
      })
      .expect(200)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object);
        done();
      });*/

    request(app)
      .put('/api/blogs/' + blogId)
      .set({ 
        'Authorization': token,
        'Content-Type': 'multipart/form-data'
      })
      .field('category', 'mysql')
      .attach('images', "C:/Users/Asus/Pictures/dummy/Penguins.jpg")
      .expect(200, done);
  });

  it('should authenticated user deleted blog successfully', function(done) {
    request(app)
      .del('/api/blogs/' + blogId)
      .set('Authorization', token)
      .expect(204, done);
  });

});
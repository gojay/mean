'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

var Category = require('./category.model');

var account = {
  admin: {
    email: 'admin@admin.com',
    password: 'admin',
    token: null
  },
  user: {
    email: 'test@test.com',
    password: 'test',
    token: null
  }
};
var token = null;

describe('API categories : ', function() {

  // seed categories
  before(function(done) {
      request(app)
        .post('/api/seeds/categories')
        .expect(201, done);
  });

  it('should model category get descendants is an array & have length 6', function(done) {
    Category.getPathDescendants(["Databases", "Languages"], function(err, categories) {
        categories.should.be.instanceof(Array).and.have.length(6);
        Category.getPathDescendants(["phones"], function(err, _categories) {
          _categories.should.be.instanceof(Array).and.have.length(8);
          done();
        });
    });
  });

  it('should categories respond with JSON array', function(done) {
    request(app)
      .get('/api/categories')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array).and.not.be.empty;
        done();
      });
  });

  it('should respond 401 when guest create category', function(done) {
    request(app)
      .post('/api/categories')
      .send({ '_id': 'Test' })
      .expect(401, done);
  });

  it('should get token for user', function(done) {
    var user = account.user;

    request(app)
      .post('/auth/local')
      .send({ email: user.email, password: user.password })
      .expect(200)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object).and.have.property('token');
        user.token = 'Bearer ' + res.body.token;
        done();
      })
  });

  it('should get token for admin', function(done) {
    var admin = account.admin;

    request(app)
      .post('/auth/local')
      .send({ email: admin.email, password: admin.password })
      .expect(200)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object).and.have.property('token');
        admin.token = 'Bearer ' + res.body.token;
        done();
      })
  });

  it('should response 403 when user create category', function(done) {
    request(app)
      .post('/api/categories')
      .set('Authorization', account.user.token)
      .send({ '_id': 'Test' })
      .expect(403, done);
  });

  it('should response 201 when admin create category', function(done) {
    request(app)
      .post('/api/categories')
      .set('Authorization', account.admin.token)
      .send({ '_id': 'Test' })
      .expect(201, done);
  });

  it('should response 403 when user update category', function(done) {
    request(app)
      .put('/api/categories/test')
      .set('Authorization', account.user.token)
      .send({ '_id': 'example'})
      .expect(403, done);
  });

  it('should response 200 when admin update category', function(done) {
    request(app)
      .put('/api/categories/test')
      .set('Authorization', account.admin.token)
      .send({ '_id': 'example' })
      .expect(200, done);
  });

  after(function(done) {
    Category.remove().exec(done);
  });

});
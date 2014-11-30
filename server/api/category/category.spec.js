'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

var Category = require('./category.model');

var admin = {
  email: 'admin@admin.com',
  password: 'admin'
};
var token = null;

describe('API /api/categories', function() {

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

  it('should guest create category is unauthorized', function(done) {
    request(app)
      .post('/api/categories')
      .send({ '_id': 'Test' })
      .expect(401, done);
  });

  it('should admin logged in successfully', function(done) {
    request(app)
      .post('/auth/local')
      .send(admin)
      .expect(200)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object).and.have.property('token');
        token = 'Bearer ' + res.body.token;
        done();
      })
  });

  it('should admin created category successfully', function(done) {
    request(app)
      .post('/api/categories')
      .set('Authorization', token)
      .send({ '_id': 'Test' })
      .expect(201, done);
  });

  it('should categories getPathDescendants is an array', function(done) {
    Category.getPathDescendants(["Databases", "Languages"], function(err, categories) {
        console.log('categories', categories);
        categories.should.be.instanceof(Array).and.have.length(6);
        done();
    });
  });

});
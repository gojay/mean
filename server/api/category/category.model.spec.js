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

describe('Model : Category :', function() {

  // seed product categories
  before(function(done) {
    Category.remove(function() {
      request(app)
        .post('/api/seeds/category/product')
        .expect(201, done);
    });
  });

  it('should "products" category have 2 childrens', function(done) {
    Category.findById('products', function(err, cat) {
      cat.getChildrenTree(function(err, categories) {
          categories.should.be.instanceof(Array).and.have.length(2);
          done();
      });
    });
  });

  it('should "mobile-phones" category have 2 childs', function(done) {
    Category.findById('mobile-phones', function(err, cat) {
      cat.getChildrenTree(function(err, categories) {
          categories.should.be.instanceof(Array).and.have.length(2);
          done();
      });
    });
  });

  it('should "electronics" category have 3 childs', function(done) {
    Category.findById('mobile-phones', function(err, cat) {
      cat.getChildrenTree(function(err, categories) {
          categories.should.be.instanceof(Array).and.have.length(2);
          done();
      });
    });
  });

  it('should get path descendants', function(done) {
      Category.getPathDescendants(["electronics", "mobile-phones"], function(err, categories) {
        categories.should.be.eql([ 'desktops', 'laptops', 'netbooks', 'phones', 'tablets' ]);
        done();
      });
  });

  it('should set count increased', function(done) {
    Category.setCount({ category: 'phones', value: 1 }, function(err, result) {
      Category.findById('phones', function(err, category) {
          category.should.containEql({ count: 1 });
          category.getAncestors({}, "_id, count", function(err, categories) {
              categories.should.containDeep([{
                  _id: 'products',
                  count: 1
              }]).and.containDeep([{
                  _id: 'mobile-phones',
                  count: 1
              }]);
              done();
          });
      });
    });
  });

  it('should set count decreased', function(done) {
    Category.setCount({ category: 'phones', value: -1 }, function(err, result) {
      Category.findById('phones', function(err, category) {
          category.should.containEql({ count: 0 });
          category.getAncestors({}, "_id, count", function(err, categories) {
              categories.should.containDeep([{
                  _id: 'products',
                  count: 0
              }]).and.containDeep([{
                  _id: 'mobile-phones',
                  count: 0
              }]);
              done();
          });
      });
    });
  });

  it('should category normalize', function(done) {
    var category = new Category();
    category._id = 'just for testing';
    category.name = 'test';
    category.save(function(err, result) {
      should.not.exist(err);
      result._id.should.be.equal('just-for-testing');
      result.name.should.be.equal('Test');
      done();
    });
  });

  after(function(done) {
    Category.remove(done);
  });

});
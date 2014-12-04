'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

var Category = require('../category/category.model');
var Product = require('./product.model');

var config = require('../../config/environment');
var fs = require('fs');


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
var token, productId, category;

describe('API products : ', function() {
  this.timeout(30000);

  before(function(done) {
    Product.remove(done);
  });

  it('should seed category', function(done) {
    request(app)
      .post('/api/seeds/category/product')
      .expect(201, done);
  });

  it.skip('should seed phones', function(done) {
    request(app)
      .post('/api/seeds/phone')
      .expect(201, done);
  });

  it.skip('should begin with no products', function(done) {
    Product.find({}, function(err, products) {
      if(err) return done(err);
      products.should.have.length(0);
      done();
    })
  });

  it.skip('should product saved', function(done) {
      var path = config.root + '/assets/phones/';

      var images = [
        path + 'dell-streak-7.0.jpg',
        path + 'dell-streak-7.1.jpg',
        path + 'dell-streak-7.2.jpg',
        path + 'dell-streak-7.3.jpg',
        path + 'dell-streak-7.4.jpg'
      ];

      // save phone
      var product = new Product();
      product.name = 'Test';
      product.uploadAndSave(images, function(err, product) {
          if(err) return done(err);
          productId = product._id;
          done();
      });
  });

  it.skip('should product removed', function(done) {
    Product.findById(productId, function(err, product) {
      product.remove(done);
    });
  });

  it('should get token user', function(done) {
    var user = account.user;

    request(app)
      .post('/auth/local')
      .send({ email:user.email, password: user.password })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.have.property('token');
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

  it('should respond 401 when created product is not authenticated', function(done) {
    request(app)
      .post('/api/products')
      .send({ 'title': 'Test title' })
      .expect(401, done)
  });

  it('should respond 403 when user created product', function(done) {
    request(app)
      .post('/api/products')
      .set('Authorization', account.user.token)
      .send({ 'title': 'Test title' })
      .expect(403, done)
  });

  it('should respond 422 when admin creating product without category', function(done) {
    request(app)
      .post('/api/products')
      .set('Authorization', account.admin.token)
      .send({ 'title': 'Test title' })
      .expect(422, done);
  });

  it('should respond 201 and count of the relevant category increased when admin created product', function(done) {
    category = 'samsung';

    var meta = { 
      "additionalFeatures": "3.2\u201d Full touch screen with Advanced anti smudge, anti reflective and anti scratch glass; Swype text input for easy and fast message creation; multiple messaging options, including text with threaded messaging for organized, easy-to-follow text; Social Community support, including Facebook and MySpace; Next generation Address book; Visual Voice Mail\n", 
      "android": {
        "os": "Android 2.1", 
        "ui": "TouchWiz"
      }
    };

    request(app)
      .post('/api/products')
      .set({ 
        'Authorization': account.admin.token,
        'Content-Type': 'multipart/form-data'
      })
      .field('category', category)
      .field('title', 'Test product')
      .field('body', 'body test')
      .field('tags', ['tag1', 'test'])
      .field('meta', JSON.stringify(meta))
      .attach('images', "C:/Users/Asus/Pictures/dummy/Koala.jpg")
      .attach('images', "C:/Users/Asus/Pictures/dummy/Tulips.jpg")
      .expect(201)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err);
        res.body.should.be.instanceof(Object);
        productId = res.body._id;

        Category.findById(category, function(err, category) {
          category.should.containEql({ count:1 });
          category.getAncestors({}, "_id, count", function (err, categories) {
            categories.should.containDeep([{ _id: 'products', count: 1 }]).and.containDeep([{ _id: 'phones', count: 1 }])
            done();
          });
        });

      });
  });

  it('should respond 200 and count of the relevant category increased when admin edited product', function(done) {
    category = 't-mobile';

    request(app)
      .put('/api/products/' + productId)
      .set({ 
        'Authorization': account.admin.token,
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
            categories.should.containDeep([{ _id: 'products', count:1 }]).and.containDeep([{ _id: 'phones', count:1 }])
            done();
          });
        });

      });
  });

  it('should respond 204 and count of the relevant category is null when admin deleted product', function(done) {
    request(app)
      .del('/api/products/' + productId)
      .set('Authorization', account.admin.token)
      .expect(204)
      .end(function(err, res) {
        if(err) return done(err);

        Category.findById(category, function(err, category) {
          category.should.containEql({ count: 0 });
          category.getAncestors({}, "_id, count", function (err, categories) {
            categories.should.containDeep([{ _id: 'products', count: 0 }]).and.containDeep([{ _id: 'phones', count: 0 }])
            done();
          });
        });
      });
  });

  after(function(done) {
    Category.remove(function() {
      Product.remove(done);
    });
  });

});
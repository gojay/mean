var should = require('should');
var app = require('../../app');
var User = require('../../api/user/user.model');
var jwt = require('jsonwebtoken');
var config = require('../../config/environment');
var request = require('supertest');

describe('Local Auth API:', function() {

  // Clear users before testing
  before(function() {
    return User.remove().exec();
  });

  // Clear users after testing
  after(function() {
    return User.remove().exec();
  });

  describe('POST /auth/local', function() {
    var user;

    before(function(done) {
      user = new User({
        name: 'Fake User',
        email: 'test@test.com',
        password: 'password'
      });

      user.save(function(err) {
        if (err) return done(err);
        done();
      });
    });

    it('should respond with JWT when authenticated', function(done) {
      request(app)
        .post('/auth/local')
        .send({
          email: 'test@test.com',
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          var token = res.body.token;
          jwt.verify(token, config.secrets.session, function(err, session) {
            if (err) return done(err);
            session._id.should.equal(user._id.toString());
            done();
          });
        });
    });

    it('should respond with 401 and a "message" when not authenticated', function(done) {
      request(app)
        .post('/auth/local')
        .send({
          email: 'test@test.com',
          password: 'bad-password'
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          res.body.message.should.be.type('string');
          done();
        });
    });
  });
});
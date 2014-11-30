'use strict';

var User = require('./user.model');
var app = require('../../app');
var request = require('supertest');
var should = require('should');

var user = {
	name: 'Test user',
	email: 'test@test.com',
	password: 'password'
};

var token = null;

describe('API users', function() {
	before(function(done) {
		User.remove().exec(done);
	});

	it('should access GET api/users/me is unauthorized', function(done) {
		request(app)
			.get('/api/users/me')
			.expect(401, done);
	});

	it('should be registered succesfully', function(done) {
		request(app)
			.post('/api/users')
			.send(user)
			.expect(200, done)
			// .end(function(err, res) {
			// 	token = res.body.token;
			// 	done();
			// });
	});

	it('should be logged in successfully', function(done) {
		request(app)
			.post('/auth/local')
			.send({ email:user.email, password:user.password })
			.expect(200)
			.end(function(err, res) {
				if (err) return done(err);
				res.body.should.have.property('token');
        		token = res.body.token;
				done();
			})
	})

	it('should send valid token', function(done) {
		request(app)
			.get('/api/users/me')
			.set('Authorization', 'Bearer ' + token)
			.expect(200)
			.end(function(err, res) {
				if (err) return done(err);
        		res.body.should.be.instanceof(Object);
				done();
			});
	});

	it('should access GET api/users is forbidden', function(done) {
		request(app)
			.get('/api/users')
			.set('Authorization', 'Bearer ' + token)
			.expect(403, done);
	});

	after(function(done) {
		User.remove().exec(done);
	});
});
'use strict';

var User = require('./user.model');
var app = require('../../app');
var request = require('supertest');
var should = require('should');

var account = [{
	name: 'Test user',
	email: 'test@test.com',
	password: 'password'
}, {
	name: 'Test user 2',
	email: 'test2@test.com',
	password: 'password'
}];

var token = null;

describe('API users', function() {
	var user;

	before(function(done) {
		User.remove(function() {
			user = new User(account[0]);
			user.save(function(err) {
				if(err) return done(err);
				done();
			})
		});
	});

	it('should get token after user registration', function(done) {
		request(app)
			.post('/api/users')
			.send(account[1])
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(err, res) {
				if (err) return done(err);
				res.body.should.have.property('token');
				done();
			})
	});

	it('should get token after user login', function(done) {
		request(app)
			.post('/auth/local')
			.send({ email:account[0].email, password:account[0].password })
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(err, res) {
				if (err) return done(err);
				res.body.should.have.property('token');
        		token = res.body.token;
				done();
			})
	})

	it('should respond user profile when authenticated', function(done) {
		request(app)
			.get('/api/users/me')
			.set('Authorization', 'Bearer ' + token)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(err, res) {
				if (err) return done(err);
				res.body._id.should.equal(user._id.toString());
				done();
			});
	});

	it('should respond 401 when not authenticated', function(done) {
		request(app)
			.get('/api/users/me')
			.expect(401, done);
	});

	it('should respond 403 when user get listing user', function(done) {
		request(app)
			.get('/api/users')
			.set('Authorization', 'Bearer ' + token)
			.expect(403, done);
	});

	after(function(done) {
		User.remove().exec(done);
	});
});
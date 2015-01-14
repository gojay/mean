'use strict';

var app = require('../../app');
var request = require('supertest');
var should = require('should');
var fs = require('fs');
var config = require('../../config/environment');

describe.only('API seeds', function() {
  	this.timeout(9999999);

	it.skip('should seed categories', function(done) {
		request(app)
			.post('/api/seeds/category')
			.expect(201, done);
	});

	it.skip('should seed blogs', function(done) {
		request(app)
			.post('/api/seeds/blog/' + count)
			.expect(201, done);
	});

	it.skip('should seed android', function(done) {
		request(app)
			.post('/api/seeds/android')
			.expect(201, done);
	});

	it.skip('should seed products', function(done) {
		request(app)
			.post('/api/seeds/products')
			.expect(201, done);
	});

	it('should seed all', function(done) {
		request(app)
			.post('/api/seeds/all')
			.expect(201, done);
	});

});
'use strict';

var app = require('../../app');
var request = require('supertest');
var should = require('should');
var fs = require('fs');
var config = require('../../config/environment');

describe.only('API seeds', function() {

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

	it('should seed phones', function(done) {
		request(app)
			.post('/api/seeds/phone')
			.expect(201, done);
	});

});
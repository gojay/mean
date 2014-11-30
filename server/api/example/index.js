'use strict';

var express = require('express');
var controller = require('./example.controller');

var User = require('../user/user.model');
var Faker = require('faker'),
	_ = require('lodash');

var router = express.Router();

// router.get('/', controller.index);
router.post('/', controller.create);

router.get('/date', function(req, res) {
	var randomData = Faker.date.between('Jan 1, 2014', 'Nov 23, 2014');
	return res.send(randomData);
});
router.get('/user', function(req, res) {
	User.find({}, '_id', function(err, users) {
		var users = users.map(function(user) {
			return user._id;
		});
		var response = _.shuffle(users).slice(0, _.random(5));
		return res.json(response);
	});
});

module.exports = router;
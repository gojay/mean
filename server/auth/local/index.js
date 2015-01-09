'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router.post('/', function(req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    // var error = err || info;
    if (err) return res.json(401, err);
    if (!user) {
    	var respond = {
    		status: 500,
    		message: 'Something went wrong, please try again.'
    	};
    	
    	if(info) {
    		respond.status = 404;
    		respond.message = info;
    	}

    	return res.json(respond.status, respond.message);
    }

    var token = auth.signToken(user._id, user.role);
    res.json({token: token});
  })(req, res, next)
});

module.exports = router;
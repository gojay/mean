'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router
	/*
		Dynamic callbackUrl
		https://github.com/jaredhanson/passport-facebook/issues/2#issuecomment-40193197
	 */
	.get('/', function(req, res, next){
		var callbackURL = '/auth/github/callback';
		if(req.query.referrer) {
			callbackURL += '?referrer=' + encodeURI(req.query.referrer);
		}
		passport.authenticate('github', {
			callbackURL: callbackURL,
			failureRedirect: '/signup',
			session: false
		})(req,res,next);
	})

	.get('/callback', passport.authenticate('github', {
		failureRedirect: '/signup',
		session: false
	}), auth.setTokenCookie);

module.exports = router;
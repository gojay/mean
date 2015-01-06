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
		passport.authenticate('github', {
			callbackURL: '/auth/github/callback?referrer=' + encodeURI(req.query.referrer),
			failureRedirect: '/signup',
			session: false
		})(req,res,next);
	})

	.get('/callback', passport.authenticate('github', {
		failureRedirect: '/signup',
		session: false
	}), auth.setTokenCookie);

module.exports = router;
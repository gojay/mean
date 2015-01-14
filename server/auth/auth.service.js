'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var validateJwt = expressJwt({ secret: config.secrets.session });
var moment = require('moment');
var _ = require('lodash');

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function(req, res, next) {
      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function(req, res, next) {
      var userJWT = req.user;
      User.findById(userJWT._id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.send(401);
        
        if(userJWT.sub) {
          var provider = userJWT.sub.split('|');
          var providerName = provider[0];
          var providerId = provider[1];
          if(user.provider != providerName && 
            _.isUndefined(user[providerName]) && 
            user[providerName].id != providerId ) {
            return res.send(401);
          }
        }

        req.user = user;
        next();
      });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.send(403);
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  var token = jwt.sign({ _id: id }, config.secrets.session, { expiresInMinutes: 60 });
  // console.log('[signToken]', token);
  return token;
}
function signToken2(user) {
  var addedOptions = {};
  // subject
  if(user.provider != 'local') {
    var provider = user.provider;
    addedOptions.subject = provider + '|' + user[provider].id;
  }

  // audience (client id)
  
  var options = _.assign({
    // issuer : 'http://localhost:8080', 
    expiresInMinutes: 60 
  }, addedOptions);
  var token = jwt.sign({ _id: user.id }, config.secrets.session, options);
  return token;
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.json(401, { message: 'Something went wrong, please try again.'});
  // var token = signToken(req.user._id, req.user.role);
  var token = signToken2(req.user);
  res.cookie('token', JSON.stringify(token));
  // res.redirect('/');
  if (req.query.referrer) {
    res.redirect(req.query.referrer);
  } else {
    res.redirect('/');
  }
}

function refreshToken(req, res) {
  if (_.isUndefined(req.headers.authorization)) {
    return res.send(401);
  }
  
  var token;
  var parts = req.headers.authorization.split(' ');
  if (parts.length == 2) {
      var scheme = parts[0];
      var credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
          token = credentials;
      }
  } else {
      return res.send(401);
  }
  
  jwt.verify(token, config.secrets.session, function(err, decoded) {
    if(err) return res.json(401, err);
    // if more than 14 days old, force login
    if (moment().unix(decoded.iat).add(14, 'd').isAfter()) {
        return res.json(401, 'token is expired');
    }
    // check if the user still exists or if authorization hasn't been revoked
    User.findById(decoded._id, function(err, user) {
        if (err) return res.send(401);
        if (!user) return res.send(401);
        
        if(decoded.sub) {
          var provider = userJWT.sub.split('|');
          var providerName = provider[0];
          var providerId = provider[1];
          if(user.provider != providerName || 
            _.isUndefined(user[providerName]) ||  
            user[providerName].id != providerId ) {
            return res.send(401);
          }
        }
        // issue a new token
        var newToken = jwt.sign({ _id: user._id }, config.secrets.session, { expiresInMinutes: 60 });
        return res.json({ token: newToken });
    });
  });
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
exports.refreshToken = refreshToken;
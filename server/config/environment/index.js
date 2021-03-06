'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'example-app-secret'
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  facebook: {
    clientID:     process.env.FACEBOOK_ID || 'id',
    clientSecret: process.env.FACEBOOK_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/facebook/callback'
  },

  twitter: {
    clientID:     process.env.TWITTER_ID || 'id',
    clientSecret: process.env.TWITTER_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/twitter/callback'
  },

  google: {
    clientID:     process.env.GOOGLE_ID || 'id',
    clientSecret: process.env.GOOGLE_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/google/callback'
  },

  github: {
    clientID:     process.env.GITHUB_ID || 'ad694f58a414f2be67c7',
    clientSecret: process.env.GITHUB_SECRET || '49fc15aa4a889bf62642c98cea3d06add9507b32',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/github/callback'
  },

  cloudinary: {
    // cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'doztst1iv',
    // apiKey: process.env.CLOUDINARY_API_KEY || '714114529258881',
    // apiSecret: process.env.CLOUDINARY_API_SECRET || 'nAv_fy8Pejf8FAeCZb_ZQwT4SSw',
    // url: process.env.CLOUDINARY_URL || 'cloudinary://714114529258881:nAv_fy8Pejf8FAeCZb_ZQwT4SSw@doztst1iv'
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'digi-co-id',
    apiKey: process.env.CLOUDINARY_API_KEY || '665793913584278',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'OsrenCGWGK-vPnUjzHgxOvrdUdQ',
    url: process.env.CLOUDINARY_URL || 'cloudinary://665793913584278:OsrenCGWGK-vPnUjzHgxOvrdUdQ@digi-co-id'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
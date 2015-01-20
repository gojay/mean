'use strict';

// Test specific configuration
// ===========================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: process.env.MONGOLAB_URI_TEST || 'mongodb://localhost/exampleapp-test'
    // 'mongodb://gojay:gojay86meanapptest@ds031591.mongolab.com:31591/meanapp-test'
  },

  seedDB: true
};
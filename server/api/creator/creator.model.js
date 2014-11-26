'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CreatorSchema = new Schema({
  name: {
  	type: String,
  	trim: true,
  	required: 'Name cannot be blank'
  },
  type: {
  	type: String,
  	trim: true,
  	required: 'Type cannot be blank'
  },
  screenshot: {
  	type: String,
  	trim: true,
  	default: ''
  },
  description: {
  	type: String,
  	trim: true,
  	default: ''
  },
  created: {
  	type: Date,
  	default: Date.now
  },
  updated: Date,
  user: {
  	type: Schema.ObjectId,
  	ref: 'User'
  }
});

module.exports = mongoose.model('Creator', CreatorSchema);
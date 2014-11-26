'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var consoleSchema = Schema({
    name: String
  , manufacturer: String
  , released: Date
})
var Console = mongoose.model('Console', consoleSchema);

var gameSchema = Schema({
    name: String
  , developer: String
  , released: Date
  , consoles: [{ type: Schema.Types.ObjectId, ref: 'Console' }]
})
var Game = mongoose.model('Game', gameSchema);

var person = new Schema({
  name: String,
  friends: [{
    type: Schema.ObjectId,
    ref: 'Person'
  }]
});
var Person = mongoose.model('Person', person);

var blogpost = Schema({
  title: String,
  tags: [String],
  author: {
    type: Schema.ObjectId,
    ref: 'Person'
  }
})
var BlogPost = mongoose.model('BlogPost', blogpost);

module.exports.Console = Console;
module.exports.Game = Game;
module.exports.Person = Person;
module.exports.BlogPost = BlogPost;
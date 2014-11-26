'use strict';

/* https://github.com/LearnBoost/mongoose/tree/master/examples/population */

var _ = require('lodash');
var Game = require('./example.model').Game;
var Console = require('./example.model').Console;
var Person = require('./example.model').Person;
var BlogPost = require('./example.model').BlogPost;

var mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId;

// Get list of examples
exports.index = function(req, res) {

  /* population-basic */

  // Game
  //   .find({})
  //   .populate({
  //       path: 'consoles'
  //     , match: { manufacturer: 'Nintendo' }
  //     , select: 'name'
  //     // , options: { comment: 'population' }
  //   })
  //   .exec(function (err, games) {
  //     if (err) return done(err);

  //     return res.json(200, games);
  //   });

  /* population-plain-objects */

  // Game
  // .findOne({ name: /^Legend of Zelda/ })
  // .populate('consoles')
  // .lean() // just return plain objects, not documents wrapped by mongoose
  // .exec(function (err, ocinara) {
  //   if (err) return done(err);

  //   return res.json(200, ocinara);
  // })

  /* population-across-three-collections */

  BlogPost.find()
    .lean()
    .populate('author')
    .exec(function (err, docs) {
        var opts = {
            path: 'author.friends'
          , select: 'name'
          , options: { limit: 2 }
        }
 
        BlogPost.populate(docs, opts, function (err, docs) {
           return res.json(docs);
        })
      });
};

// Get a single example
exports.show = function(req, res) {
  Example.findById(req.params.id, function (err, example) {
    if(err) { return handleError(res, err); }
    if(!example) { return res.send(404); }
    return res.json(example);
  });
};

// Creates a new example in the DB.
exports.create = function(req, res) {
  // Console.create({
  //     name: 'Nintendo 64'
  //   , manufacturer: 'Nintendo'
  //   , released: 'September 29, 1996'
  // }, {
  //     name: 'Super Nintendo'
  //   , manufacturer: 'Nintendo'
  //   , released: 'August 23, 1991'
  // }, {
  //     name: 'XBOX 360'
  //   , manufacturer: 'Microsoft'
  //   , released: 'November 22, 2005'
  // }, function (err, nintendo64, superNintendo, xbox360) {
  //   if (err) return done(err);

  //   Game.create({
  //       name: 'Legend of Zelda: Ocarina of Time'
  //     , developer: 'Nintendo'
  //     , released: new Date('November 21, 1998')
  //     , consoles: [nintendo64]
  //   }, {
  //       name: 'Mario Kart'
  //     , developer: 'Nintendo'
  //     , released: 'September 1, 1992'
  //     , consoles: [superNintendo]
  //   }, {
  //       name: 'Perfect Dark Zero'
  //     , developer: 'Rare'
  //     , released: 'November 17, 2005'
  //     , consoles: [xbox360]
  //   }, function (err, res) {
  //     if (err) return done(err);
  //     return res.json(201, res);
  //   })
  // })

    var personIds = [new ObjectId, new ObjectId, new ObjectId, new ObjectId];
    var persons = [];

    persons.push({
      _id: personIds[0],
      name: 'mary',
      friends: [personIds[1], personIds[2], personIds[3]]
    });
    persons.push({
      _id: personIds[1],
      name: 'bob',
      friends: [personIds[0], personIds[2], personIds[3]]
    });
    persons.push({
      _id: personIds[2],
      name: 'joe',
      friends: [personIds[0], personIds[1], personIds[3]]
    });
    persons.push({
      _id: personIds[3],
      name: 'sally',
      friends: [personIds[0], personIds[1], personIds[2]]
    });

    Person.create(persons, function(err, docs) {

      var blogposts = [];
      blogposts.push({
        title: 'blog 1',
        tags: ['fun', 'cool'],
        author: personIds[3]
      });
      blogposts.push({
        title: 'blog 2',
        tags: ['cool'],
        author: personIds[1]
      });
      blogposts.push({
        title: 'blog 3',
        tags: ['fun', 'odd'],
        author: personIds[2]
      });

      BlogPost.create(blogposts, function(err, docs) {
        if (err) return done(err);
        /**
         * Populate the populated documents
         */

        var opts = {
          path: 'author.friends',
          select: 'name',
          options: { limit: 2 }
        }

        BlogPost.populate(docs, opts, function(err, docs) {
          var s = require('util').inspect(docs, { depth: null })
          return res.json(200, {
            'docs': docs,
            's': s
          });
        })
      })
    })
};

// Updates an existing example in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Example.findById(req.params.id, function (err, example) {
    if (err) { return handleError(res, err); }
    if(!example) { return res.send(404); }
    var updated = _.merge(example, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, example);
    });
  });
};

// Deletes a example from the DB.
exports.destroy = function(req, res) {
  Example.findById(req.params.id, function (err, example) {
    if(err) { return handleError(res, err); }
    if(!example) { return res.send(404); }
    example.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
'use strict';

var _ = require('lodash');
var Creator = require('./creator.model');

// Get list of creators
exports.index = function(req, res) {
  Creator.find().populate('user', '-salt -hashedPassword').exec(function (err, creators) {
    if(err) { return handleError(res, err); }
    return res.json(200, creators);
  });
};

// Get a single creator
exports.show = function(req, res) {
  Creator.findById(req.params.id, function (err, creator) {
    if(err) { return handleError(res, err); }
    if(!creator) { return res.send(404); }
    return res.json(creator);
  });
};

// Creates a new creator in the DB.
exports.create = function(req, res) {
  var creator = new Creator(req.body);
  creator.user = req.user;
  Creator.create(creator, function(err, creator) {
    if(err) { return handleError(res, err); }
    return res.json(201, creator);
  });
};

// Updates an existing creator in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Creator.findById(req.params.id, function (err, creator) {
    if (err) { return handleError(res, err); }
    if(!creator) { return res.send(404); }
    var updated = _.merge(creator, req.body);
    creator.updated = Date.now();
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, creator);
    });
  });
};

// Deletes a creator from the DB.
exports.destroy = function(req, res) {
  Creator.findById(req.params.id, function (err, creator) {
    if(err) { return handleError(res, err); }
    if(!creator) { return res.send(404); }
    creator.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
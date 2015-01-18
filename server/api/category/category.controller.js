'use strict';

var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var async = require('async');

var Category = require('./category.model');

// load parameters middleware
exports.load = function(req, res, next, id) {
  req.params.id = req.params.id.toLowerCase();
  next();
};

// Get list of categorys
exports.index = function(req, res) {
  Category.getChildrenTree(function (err, categories) {
    if(err) { return handleError(res, err); }
    return res.json(categories);
  });
};

// Get a single category
exports.show = function(req, res) {
  Category.findById(req.params.id, function(err, _category) {
    if(err) { return handleError(res, err); }
    if(!_category) return res.json([]);
    _category.getChildrenTree(function (err, categories) {
      return res.json(categories);
    });
  });
};

// Creates a new category in the DB.
exports.create = function (req, res) {
  if(!req.body.parent) {
    var category = new Category(req.body);
    category.save(function(err, category) {
      if(err) { return handleError(res, err); }
      return res.json(201, 'Category added!');
    });
  }

  Category.findById(req.body.parent, function (err, category) {
    if (err) { return handleError(res, err); }
    if(!category) { return res.send(404, 'Category not found!'); }

    var category = new Category(req.body);
    category.save(function(err, category) {
      if(err) { return handleError(res, err); }
      return res.json(201, 'Category added!');
    });
  });
};

// Updates an existing category in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Category.findById(req.params.id, function (err, category) {
    if (err) { return handleError(res, err); }
    if(!category) { return res.send(404); }
    var updated = _.merge(category, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, category);
    });
  });
};

// Deletes a category from the DB.
exports.destroy = function(req, res) {
  Category.findById(req.params.id, function (err, category) {
    if(err) { return handleError(res, err); }
    if(!category) { return res.send(404); }
    category.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
    if(err.name && err.name == 'ValidationError') {
        return res.json(422, err);
    }
    return res.send(500, err);
}
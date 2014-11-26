'use strict';

var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var async = require('async');

var Category = require('./category.model');

exports.load = function(req, res, next, id) {
  req.params.id = _.titleize(req.params.id);
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
  Category.findOne({_id:req.params.id}, function(err, _category) {
    if(err) { return handleError(res, err); }
    _category.getAncestors({}, "_id", function (err, categories) {
      var paths = categories.map(function(item){ 
        return item._id; 
      });
      paths.push(req.params.id);
      return res.json(paths);
    });
  });
};

// Creates a new category in the DB.
exports.create = function(req, res) {
  var programming = new Category({ _id: 'programming'});
  var languages   = new Category({ _id: 'languages'});
  var databases   = new Category({ _id: 'databases'});
  var php         = new Category({ _id: 'PHP'});
  var javascript  = new Category({ _id: 'Javascript'});
  var ruby        = new Category({ _id: 'ruby'});
  var mongoDB     = new Category({ _id: 'Mongo DB'});
  var mysql       = new Category({ _id: 'MySQL'});
  var oracle      = new Category({ _id: 'Oracle'});

  languages.parent = programming;
  databases.parent = programming;
  php.parent        = languages;
  javascript.parent = languages;
  ruby.parent = languages;
  mongoDB.parent = databases;
  mysql.parent   = databases;
  oracle.parent   = databases;

  programming.save(function(){
    languages.save(function(){
      php.save();
      javascript.save();
      ruby.save();
    });
    databases.save(function(){
      mongoDB.save();
      mysql.save();
      oracle.save();
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
  return res.send(500, err);
}
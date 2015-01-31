'use strict';

var _ = require('lodash');
var cloudinary = require('cloudinary').v2;

// Get list of cloudinarys
// http://cloudinary.com/documentation/admin_api#list_resources
// @example
// /api/cloudinary?public_ids=1|2|3|4|5&prefix=sample&next_cursor=asqw123
// /api/cloudinary?searchByTag=tagName
exports.index = function(req, res) {
  var query = req.query || {};
  var tag;
  if(query.searchByTag) {
    tag = query.searchByTag;
  }

  if(!_.isEmpty(query)) {
    query = _.chain(query).mapValues(function(value) {
      if(/\|/.test(value)) {
        value = value.replace(/\|/g, ',');
      }
      return value;
    }).omit('searchByTag').value();
  }

  var params = _.assign({ type: 'upload' }, query);
  var deferred = tag ? 
                  cloudinary.api.resources_by_tag(tag, params) :
                  cloudinary.api.resources(params);
  deferred
    .then(function(results) {
      return res.json(results);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};

// Get a single cloudinary
exports.show = function(req, res) {
  cloudinary.api.resource(req.params.id)
    .then(function(result) {
      res.json(result)
    });
};

// Creates a new cloudinary in the DB.
exports.create = function(req, res) {
  if(!req.files.images) return res.senf(500, { message: 'the image files is required' });

  var images = _.isArray(req.files.images) ? req.files.images : [req.files.images];
  var options = req.body;

  var q = async.queue(function(image, callback){
    cloudinary.uploader
      .upload(image.path, options)
      .then(function(result) {
        console.log('image uploaded', result);
        callback();
      })
      .catch(callback);
  });

  q.drain = function() {
    console.log('all images have been uploaded');
    return res.send(201);
  };

  q.push(images, function(err) {
    return res.send(500, err);
  });
  
};

// Updates an existing cloudinary in the DB.
exports.update = function(req, res) {
  var body = req.body;
  switch(req.query.action) {
    case 'rename':
      if(!body.name) return res.json(422, { message: 'new image name is required'});

      cloudinary.uploader.rename(req.params.id, body.name, { overwrite: true })
        .then(function(result){
          console.log('image renamed', result);
          return res.send(201);
        })
        .catch(function(err) {
          return handleError(res, err);
        });
      break;

    case 'image':
      if(!req.files.image) return res.json(422, { message: 'the new image file is required'});

      cloudinary.uploader.upload(req.files.image.path, { public_id: req.params.id, invalidate: true })
        .then(function(result){
          console.log('image updated', result);
          return res.send(200);
        })
        .catch(function(err) {
          return handleError(res, err);
        });
      break;

    default:
      return res.json(422, { message: 'invalid action' })
      break;
  }
};

// Deletes image single (public_id) / all (tags) on cloudinary
exports.destroy = function(req, res) {
  var deferred;
  if(req.query && req.query.by == 'tags') {
    deferred = cloudinary.api.delete_resources_by_tag(req.params.id);
  } else {
    var ids = req.params.id.split('|');
    deferred = cloudinary.api.delete_resources(ids);
  }
  deferred.then(function(result){
      console.log('image deleted', result);
      return res.send(204);
    }).catch(function(err) {
      return handleError(res, err);
    });
};

// add image tags on cloudinary
exports.addTag = function(req, res) {
  cloudinary.uploader.add_tag(req.body.tag, req.params.id)
    .then(function(result){
      console.log('tags added', result);
      return res.send(201);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};
// update image tags on cloudinary
exports.updateTag = function(req, res) {
  cloudinary.uploader.replace_tag(req.body.tag, req.params.id)
    .then(function(result){
      console.log('tags added', result);
      return res.send(204);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};
// delete image tags on cloudinary
exports.removeTag = function(req, res) {  
  cloudinary.uploader.remove_tag(req.params.tag, req.params.id)
    .then(function(result){
      console.log('tags removed', result);
      return res.send(204);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};

exports.hooks = function(req, res) {
  console.log('hooks', req.body);
};

function handleError(res, err) {
  return res.send(500, err);
}
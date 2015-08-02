'use strict';

var _ = require('lodash');
var async = require('async');
var cloudinary = require('cloudinary').v2;

/**
 * Get list resources
 * 
 * @see http://cloudinary.com/documentation/admin_api#list_resources
 *
 * @param {String} searchByTag  search by tag name
 * @param {String/Array} public_ids   list of public IDs. if string, separate by comma
 * @param {String} prefix       Find all resources that their public ID starts with the given prefix 
 * @param {String} direction    Control the order of returned resources.
 * @param {String} next_cursor  Next cursor, pagination.
 * @param {Number} max_results  Max number of resources to return. Default=10. Maximum=500.
 * @param {Boolean} tags        If true, include the list of tag names assigned each resource.
 * @param {Boolean} context     If true, If true, include key-value pairs of context associated with each resource.
 * @example
 * /api/cloudinary?public_ids=1,2,3,4,5&prefix=sample&next_cursor=asqw123
 * /api/cloudinary?searchByTag=tagName
 */
exports.index = function(req, res) {
  var query = req.query || {};
  var tag = query.searchByTag;

  if(!_.isEmpty(query)) {
    query = _.chain(query).mapValues(function(value) {
      if(/\|/.test(value)) {
        value = value.replace(/\|/g, ',');
      } else if(_.isArray(value)) {
        value = value.toString();
      }
      return value;
    }).omit('searchByTag').value();
  }

  var params = {
    type: 'upload',
    tags: true,
    context: true
  };
  _.assign(params, query);

  var deferred = tag ? 
                  cloudinary.api.resources_by_tag(tag, params) :
                  cloudinary.api.resources(params);
  deferred
    .then(function(results) {
      var q = async.queue(function(task, callback) {
        cloudinary.api.resource(task.public_id)
          .then(callback)
          .catch(deferred.reject);
      });
      q.drain = function(){
        return res.json(results);
      };
      _.each(results.resources, function(resource) {
        q.push(resource, function(result) {
          if( result.context ) {
            result.context.custom.title = result.public_id;
            result.context.custom.description = '';
            resource.context = result.context.custom;
          }
          resource.derived = {
            selected: null,
            data: result.derived
          };
        });
      });
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};

/**
 * Get details of a single resource / get list tags
 *
 * @see http://cloudinary.com/documentation/admin_api#details_of_a_single_resource
 *
 * @param {Sting} id req.params.id
 */
exports.show = function(req, res) {
  if(/^tags$/i.test(req.params.id)) {
    cloudinary.api.tags(req.query)
      .then(function(result) {
        return res.json(result);
      });
  } else {
    cloudinary.api.resource(req.params.id)
      .then(function(result) {
        return res.json(result);
      });
  }
};

/**
 * Upload image files
 */
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

/**
 * Update resource
 * @param  {String} req.query.action
 * @param  {Mixed} req.body
 * @param  {Files} req.files
 */
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

/**
 * Get list tags
 * @see http://cloudinary.com/documentation/admin_api#list_tags
 */
exports.listTags = function(req, res) {
  cloudinary.api.tags(function(result){
    return res.json(result);
  }, req.query);
};

/**
 * assigns a tag to a list of images
 *
 * @see http://cloudinary.com/documentation/node_image_upload#manage_tags
 * 
 * @param  {String} tag Tag name will be added
 * @param  {String} id public id
 */
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
/**
 * clears all tags from a given list of images
 *
 * @see http://cloudinary.com/documentation/node_image_upload#manage_tags
 * 
 * @param  {String} tag Tag name will be cleared
 * @param  {String} id public id
 */
exports.updateTag = function(req, res) {
  cloudinary.uploader.replace_tag(req.body.tag, req.params.id)
    .then(function(result){
      return res.send(200);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};
/**
 * clears the given tag from a list of images
 * 
 * @see http://cloudinary.com/documentation/node_image_upload#manage_tags
 * 
 * @param  {String} tag Tag name will be removed
 * @param  {String} id public id
 */
exports.removeTag = function(req, res) {  
  cloudinary.uploader.remove_tag(req.params.tag, req.params.id)
    .then(function(result){
      return res.send(204);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};

/**
 * Generate transformed versions of an uploaded image
 *
 * @see http://cloudinary.com/documentation/node_image_upload#refresh_images
 *
 * @param {String} id public id
 * @param {Object} eager transformations
 */
exports.addDerived = function(req, res){
  var data = _.assign({ 
    type: "upload", 
  }, { eager : req.body });
  cloudinary.uploader.explicit(req.params.id, data,
    function(result) { 
      return res.json(result) ;
    }, 
    function(err) {
      return handleError(res, err);
    });
};

/**
 * Delete derived resources
 *
 * @see http://cloudinary.com/documentation/admin_api#delete_derived_resources
 *
 * @param {String} ids derived ids (comma-separated)
 */
exports.deleteDerived = function(req, res){
  if(!req.query.ids) return res.send(422);

  var ids = req.query.ids.split(',');
  cloudinary.api.delete_derived_resources(ids)
    .then(function(result){
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
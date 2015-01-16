/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var async = require('async');
var _ = require('lodash');
var Product = require('./product.model');
var Category = require('../category/category.model');

exports.register = function(socket) {
	var getAll = function(done) {
		async.parallel({
			categories: function(callback) {
				Category.findById('products', function(err, _category) {
				    if(!_category) return callback(null, []);
				    _category.getChildrenTree(function (err, categories) {
				    	callback(null, categories);
				    });
			  	});
			},
			filters: function(callback) {
				Product.getFilters({}, function(err, results) {
			    	callback(null, results);
			  	});
			}
		}, done);
	};
  Product.schema.post('save', function (doc) {
  	getAll(function(err, results) {
  		var respond = _.assign({ doc: doc }, { data: results });
    	onSave(socket, respond);
  	});
  });
  Product.schema.post('remove', function (doc) {
  	getAll(function(err, results) {
  		var respond = _.assign({ doc: doc }, { data: results });
    	onSave(socket, respond);
  	});
  });
}

function onSave(socket, doc, cb) {
  socket.emit('product:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('product:remove', doc);
}
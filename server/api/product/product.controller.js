'use strict';

var _ = require('lodash');
var Product = require('./product.model');
// utils
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

// load parameters middleware
exports.load = function(req, res, next, id) {
    Product.load(id, function(err, product) {
        if (err) return next(err);
        if (!product) return res.send(404, 'product not found');
        req.product = product;
        next();
    });
};

// Get list of products
exports.index = function(req, res) {
    var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
    var perPage = 10;
    var options = {
        page: page,
        perPage: perPage
    };

    Product.list(options, function(err, products) {
        if (err) return handleError(res, err);
        return res.json(products);
    });
};

// Get a single product
exports.show = function(req, res) {
    return res.json(200, req.product);
};

// Creates a new product in the DB.
exports.create = function(req, res) {
    var images = null;
    
    var files = req.files;
    if(!_.isEmpty(files)) {
      images = _.isArray(files.images) ? files.images : [files.images]
    }

    var product = new Product(req.body);
    product.user = req.user;
    product.uploadAndSave(images, function(err, product) {
        if (err) return handleError(res, err);
        return res.json(201, product);
    });
};

// Updates an existing product in the DB.
exports.update = function(req, res) {
    if (req.body._id) {
        delete req.body._id;
    }

    var images = null;
    var files = req.files;
    if(!_.isEmpty(files)) {
      images = _.isArray(files.images) ? files.images : [files.images]
    }

    var product = _.merge(req.product, req.body);
    product.uploadAndSave(images, function(err, product) {
        if (err) return handleError(res, err);
        return res.json(200, product);
    });
};

// Deletes a product from the DB.
exports.destroy = function(req, res) {
    var product = req.product;
    
    product.remove(function(err) {
        if (err) {
            return handleError(res, err);
        }
        return res.send(204);
    });
};

function handleError(res, err) {
    if(err.name && err.name == 'ValidationError') {
        return res.json(422, err);
    }
    return res.send(500, err);
}
'use strict';

var _ = require('lodash');
var Product = require('./product.model');
// utils
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

// load parameters middleware
exports.load = function(req, res, next, id) {
    /**
     * filters
     */
    if(/^filters$/i.test(id)) {

        Product.getFilters(req.query, function(err, filters) {
            if (err) return next(err);
            if (!filters) return res.send(404, 'filters not exists');
            req.product = filters;
            next();
        });

    } else {

        Product.load(id, function(err, product) {
            if (err) return next(err);
            if (!product) return res.send(404, 'product not exists');
            req.product = product;
            next();
        });
    }
};

/**
 * Get list of products
 * @example
 * http://localhost:9000/api/products?
 *     q=moto&
 *     q[category]=phones&q[title]=moto&q[body]=moto&q[operator]=and&
 *     q[brand][]=htc&q[brand][]=motorola&q[os]=android+1.5&q[camera][lte]=3&q[camera][gte]=4&q[flash][]=512&q[flash][]=768&
 *     select=-tags|-reviews|-meta&
 *     category=phones&
 *     sort=createdAt|-rates
 */
exports.index = function(req, res) {
    Product.list(req.query, function(err, products) {
        if (err) return handleError(res, err);
        return res.json(products);
    });
};

// Get a single product
exports.show = function(req, res) {
    return res.json(req.product);
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

/* Reviews */

exports.loadReview = function(req, res, next, id) {
    var product = req.product;
    var review = product.reviews.id(id);
    if (!review) return res.send(404, 'review not found');
    req.review = review;
    next();
};

// Get list of reviews 
exports.showReviews = function(req, res) {
    // page
    var page = req.query.page,
        ppage = (page && page > 0 ? page : 1 ) - 1;

    var perPage = 3,
        skip = ppage > 0 ? (ppage * perPage) : 0,
        limit = perPage + skip;

    var options = {
        sort: { "reviews.createdAt": -1 },
        page: ppage + 1,
        perPage: perPage,
        skip: skip,
        limit: limit
    };

    Product.getReviews(req.params.id, options, function(err, reviews) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(reviews);
    });
};

// Create a new product review in the DB
exports.addReview = function(req, res) {
    var product = req.product;
    var user = req.user;

    product.addReview(user, req.body, function(err, respond) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(201, respond);
    });
};

// Remove a product review in the DB
exports.removeReview = function(req, res) {
    var product = req.product;
    product.removeReview(req.reviewId, function(err) {
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
    else if(err.message) {
        return res.json(404, err.message);
    }
    return res.send(500, err);
}
'use strict';

var _ = require('lodash');
var Product = require('./product.model');
// utils
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

// load parameters middleware
exports.load = function(req, res, next, id) {
    // id.match /^[0-9a-fA-F]{24}$/
    Product.load(id, function(err, product) {
        if (err) return next(err);
        if (!product) return res.send(404, 'product not found');
        req.product = product;
        next();
    });
};

/**
 * Get list of products
 * @example
 * http://localhost:9000/api/products?
 *     select=-tags|-reviews|-meta&
 *     q=moto&operator=and&
 *     category=phones&
 *     sort=createdAt|-rates
 */
exports.index = function(req, res) {
    var serializer ='data';
    var fields = _.xor(_.keys(Product.schema.paths), ['_id', '__v']);

    var query = req.query;

    // query operator
    var operator = query.operator ? '$' + query.operator.toLowerCase() : '$or';

    // queries
    var queries = {};

    queries.match = {};
    var _query = [];
    if(query.q) {
        if(_.isString(query.q)) {
            _.forEach(['title', 'body'], function(item) {
                var obj = {};
                obj[item] = { $regex: query.q, $options:'i' };
                _query.push(obj);
            });
        } else {
            // _query = _.map(query.q, function(value, k) { 
            //     var obj = {}; 
            //     obj[k] = { $regex: value, $options:'i' }; 
            //     return obj;  
            // });
            _query = _.mapValues(query.q, function(value) { 
                return { $regex: value, $options:'i' };  
            });
        }
        queries.match[operator] = _query; 
    }

    if(query.category) {
        queries.match['category'] = _.isString(query.category) ? [query.category] : query.category;
    }

    // select
    queries.select = {};
    var exclude = [];
    if(query.select) {
        if(_.isString(query.select)) {
            var _select = query.select.replace(/\s/g, '').split('|');
            exclude = _.map(
                _.filter(_select, function(item) { return /^\-/.test(item) }),
                function(item) { 
                    return item.replace('-', ''); 
                }
            );
        } else {
            _.forEach(query.select, function(v, k){
                if(v == '-1') exclude.push(k);
            });
        }
    } else {
        exclude = ['meta', 'reviews'];
    }

    var select = _.xor(fields, exclude);
    _.forEach(select, function(item) {
        queries.select[item] = '$'+item; 
    });

    // sort
    if(query.sort) {
        var sort = query.sort.replace(/\s/g, '').split('|');

        var sorts = {};
        _.forEach(sort, function(item) {
            var key = /rates/.test(item) ? item : serializer+'.'+item ;
            sorts[key.replace('-', '')] = /^\-/.test(item) ? -1 : 1 ;
        });
        queries.sort = sorts
    }

    // page
    var page = query.page;
    var ppage = (page && page > 0 ? page : 1 ) - 1;
    var perPage = 10;
    queries.skip = 0;
    if(ppage > 0) {
        queries.skip = ppage * perPage;
    }
    queries.limit = queries.skip + perPage;

    var options = _.assign({
        sort: {
            'data.createdAt': -1,
            'rates': -1
        }
    }, queries);

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
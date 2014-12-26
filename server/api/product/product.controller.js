'use strict';

var _ = require('lodash');
var Product = require('./product.model');
// utils
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Build match filters aggregation from query
 *
 * @example
 * api/products?
 *     q[all]=aria&
 *     q[brand]=htc&
 *     q[os]=android+2.1&
 *     q[display][gte]=3&q[display][lte]=4&
 *     q[camera][gte]=4&q[camera][lte]=5&
 *     q[flash][gte]=256&q[flash][lte]=512&
 *     q[ram][gte]=256&q[ram][lte]=512
 *
 * booleanFilters {Object} - $or, $and, $not
 *     all - [title, body, meta.description] or
 *     q[title]=bla&q[body]=foo&q[price]=99@q[operator]=and
 * brand {String | Object}
 * os {String | Object}
 * display {Object} - lt, lte, gte, gt
 * camera {Object} - lt, lte, gte, gt
 * flash {Object} - lt, lte, gte, gt
 * ram {Object} - lt, lte, gte, gt
 */
var buildMatchFilters = function(query) {

    if(_.isEmpty(query)) return null;

    var booleanFilter, comparisonFilter, filters = {};
    var booleanOperator = query.operator ? '$'+ query.operator.toLowerCase() : '$or' ;
    var booleanFields = ['title', 'body', 'meta.description'];
    var excludeFields = ['operator'];

    var metaFields = {
        'os': 'meta.android.os',
        'camera': 'meta.camera.primary',
        'display': 'meta.display.screenSize',
        'flash': 'meta.storage.flash',
        'ram': 'meta.storage.ram'
    };
    var filterFields = _.chain(query)
                        .pick(function(value, key) {
                            return _.indexOf(excludeFields, key) == -1;
                        })
                        .transform(function(result, value, key) {
                            var metaKeys = _.keys(metaFields);
                            if(key == 'all' || isNumeric(key)) {
                                if(_.isArray(value)) value = value[0];

                                result['title'] = value;
                                result['body'] = value;
                                result['meta.description'] = value;
                                delete result[key];
                            } else {
                                var index = _.indexOf(metaKeys, key);
                                if(index > -1){
                                    key = metaFields[metaKeys[index]];
                                }
                                result[key] = value;
                            }
                        })
                        .transform(function(result, value, key) {
                            var isCategory = /category/i.test(key);

                            var newValue;
                            if(_.isString(value)) {
                                newValue = isCategory ? value : isNumeric(value) ? parseInt(value) : { $regex: _.humanize(value), $options:'i' };
                            }
                            else if(_.isPlainObject(value)) {
                                newValue = _.transform(value, function(result, value, key) {
                                    result['$'+key] = isNumeric(value) ? parseFloat(value) : value ;
                                });
                            } 
                            else {
                                var regexValues = _.map(value, function(val){
                                    var regex = isNumeric(val) ? parseInt(val) : (isCategory ? val : new RegExp(_.humanize(val), 'i'));
                                    return regex;
                                });
                                newValue = { $in: regexValues };
                            }
                            result[key] = newValue;
                        })
                        .value();
    // pick boolean filter ($or, $and)
    // @return Array
    booleanFilter = _.chain(filterFields)
                        .pick(function(value, key) {
                            return _.indexOf(booleanFields, key) > -1;
                        })
                        .map(function(item, key) {
                            var obj = {};
                            obj[key] = item;
                            return obj;
                        })
                        .value();
    // pick comparison filter ($gt, $gte, $lt, $lte)
    // @return Object
    comparisonFilter = _.pick(filterFields, function(value, key) {
        return _.indexOf(booleanFields, key) == -1;
    });

    if(!_.isEmpty(booleanFilter)) {
        filters[booleanOperator] = booleanFilter;
    }
    
    return _.assign(filters, comparisonFilter);
}

// load parameters middleware
exports.load = function(req, res, next, id) {
    /**
     * filters
     */
    if(/^filters$/i.test(id)) {

        var filters = buildMatchFilters(req.query.q);

        Product.getFilters(filters, function(err, filters) {
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
    var serializer ='data';
    var fields = _.xor(_.keys(Product.schema.paths), ['_id', '__v']);

    var query = req.query;

    // queries
    var queries = {};
    
    queries.filters = buildMatchFilters(query.q);

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
            'createdAt': -1,
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

function handleError(res, err) {
    if(err.name && err.name == 'ValidationError') {
        return res.json(422, err);
    }
    return res.send(500, err);
}
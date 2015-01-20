'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Category = require('../category/category.model');
var User = require('../user/user.model');

var glob = require('glob');
var fs = require('fs');
var config = require('../../config/environment');

var async = require('async');
var _ = require('lodash');

var Imager = require('imager'),
    imagerConfig = require('../../config/imager');

var localURI = '/images/phones', 
    localPath = config.root + '/client/images/phones';

_.str = require('underscore.string');
_.mixin(_.str.exports());

var setTags = function(tags) {
    return _.isString(tags) ? _.map(tags.split(','), function(tag){
        return tag.trim();
    }) : tags ;
};

var ProductSchema = new Schema({
    category: {
        type: String,
        ref: 'Category',
        required: 'Category cannot be blank'
    },
  	title: {
        type: String,
        default: '',
        trim: true,
        required: 'Title cannot be blank'
    },
    slug: {
        type: String,
        lowercase: true,
        default: ''
    },
    body: String,
  	brand: String,
  	image: String,
    price: {
        type: Number,
        default: 0
    },
    stock: Number,
    reviews: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        body: {
            type: String,
            default: '',
            required: 'Comment cannot be blank'
        },
        rate: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    meta: {
        type: Schema.Types.Mixed,
        set: function(meta) {
            return _.isString(meta) ? JSON.parse(meta) : meta ;
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    __v: {type: Number, select: false}
});

/**
 * Post Init
 */

ProductSchema.post( 'init', function() {
    this._original = this.toObject();
});

/**
 * Pre/Post save hook
 */

ProductSchema.pre('save', function(next) {
    var self = this;

    async.series({
        /** create slug **/
    	slug: function(done) {
            self.slug = _.slugify(self.title);
    		done(null, 'created');
    	},
        /** increase in number of categories **/
        category: function(done){
            // return is new / update unchanged category
            if (!self.isModified('category')) {
                return done(null, 'unchanged');
            } 

            // set increment categories count
            Category.setCount({
                category: self.category,
                value: 1
            }, function(err) {
                if (err) done(err);
                done(null, 'changed');
            });
        },
        /** remove old meta images **/
        image: function(done){
            var original = self._original;
            var oldImages = original && original.meta && _.has(original.meta, 'images') ? original.meta.images : {} ;
            var newImages = self.meta && _.has(self.meta, 'images') ? self.meta.images : {} ;

            // console.log('pre:save:images', oldImages, newImages);

            var imagesChanged = _.isEmpty(oldImages) || _.isEmpty(newImages) ? false : _.difference(oldImages.files, newImages.files).length > 0 ; 
            // is new / update : unchanged image
            if (self.isNew || !imagesChanged) {
                return done(null, 'unchanged');
            }

            var q = async.queue(function (file, callback) {
                var pattern = localPath + '/*' + file;
                glob(pattern, {}, function(err, files) {
                    if(err) return callback(err);
                    async.each(files, function(file, _callback) {
                        // unlink image
                        fs.unlink(file, function (err) {
                          if (err) _callback(err);
                          _callback();
                        });
                    }, function(err){
                        if( err ) return callback(err); 
                        callback();
                    });
                });
            });
            // assign a callback
            q.drain = function() {
                done(null, 'images deleted');
            }
            q.push(oldImages.files, function (err) {
                if(err) return done(err);
            });
        }
    },
    // optional callback
    function(err, results){
        if (err) return next(err);
        // console.log('pre:save', results);
        next();
    });
});

ProductSchema.post('save', function(doc) {
    var self = this;

    if(!this._original) return;

    var oldCategory = this._original.category, 
        category = this.category;
            
    // set decrement previous categories count
    if (oldCategory && !_.isEqual(oldCategory, category)) {
        Category.setCount({
            category: oldCategory,
            value: -1
        }, function(err) {
            if (err) {
                return res.json(500, 'Error set decrement count on previous category : ' + self._category);
            }
        });
    }
});

/**
 * Pre remove hook
 */

ProductSchema.pre('remove', function(next) {
    var self = this;

    async.series({
        /** decrease in number of categories **/
        category: function(done){
            if (!self.category) {
                return done(null, 'the category is empty');
            } 

            // set increment categories count
            Category.setCount({
                category: self.category,
                value: -1
            }, function(err) {
                if (err) done(err);
                done(null, 'decrement');
            });
        },
        /** remove images **/
        image: function(done){
            var images = self.meta.images;

            // is new / update image unchanged
            if (!images && images.length == 0) {
                return done(null, 'the images are empty');
            }

            // console.log('pre:remove:delete', self.meta.images);

            var q = async.queue(function (file, callback) {
                var pattern = localPath + '/*' + file;
                // console.log('remove:images', pattern);
                glob(pattern, {}, function(err, files) {
                    if(err) return callback(err);
                    async.each(files, function(file, _callback) {
                        // unlink image
                        fs.unlink(file, function (err) {
                          if (err) _callback(err);
                          _callback();
                        });
                    }, function(err){
                        if( err ) return callback(err); 
                        callback();
                    });
                });
            });
            // assign a callback
            q.drain = function() {
                done(null, 'images deleted');
            }
            q.push(images.files, function (err) {
                if(err) return done(err);
            });
        }
    },
    // optional callback
    function(err, results){
        if (err) return next(err);
        // console.log('pre:remove', results);
        next();
    });
});

/**
 * Methods
 */

ProductSchema.methods = {

    uploadAndSave: function(images, cb) {
        var self = this;

        if ( !images ) return self.save(cb);

        imagerConfig.storage.Local.path = 'client/images/phones';

        var imager = new Imager(imagerConfig, 'Local');
        imager.upload(images, function(err, cdnUri, files) {
            if (err) {
                return cb(err);
            }

            if (files.length) {
                var meta = self.meta || {};

                var url = cdnUri || localURI;
                var images = {
                    cdnUri: url,
                    files: files
                };

                self.image = url + '/preview_' + files[0];
                self.meta = {};
                self.meta = _.assign(meta, { images: images });
            } 

            self.save(cb);
        }, 'product');
    },

    addReview: function(user, review, cb) {
        this.reviews.push({
            rate: review.rate,
            body: review.body,
            user: user._id
        });

        this.save(function(err, product){
            if(err) return cb(err);
            var lastReview = product.reviews[product.reviews.length - 1];
            User.findById(lastReview.user, '_id name email', function(err, user) {
                lastReview.user = user;
                cb(null, lastReview);
            });
        });
    },

    /**
     * Remove a review
     *
     * @example
     * db.products.update(
     *      { _id: ObjectId( "4f8dcb06ee21783d7400003c" )}, 
            { 
                $pull: {
                    reviews: { _id: ObjectId( "4f8dfb06ee21783d7134503a" ) }
                }
            }
        )
     *     
     * @param  {Integer}   reviewId - Review ID
     * @param  {Function}  cb       - Callback after review removed
     */
    removeReview: function(reviewId, cb) {
        var index = _.indexOf(this.reviews, {
            id: reviewId
        });
        if (index) {
            this.reviews.splice(index, 1);
        } else {
            return cb({message: 'review not found'});
        }
        this.save(cb);
    }
};

/**
 * Statics
 */

var isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};


var ObjectId = require('mongoose').Types.ObjectId;
ProductSchema.statics = {

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
     *     q[ram][gte]=256&q[ram][lte]=512&
     *     q[price][gte]=0&q[price][lte]=100
     *
     * - booleanFilters {Object} - $or, $and, $not
     *     all - [title, body, meta.description] or
     *     q[title]=bla&
     *     q[body]=foo&
     *     q[operator]=and
     * - brand {String | Object}
     * - os {String | Object}
     * - display {Object} - lt, lte, gte, gt
     * - camera {Object} - lt, lte, gte, gt
     * - flash {Object} - lt, lte, gte, gt
     * - ram {Object} - lt, lte, gte, gt
     */
    buildFilters: function(query) {
        var self = this;

        var filters = {
            build: function(query) {
                var _this = this;

                this.query = query;
                this.filters = {};

                var fn = ['match', 'fields', 'sort', 'limit', 'skip'];
                _.forEach(fn, function(v) {
                    _this[v]();
                });

                return this.filters;
            },
            match: function() {
                var query = this.query;

                var match;
                if( query.q ) {
                    match = {};

                    var booleanFilter, comparisonFilter;
                    var booleanOperator = function() {
                        var defaultOp = '$or';
                        if(query.q.operator) {
                            var op = query.q.operator.toLowerCase();
                            return _.indexOf(['or', 'and', 'not'], op) == -1 ? defaultOp : '$' + op ;
                        }
                        return defaultOp;
                    }();
                    var booleanFields = ['title', 'body', 'meta.description'];
                    var excludeFields = ['operator'];

                    var metaFields = {
                        'os': 'meta.android.os',
                        'camera': 'meta.camera.primary',
                        'display': 'meta.display.screenSize',
                        'flash': 'meta.storage.flash',
                        'ram': 'meta.storage.ram'
                    };

                    // set filter fields
                    var filterFields = _.chain(query.q)
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
                        match[booleanOperator] = booleanFilter;
                    }
                }
                
                this.filters.match = _.assign(match, comparisonFilter);
            },
            fields: function() {
                var query = this.query;

                var exclude = ['meta', 'reviews'];
                if( query.select ) {
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
                } 

                var selectedFields = _.xor(_.keys(self.schema.paths), ['_id', '__v']),
                    fields = {};
                _.forEach(_.xor(selectedFields, exclude), function(item) {
                    fields[item] = '$'+item; 
                });

                this.filters.fields = fields;
            },
            sort: function() {
                var query = this.query;

                var serializer = this.query.serializer || 'data';

                var sort;
                if( query.sort ) {
                    sort = {};
                    var _sort = query.sort.replace(/\s/g, '').split('|');

                    _.forEach(_sort, function(item) {
                        var key = /rates/.test(item) ? item : serializer+'.'+item ;
                        sort[key.replace('-', '')] = /^\-/.test(item) ? -1 : 1 ;
                    });
                }

                this.filters.sort = sort;
            },
            limit: function() {
                this.filters.limit = this.query.show || 12;
            },
            skip: function() {
                var skip = 0;

                var page = this.query.page;
                var ppage = (page && page > 0 ? page : 1 ) - 1;
                if(ppage > 0) {
                    skip = ppage * this.filters.limit;
                }
                _.assign(this.filters, {
                    skip: skip,
                    page: page,
                });
            }
        };

        return filters.build(query);
    },

    /**
     * get product reviews
     * @example
        db.products.aggregate( [
            {$match: {_id: new ObjectId("549311c9ae47c02c1204a7fd")}},
            {$project:{_id:1, reviews:1, total:{$size:'$reviews'}}},
            {$unwind: "$reviews"},
            {$sort: { "reviews.createdAt":-1 }},
            {$limit: 2},
            {$group: {_id:"$_id", reviews: {$push:"$reviews"}, total:{ $first:'$total' }}},
            {
                    $project: {
                        total: 1,
                        limit: { $literal: options.limit },
                        skip: { $literal: options.skip },
                        pages: { $divide: ['$total', options.limit] },
                        currentPage: { $literal: options.page },
                        perPage: { $literal: options.limit },
                        data: '$reviews'
                    }
            }
        ]);
     *
     */
    getReviews: function(id, options, done) {
        // return done(options);
        var aggregate = [{
            $match: { _id: new ObjectId(id) }
        }, { 
            $project: {
                _id: 0, 
                reviews:1, 
                total: { $size:'$reviews' }
            }
        }, {
            $unwind: "$reviews"
        }, {
            $sort: options.sort
        }, {
            $limit: options.limit
        }, {
            $skip: options.skip
        }, {
            $group: {
                _id: "$_id",
                reviews: { $push: "$reviews" }, 
                total:{ $first:'$total' }
            }
        }, {
            $project: {
                _id: 0,
                total: 1,
                limit: { $literal: options.limit },
                skip: { $literal: options.skip },
                pages: { $divide: ['$total', options.perPage] },
                currentPage: { $literal: options.page },
                perPage: { $literal: options.perPage },
                data: '$reviews'
            }
        }];
        this.aggregate(aggregate, function(err, results) {
            if(err) return done(err);
            if(_.isEmpty(results)) {
                return done({message: 'Review not found'});
            }

            async.each(results[0].data, function(review, callback){
                User.findById(review.user, '_id name email', function(err, user) {
                    review.user = user;
                    callback();
                });
            }, function(err) {
                if(err) return done(err);
                return done(null, results.pop());
            });
        });
    },

    /**
     * get all brands
     *
        db.products.aggregate([
            { $group : { _id : {$toLower:"$brand"}, brand:{$first:"$brand"}, total : { $sum : 1 } } },
            { $project: { _id: "$_id", brand: 1, total: 1 } },
            { $sort : { _id: 1 } }
        ]);
     *
     * get price
     *
        db.products.aggregate([
            { $match: { $and : [{price: {$exists:true} }, {price: {$ne:0}}] }},
            { $group: { 
                 _id: 0,
                min: { $min:"$price" },
                max: { $max:"$price" }
            }}
        ])
     *
     * get all storage ram (phones)
     *
        db.products.aggregate([
            { $match: { category:"phones", "meta.storage.ram": {$exists:true} } },
            { $group : { _id: "$meta.storage.ram", total : { $sum : 1 } }},
            { $project: { _id: 0, ram: '$_id', total: 1 } }
        ])
     *
     * get all storage flash (phones)
     *
        db.products.aggregate([
            { $match: { category:"phones", "meta.storage.flash": {$exists:true} } },
            { $group : { _id: "$meta.storage.flash", total : { $sum : 1 } }},
            { $project: { _id: 0, flash: '$_id', total: 1 } }
        ])
     *
     * get all display size (phones)
     *
        db.products.aggregate([
            { $match: { category:"phones", "meta.display.screenSize": {$exists:true} } },
            { $group : { _id: "$meta.display.screenSize", total : { $sum : 1 } }},
            { $project: { _id: 0, display: { $substr: ["$_id", 0, 3] }, total: 1 } }
        ])
     *
     * get all camera (phones)
     *
        db.products.aggregate([
            { $match: { category:"phones", "meta.camera.primary": {$exists:true} } },
            { $group : { _id: "$meta.camera.primary", total : { $sum : 1 } }},
            { $project: { _id: 0, camera: { $substr: ["$_id", 0, 3] }, total: 1 } }
        ])
     *
     * get all os (phones)
     *
        db.products.aggregate([
            { $match: { category:"phones", "meta.android.os": {$exists:true} } },
            { $group : { _id: "$meta.android.os", total : { $sum : 1 } }},
            { $project: { _id: 0, os: '$_id', total: 1 } }
        ])
     *
     */
    getFilters: function(query, done) {
        var self = this;

        self.custom = {
            range: function(data, title) {
                var min = Math.round(_.min(data, 'name').name);
                var max = Math.round(_.max(data, 'name').name);

                if(data.length == 1) {
                    var gte = min-1, lte = max;
                    var range = _.filter(data, function(item) { return item.name >= gte && item.name <= lte; });
                    if(range.length) {
                        var total = 0;
                        _.forEach(range, function(item) { total += item.total; })
                        return [
                            {
                                total: total,
                                name : gte + ' ' + title + ' - ' + lte + ' ' + title,
                                value: {
                                    gte: gte,
                                    lte: lte
                                }
                            }
                        ];
                    }
                    return [];
                }

                var results = [];

                var before = _.filter(data, function(item) { return item.name < min; });
                if(before.length) {
                    var total = 0;
                    _.forEach(before, function(item) { total += item.total; })
                    results.push({
                        total: total,
                        name : "Less than " + min + title,
                        query: '-' + min,
                        value: {
                            lt: min
                        }
                    });
                }

                for (var i = min; i < max; i++) {
                    var gte = i , lte = i + 1;
                    var range = _.filter(data, function(item) { return item.name >= gte && item.name <= lte; });
                    if(range.length) {
                        var total = 0;
                        _.forEach(range, function(item) { total += item.total; });

                        var name = title.length > 3 ? gte + ' to ' + lte + ' (' + title +')' : gte + title + ' to ' + lte + title
                        results.push({
                            total: total,
                            name : name,
                            query: gte + '-' + lte,
                            value: {
                                gte: gte,
                                lte: lte
                            }
                        });
                    }
                };

                var after = _.filter(data, function(item) { return item.name > max; });
                if(after.length) {
                    var total = 0;
                    _.forEach(after, function(item) { total += item.total; })
                    results.push({
                        total: total,
                        name: "Greater than " + max + title,
                        query: max.toString(),
                        value: {
                            gt: max
                        }
                    });
                }

                return results;
            },
            sort: function(data) {
                var self = this;

                if(!data.length) return data;

                var results = [];

                var min = 256;
                var max = _.max(data, 'name').name;

                var mb = _.chain(_.range(1, Math.round(max/1024))).map(function(v){ return v * 1024  }).union([256,512]).value();
                mb.sort(function(a,b){return a - b});

                var before = _.filter(data, function(item) { return item.name < min; });
                if(before.length) {
                    var total = 0;
                    _.forEach(before, function(item) { total += item.total; })
                    results.push({
                        total: total,
                        name : "Less than " + self.gb(min),
                        query: '-' + min,
                        value: {
                            lt: min
                        }
                    });
                }

                var last = 0;
                for (var i = 0; i < mb.length; i++) {
                    var gte = mb[i], lte = mb[(i + 1)];
                    var range = _.filter(data, function(item) { return item.name >= gte && item.name <= lte; });
                    if(range.length) {
                        last = lte;
                        
                        var total = 0;
                        _.forEach(range, function(item) { total += item.total; })

                        results.push({
                            total: total,
                            name : self.gb(gte) + ' to ' + self.gb(lte),
                            query: gte + '-' + lte,
                            value: {
                                gte: gte,
                                lte: lte
                            }
                        });
                    }
                };

                var after = _.filter(data, function(item) { return item.name > last; });
                if(after.length) {
                    var total = 0;
                    _.forEach(after, function(item) { total += item.total; })
                    results.push({
                        total: total,
                        name: "Greater than " + self.gb(last),
                        query: last.toString(),
                        value: {
                            gte: last
                        }

                    });
                }

                return results;
            },
            gb: function(value) {
                var gb = value / 1024;
                return gb >= 1 ? gb + ' GB' : value + ' MB';
            },
            unflatten: function( array, parent, tree ){
                var self = this;
                tree = typeof tree !== 'undefined' ? tree : [];
                parent = typeof parent !== 'undefined' ? parent : { _id: 'products' };
                    
                var children = _.filter( array, function(child){ return child.parent == parent._id; });
                
                if( !_.isEmpty( children )  ){
                    if( parent._id == 'products' ){
                       tree = children;   
                    }else{
                       parent['children'] = children
                    }
                    _.each( children, function( child ){ self.unflatten( array, child ) } );                    
                }
                
                return tree;
            }
        };

        var queries = self.buildFilters(query);
        var match = queries.match;
        async.auto({
            filters: function(callback) {
                if(!_.has(match, 'category')) return callback(null, queries);

                var categories = _.isString(match.category) ? match.category : match.category['$in'];
                Category.getPathDescendants(categories, function(err, data) {
                    if(err) return callback(err);
                    if(data.length > 0) {
                        queries.match.category = { $in: data };
                    }
                    return callback(null, queries);
                });
            },
            category: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return k != 'category'; });
                var aggregate = [
                    { $match: filters },
                    { $group : { _id : "$category", total : { $sum : 1 } } },
                    { $sort : { _id: 1 } }
                ];
                self.aggregate(aggregate, callback);
            }],
            brands: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return k != 'brand'; });
                var aggregate = [
                    { $match: filters },
                    {
                        $group: {
                            _id: { $toLower: "$brand" },
                            name: { $first: "$brand" },
                            total: { $sum: 1 }
                        }
                    }, 
                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            name : 1,
                            total: 1,
                            selected: { $literal: false }
                        }
                    }, 
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results){
                    var brands = _.map(results, function(item) {
                        item.name = _.titleize(item.name);
                        item.id = _.slugify(item.id);
                        return item;
                    });

                    callback(err, brands);
                });
            }],
            price: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return k != 'price'; });
                var match = _.assign({ $and : [{price: {$exists:true} }, {price: {$ne:0}}] }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { 
                         _id: 0,
                        min: { $min:"$price" },
                        max: { $max:"$price" },
                        avg: { $avg:"$price" },
                        sum: { $sum:"$price" }
                    }},
                    { $project: { _id: 0, min: 1, max: 1, avg: 1, sum: 1, step: { $literal: 1 } } },
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    results = (_.isEmpty(results)) ? { min:0, max: 0, step: 1 } : results.pop() ;
                    callback(null, results);
                });
            }],
            os: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return !/os/.test(k); });
                var match = _.assign({ "meta.android.os": { $exists:true } }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.android.os", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: '$_id', total: 1, value:{ $toLower:'$_id' } } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, callback);
            }],
            /*os: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return !/os/.test(k); });

                var defaultFilter = { 
                    $or: [
                        // os_provided
                        { 
                            $and: [
                                {"meta.features.os_provided": { $exists: true, $not: { $size: 0 } }},
                                {"meta.features.os_provided.value": { $not: /\:|yes/i }}
                            ]
                        },
                        // operating_system
                        {
                            $and: [
                                {"meta.features.operating_system": { $exists: true }},
                                {"meta.features.operating_system.value": { $not: /\:|yes/i }}
                            ]                        
                        },
                        // operatingsystem
                        {
                            "meta.operatingsystem": { $exists:true, $ne: null }                            
                        }
                    ]
                };
                var match = _.assign(defaultFilter, filters);
                var aggregate = [
                    { $match: match },
                    { $project: { 
                            _id: 1, 
                            category:1,
                            title:1, 
                            os: { 
                                $cond: { 
                                    if: { $eq: ["$meta.features.os_provided", []] }, 
                                    then: {
                                        $cond: { 
                                            if: { $eq: ["$meta.features.operating_system", []] }, 
                                            then: "$meta.operatingsystem",
                                            else: "$meta.features.operating_system.value"
                                        }
                                    },
                                    else: "$meta.features.os_provided.value"
                                }
                            }
                        } 
                    },
                    { $group : { _id: "$os", total: { $sum: 1 } } },
                    { $project: { _id: 0, name: "$_id", total: 1 } },
                    { $sort: { name: 1, total: 1 }}
                ];
                self.aggregate(aggregate, function(err, results){
                    if(err) return callback(err);
                    var os = _.map(results, function(item){ 
                        if(_.isArray(item.name)) {
                            item.name = item.name[0]; 
                        }
                        item.value = item.name.toLowerCase();
                        return item; 
                    });
                    callback(null, os);
                });
            }],*/
            camera: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return !/camera/.test(k); });
                var match = _.assign({ "meta.camera.primary": { $exists:true } }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.camera.primary", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: "$_id", total: 1 } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    var camera = self.custom.range(results, 'megapixels');
                    callback(null, camera);
                });
            }],
            display: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return !/display/.test(k); });
                var match = _.assign({ "meta.display.screenSize": { $exists:true } }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.display.screenSize", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: "$_id", total: 1 } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    var display = self.custom.range(results, '"');
                    callback(null, display);
                });
            }],
            flash: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return !/flash/.test(k); });
                var match = _.assign({ "meta.storage.flash": { $exists:true } }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.storage.flash", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: '$_id', total: 1 } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    var flash = self.custom.sort(results);
                    callback(null, flash);
                });
            }],
            ram: ['filters', function(callback, results) {
                var filters = _.pick(results.filters.match, function(v, k){ return !/ram/.test(k); });
                var match = _.assign({ "meta.storage.ram": { $exists:true } }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.storage.ram", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: '$_id', total: 1 } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    var ram = self.custom.sort(results);
                    callback(null, ram);
                });
            }]
        }, done);
    },
    
    /* ============================================================================================= */

    /**
     * get all os
     *
        db.products.aggregate([
            //{ $match: { category:'phones', "meta.operatingsystem": { $ne:null} } },
            { $match: { category:'phones', "meta.features.operating_system": {$exists:true} } }
            //{ $group : { _id: '$meta.operatingsystem', total : { $sum : 1 } } },
            { $group : { _id: '$meta.features.operating_system.value', total : { $sum : 1 } } },
            { $project: { _id: 1, total: 1 } }
        ])
     *
     * get all clock_speed
     *
        db.products.aggregate([
            { $match: { category:'phones', "meta.features.clock_speed": {$exists:true} } },
            { $group : { _id: "$meta.features.clock_speed.value", total : { $sum : 1 } }},
            { $project: { _id: 1, total: 1 } }
        ])
     *
     */

    load: function(id, done) {
        var skip = 0, limit = 5;
        var query = { _id: id };
        var projection = {
            reviews: {
                $slice: [skip, limit]
            }
        };

        if(!/^[0-9a-fA-F]{24}$/.test(id)) {
            query = { slug:id };
        }
        this.findOne(query/*, projection */)
            .populate('reviews.user', 'name email')
            .exec(done);
    },

    list: function(query, done) {
        var self = this;

        var filters = self.buildFilters(query);
        var match = filters.match;
        if( match && match.category ) {
            return Category.getPathDescendants(match.category, function(err, data) {
                if(err) return done(err);
                if(data.length > 0) {
                    filters.match.category = { $in: data };
                }
                return self.query(filters, done);
            });
        } 

        self.query(filters, done);
    },

    /**
     * 
    db.products.aggregate([
        { $group: { _id:1, data: { $push: '$$ROOT' }, total: { $sum: 1 } } },
        {
            $unwind: "$data"
        },
        {
            $unwind: "$data.reviews"
        },
        {
            $group:
            {
                _id: "$data._id", 
                title: { $first: '$data.title' },
                image: { $first: '$data.image' },
                rate:
                {
                    $sum: "$data.reviews.rate"
                },
                review:
                {
                    $sum: 1
                },
                total: { $first: '$total' } 
            }
        },
        { $skip: 4 }, // skip = (page -1) * limit
        { $limit: 6 }, // skip = limit
        { $sort: { 'title': 1 } },
        { $group: { _id:0, data: { $push: { _id: '$_id', title: '$title', image: {
            $cond:{ 
                        if : { $eq: ['$image', null] },  
                        then: 'http://lorempixel.com',
                        else: '$image',
                    }
             }, rate: '$rate', review:'$review', rating: { $divide: ['$rate', '$review'] } } }, total: { $first: '$total' }  } },
        {
            $project:
            {
                _id: 0,
                total: 1,
                limit: { $literal: 6 },
                skip: { $literal: 4 },
                data: 1
            }
        }
    ]);
     */
    query: function(options, done) {
        var imageCallback = 'http://placehold.it/100x100';
        var aggregate = [];

        /* filters : $match
        -----------------------------------------------------------*/
        if( options.match ) {
            aggregate.push({ $match: options.match });
        }

        /* group 0 & unwind
        -----------------------------------------------------------*/
        aggregate.push({ $group: { _id: 1, data: { $push: '$$ROOT' }, total: { $sum: 1 } } });
        aggregate.push({ $unwind: "$data" });
        aggregate.push({ $unwind: "$data.reviews" });

        /* group 1
        -----------------------------------------------------------*/
        var fields = _.mapValues(options.fields, function(value){
            return { $first: value.replace('$', '$data.') };
        });

        var group = _.merge({ 
            _id: '$data._id',
            rate: {
                $sum: "$data.reviews.rate"
            },
            review: {
                $sum: 1
            },
            total: { $first: '$total' }
        }, fields);

        aggregate.push({ $group: group });


        /* sort
        -----------------------------------------------------------*/
        if( options.sort ) {
            aggregate.push({ $sort: options.sort });
        }

        /* skip & limit
        -----------------------------------------------------------*/
        aggregate.push({ $skip: options.skip });
        aggregate.push({ $limit: options.limit });

        /* group 2
        -----------------------------------------------------------*/
        options.fields.image = {
            $cond: { 
                if : { $eq: ['$image', null] },  
                then: imageCallback,
                else: '$image',
            }
        };
        var data = _.merge({
            rating: {
                $divide: [
                    {
                        $subtract: [{
                            $multiply: [{
                                $divide: ['$rate', '$review']
                            }, 100]
                        }, {
                            $mod: [{
                                    $multiply: [{
                                        $divide: ['$rate', '$review']
                                    }, 100]
                                },
                                1
                            ]
                        }]
                    },
                    100
                ]
            },
            review: "$review"
        }, options.fields);
        var group2 = { _id: 0, data: { $push: data }, total: { $first: '$total'} };
        aggregate.push({ $group: group2 });

        /* projection
        -----------------------------------------------------------*/
        var fields = {};
        _.forEach(options.fields, function(value, k) { fields[k] = 1 });
        var projection = {
            _id: 0,
            total: 1,
            limit: { $literal: options.limit },
            skip: { $literal: options.skip },
            pages: { $divide: ['$total', options.limit] },
            currentPage: { $literal: options.page },
            perPage: { $literal: options.limit },
            data: 1
        };
        aggregate.push({ $project: projection });

        /* execute
        -----------------------------------------------------------*/

        // done(null, aggregate); return;

        this.aggregate(aggregate, function(err, results){
            if(err) return done(err);
            var response = !_.isEmpty(results) ? results[0] : 
                            { 
                                data: [], 
                                total: 0, 
                                limit: options.limit,
                                skip: 0,
                                pages: 0,
                                perPage: options.limit,
                                currentPage: 1 
                            };
            done(null, response);
        });
    }
};

module.exports = mongoose.model('Product', ProductSchema);
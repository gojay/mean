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

            console.log('pre:remove:delete', self.meta.images);

            var q = async.queue(function (file, callback) {
                var pattern = localPath + '/*' + file;
                console.log('remove:images', pattern);
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
        console.log('pre:remove', results);
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

    addComment: function(user, comment, cb) {
        this.reviews.push({
            body: comment.body,
            user: user._id
        });

        if (!this.user.email) this.user.email = 'anonymouse@localhost.com';

        this.save(cb);
    },

    removeComment: function(commentId, cb) {
        var index = _.indexOf(this.reviews, {
            id: commentId
        });
        if (index) {
            this.reviews.splice(index, 1);
        } else {
            return cb('not found');
        }
        this.save(cb);
    }
};

/**
 * Statics
 */

var ObjectId = require('mongoose').Types.ObjectId;
ProductSchema.statics = {

    /**
     * order reviews
     * @example
        db.products.aggregate([
            {$match: {_id: new ObjectId("545353b7213c9a101a7ed4f1")}},
            {$unwind: "$reviews"},
            {$sort: {"reviews.createdAt":-1}},
            {$limit: 2},
            {$group: {_id:"$_id", reviews: {$push:"$reviews"}}}
        ]);
     *
     */

    getReviews: function(id, options, done) {
        var options = _.extend({
            page: 1,
            perPage: 5,
            sort: {
                "reviews.createdAt": -1
            }
        }, options);

        var limit = options.perPage,
            skip = options.perPage * options.page;

        this.aggregate([
        {
            $match: { _id: ObjectId(id) }
        }, {
            $unwind: "$reviews"
        }, {
            $sort: options.sort
        }, {
            $limit: limit
        }, {
            $skip: skip
        }, {
            $group: {
                _id: "$_id",
                reviews: {
                    $push: "$reviews"
                }
            }
        }], done);
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
            range: function(data) {
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
                                name : gte + '" to ' + lte + '"',
                                query: {
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
                        name : "Less than " + min + '"',
                        query: {
                            lt: min
                        }
                    });
                }

                for (var i = min; i < max; i++) {
                    var gte = i , lte = i + 1;
                    var range = _.filter(data, function(item) { return item.name >= gte && item.name <= lte; });
                    if(range.length) {
                        var total = 0;
                        _.forEach(range, function(item) { total += item.total; })
                        results.push({
                            total: total,
                            name : gte + '" to ' + lte + '"',
                            query: {
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
                        name: "Greater than " + max + '"',
                        query: {
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
                        query: {
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
                            query: {
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
                        query: {
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

        async.auto({
            filters: function(callback) {
                if(!_.has(query, 'category')) return callback(null, query);

                var categories = _.isString(query.category) ? query.category : query.category['$in'];
                Category.getPathDescendants(categories, function(err, data) {
                    if(err) return callback(err);
                    if(data.length > 0) {
                        query.category = { $in: data };
                    }
                    return callback(null, query);
                });
            },
            category: ['filters', function(callback, results) {
                var filters = _.pick(results.filters, function(v, k){ return k != 'category'; });
                var aggregate = [
                    { $match: filters },
                    { $group : { _id : "$category", total : { $sum : 1 } } },
                    { $sort : { _id: 1 } }
                ];
                self.aggregate(aggregate, callback);
            }],
            brands: ['filters', function(callback, results) {
                var filters = _.pick(results.filters, function(v, k){ return k != 'brand'; });
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
                var filters = _.pick(results.filters, function(v, k){ return k != 'price'; });
                var match = _.assign({ $and : [{price: {$exists:true} }] }, filters);
                var aggregate = [
                    { $match: match },
                    { $group: { 
                         _id: 0,
                        min: { $min:"$price" },
                        max: { $max:"$price" },
                        avg: { $avg:"$price" },
                        sum: { $sum:"$price" }
                    }},
                    { $project: { _id: 0, min: { $literal: 0 }, max: 1, avg: 1, sum: 1, step: { $literal: 1 } } },
                ];
                self.aggregate(aggregate, callback);
            }],
            os: ['filters', function(callback, results) {
                var match = _.assign({ "meta.android.os": { $exists:true } }, results.filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.android.os", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: '$_id', total: 1, query:{ $toLower:'$_id' } } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, callback);
            }],
            camera: ['filters', function(callback, results) {
                var match = _.assign({ "meta.camera.primary": { $exists:true } }, results.filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.camera.primary", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: "$_id", total: 1 } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    var camera = self.custom.range(results);
                    callback(null, camera);
                });
            }],
            display: ['filters', function(callback, results) {
                var match = _.assign({ "meta.display.screenSize": { $exists:true } }, results.filters);
                var aggregate = [
                    { $match: match },
                    { $group: { _id: "$meta.display.screenSize", total : { $sum : 1 } }},
                    { $project: { _id: 0, name: "$_id", total: 1 } },
                    { $sort: { name: 1 } }
                ];
                self.aggregate(aggregate, function(err, results) {
                    if(err) return callback(err);
                    var display = self.custom.range(results);
                    callback(null, display);
                });
            }],
            flash: ['filters', function(callback, results) {
                var match = _.assign({ "meta.storage.flash": { $exists:true } }, results.filters);
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
                var match = _.assign({ "meta.storage.ram": { $exists:true } }, results.filters);
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
     */

    /**
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
        this.findOne(query, projection)
            .populate('reviews.user', 'name email')
            .exec(done);
    },

    list: function(options, done) {
        var self = this;

        var filters = options.filters;
        if( filters && filters.category ) {
            return Category.getPathDescendants(filters.category, function(err, data) {
                if(err) return done(err);
                if(data.length > 0) {
                    options.filters.category = { $in: data };
                }
                return self.query(options, done);
            });
        } 

        self.query(options, done);
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
        { $skip: 4 }, // skip = page * limit
        { $limit: 6 },
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
        if( options.filters ) {
            aggregate.push({ $match: options.filters });
        }

        /* group 0 & unwind
        -----------------------------------------------------------*/
        aggregate.push({ $group: { _id: 1, data: { $push: '$$ROOT' }, total: { $sum: 1 } } });
        aggregate.push({ $unwind: "$data" });
        aggregate.push({ $unwind: "$data.reviews" });

        /* group 1
        -----------------------------------------------------------*/
        var fields = _.mapValues(options.select, function(value){
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
        options.select.image = {
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
            }   
        }, options.select);
        var group2 = { _id: 0, data: { $push: data }, total: { $first: '$total'} };
        aggregate.push({ $group: group2 });

        /* projection
        -----------------------------------------------------------*/
        var fields = {};
        _.forEach(options.select, function(value, k) { fields[k] = 1 });
        var projection = {
            _id: 0,
            total: 1,
            limit: { $literal: options.limit },
            skip: { $literal: options.skip },
            data: 1
        };
        aggregate.push({ $project: projection });

        /* execute
        -----------------------------------------------------------*/

        // done(null, aggregate);

        this.aggregate(aggregate, function(err, results){
            if(err) return done(err);
            done(null, results[0]);
        });
    }
};

module.exports = mongoose.model('Product', ProductSchema);
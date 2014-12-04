'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Category = require('../category/category.model');

var glob = require('glob');
var fs = require('fs');
var config = require('../../config/environment');

var async = require('async');
var _ = require('lodash');

var Imager = require('imager'),
    imagerConfig = require('../../config/imager');

var localURI = '/img/phones', 
    localPath = config.root + '/client/img/phones';

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
  	image: String,
    tags: {
        type: [],
        set: setTags
    },
    comments: [{
        body: {
            type: String,
            default: '',
            required: 'Comment cannot be blank'
        },
        user: {
            type: Schema.ObjectId,
            ref: 'User'
        },
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

            console.log('pre:save:images', oldImages, newImages);

            var imgChanged = _.isEmpty(oldImages) || _.isEmpty(newImages) ? false : _.difference(oldImages.files, newImages.files).length > 0 ; 
            // is new / update : unchanged image
            if (self.isNew || !imgChanged) {
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
        console.log('pre:save', results);
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

        imagerConfig.storage.Local.path = 'client/img/phones';

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

                self.image = url + '/' + files[0];
                self.meta = {};
                self.meta = _.assign(meta, { images: images });
            } 

            self.save(cb);
        }, 'product');
    },

    addComment: function(user, comment, cb) {
        this.comments.push({
            body: comment.body,
            user: user._id
        });

        if (!this.user.email) this.user.email = 'anonymouse@localhost.com';

        this.save(cb);
    },

    removeComment: function(commentId, cb) {
        var index = _.indexOf(this.comments, {
            id: commentId
        });
        if (index) {
            this.comments.splice(index, 1);
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
     * order comments
     *
      db.blogs.aggregate([
      {$match: {_id: new ObjectId("545353b7213c9a101a7ed4f1")}},
      {$unwind: "$comments"},
      {$sort: {"comments.createdAt":-1}},
      {$limit: 2},
      {$group: {_id:"$_id", comments: {$push:"$comments"}}}
      ]);
     *
     */

    getComments: function(id, options, done) {
        var options = _.extend({
            page: 1,
            perPage: 5,
            sort: {
                "comments.createdAt": -1
            }
        }, options);

        var limit = options.perPage,
            skip = options.perPage * options.page;

        this.aggregate([
        {
            $match: { _id: ObjectId(id) }
        }, {
            $unwind: "$comments"
        }, {
            $sort: options.sort
        }, {
            $limit: limit
        }, {
            $skip: skip
        }, {
            $group: {
                _id: "$_id",
                comments: {
                    $push: "$comments"
                }
            }
        }], done);
    },

    /**
     * get all tags
     *
      db.blogs.aggregate( 
      [
        { $unwind : "$tags" },
        { $group : { _id : "$tags" } } ,
        { $sort : { "_id" : -1 } },
      ]
      );
     *
     */

    getAllTags: function(done) {
        this.aggregate([{
            $unwind: "$tags"
        }, {
            $group: {
                _id: "$tags"
            }
        }, {
            $sort: {
                "_id": -1
            }
        }, ], done);
    },

    /**
     * most used tags
     *
      db.blogs.aggregate( 
      [
        { $unwind : "$tags" },
        { $group : { _id : "$tags", count : { $sum : 1 } } } ,
        { $sort : { number : -1 } },
      ]
      );
     *
     */

    getMostUsedTags: function(done) {
        this.aggregate([{
            $unwind: "$tags"
        }, {
            $group: {
                _id: "$tags",
                count: {
                    $sum: 1
                }
            }
        }, {
            $project: {
                _id: 0,
                tag: "$_id",
                count: 1
            }
        }, {
            $sort: {
                count: -1
            }
        }, ], done);
    },

    load: function(id, done) {
        var skip = 0,
            limit = 5;
        var query = {
            _id: id
        };
        var projection = {
            comments: {
                $slice: [skip, limit]
            }
        };
        this.findOne(query, projection)
            .populate('comments.user', 'name email')
            .exec(done);
    },

    list: function(options, done) {
        var criteria = options.criteria || {};

        this.find(criteria)
            .select('-comments')
            .sort('-createdAt')
            .limit(options.perPage)
            .skip(options.perPage * options.page)
            .exec(done);
    }
};

module.exports = mongoose.model('Product', ProductSchema);
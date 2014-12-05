'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Category = require('../category/category.model');
var User = require('../user/user.model');

var async = require('async');
var _ = require('lodash');

var glob = require('glob');
var fs = require('fs');
var config = require('../../config/environment');

var Imager = require('imager'),
    imagerConfig = require('../../config/imager');

var localPath = config.root + '/client/images/blogs';

_.str = require('underscore.string');
_.mixin(_.str.exports());


/**
 * Getters & Setters
 */

var getTags = function(tags) {
    return _.isArray(tags) ? tags : tags.join(',');
};

var setTags = function(tags) {
    return _.isString(tags) ? _.map(tags.split(','), function(tag){
        return tag.trim();
    }) : tags ;
};
var BlogSchema = new Schema({
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
    body: {
        type: String,
        default: '',
        trim: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
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
    image: {
        cdnUri: String,
        files: []
    },
    tags: {
        type: [],
        // get: getTags,
        set: setTags
    },
    likes: {
        type: []
    },
    votes: {
        type: Number,
        default: 0
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

BlogSchema.post( 'init', function() {
    this._original = this.toObject();
});

/**
 * Pre/Post save hook
 */

BlogSchema.pre('save', function(next) {
    var self = this;

    async.series({
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
        /** remove old image files **/
        image: function(done){

            // is new / update unchanged image
            if (self.isNew || !self.isModified('image')) {
                return done(null, 'unchanged');
            }

            var oldImage = self._original.image;

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
            q.push(oldImage.files, function (err) {
                if(err) return done(err);
            });
        }
    },
    // optional callback
    function(err, results){
        if (err) return next(err);
        next();
    });
});

BlogSchema.post('save', function(doc) {
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

BlogSchema.pre('remove', function(next) {
    var self = this;

    async.series({
        /** decrease in number of categories **/
        category: function(done){
            // return is new / update unchanged category
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
        /** remove image files **/
        image: function(done){

            // is new / update unchanged image
            if (!self.image && self.image.files.length > 0) {
                return done(null, 'the images are empty');
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
            q.push(self.image.files, function (err) {
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

BlogSchema.methods = {

    uploadAndSave: function(images, cb) {
        var self = this;

        if ( !images ) return self.save(cb);

        imagerConfig.storage.Local.path = 'client/images/blogs';

        var imager = new Imager(imagerConfig, 'Local');
        imager.upload(images, function(err, cdnUri, files) {
            if (err) {
                return cb(err);
            }

            if (files.length) {
                if (!cdnUri) {
                    cdnUri = '/images';
                }
                self.image = {
                    cdnUri: cdnUri,
                    files: files
                }
            }

            self.save(cb);
        }, 'blog');
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
BlogSchema.statics = {

    /**
     * Order by comments count
     * 
     db.blogs.aggregate([ 
        { $unwind : "$comments" },
        { $group : { _id : "$_id", title:{ $first:"$title" }, comments : { $sum : 1 } } },
        { $sort : { comments : -1 } },
    ]);
     */

    /**
     * Order by likes count
     * 
     db.blogs.aggregate([ 
          { $unwind : "$likes" },
          { $group : { _id : "$_id", title:{ $first:"$title" }, likes : { $sum : 1 } } },
          { $sort : { likes : -1 } },
    ]);
     */

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

    /**
     * get count all comments 
     *
    db.blogs.aggregate( 
    [
      { $unwind : "$comments" },
      { $group : { _id : null, number : { $sum : 1 } } }
    ]
    );
    */

    /**
     * most likes user 
     *
    db.blogs.aggregate([ 
      { $unwind : "$likes" }, 
      { $group : { _id : "$likes", count : { $sum : 1 } } },
      { $project: { _id: 0, user: "$_id", count: 1 } },
      { $sort : { count : -1 } } 
    ])
    */

    /**
     * most commented user 
     *
    db.blogs.aggregate([ 
      { $unwind : "$comments" }, 
      { $group : { _id : "$comments.user", count : { $sum : 1 } } },
      { $project: { _id: 0, user: "$_id", count: 1 } },
      { $sort : { number : -1 } } 
    ])
    */

    getMostCommentedUser: function(done) {
        this.aggregate([{
            $unwind: "$comments"
        }, {
            $group: {
                _id: "$comments.user",
                count: {
                    $sum: 1
                }
            }
        }, {
            $project: {
                _id: 0,
                user: "$_id",
                count: 1
            }
        }, {
            $sort: {
                count: -1
            }
        }], function(err, results) {
            async.each(results, function(item, _done) {
                User.findOne({
                    _id: item.user
                }, 'name email', function(err, user) {
                    item.user = user;
                    _done(err);
                });
            }, function(err) {
                done(err, results);
            });
        });
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
            .populate('user', 'name email')
            .populate('comments.user', 'name email')
            .exec(done);
    },

    list: function(options, done) {
        var criteria = options.criteria || {};

        this.find(criteria)
            .select('-comments')
            .populate('user', 'name email')
            // .populate('comments.user', 'name email')
            .sort('-createdAt')
            .limit(options.perPage)
            .skip(options.perPage * options.page)
            .exec(done);
    }
};

module.exports = mongoose.model('Blog', BlogSchema);

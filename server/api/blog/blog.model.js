'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Category = require('../category/category.model');
var User = require('../user/user.model');

var Imager = require('imager');
// imagerConfig = require('../../config/imager');
var async = require('async');
var _ = require('lodash');

/**
 * Getters & Setters
 */

var getTags = function(tags) {
    return _.isArray(tags) ? tags : tags.join(',');
};

var setTags = function(tags) {
    return _.isString(tags) ? tags : tags.split(',');
};

var BlogSchema = new Schema({
    title: {
        type: String,
        default: '',
        trim: true
    },
    body: {
        type: String,
        default: '',
        trim: true
    },
    category: {
        type: String,
        ref: 'Category'
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
    tags: {
        type: [],
        get: getTags,
        // set: setTags
    },
    image: {
        cdnUri: String,
        files: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    __v: {type: Number, select: false},
});

/**
 * Validations
 */

BlogSchema.path('title').required(true, 'Blog title cannot be blank');
BlogSchema.path('body').required(true, 'Blog body cannot be blank');

BlogSchema
    .path('category')
    .set(function(category) {
        this._oriCategory = this.category;
        return category;
    });

/**
 * Pre/Post save hook
 */

BlogSchema.pre('save', function(next) {
    var isCategoryChange = this.isModified('category');
    var category = this.category;

    if (!isCategoryChange) {
        next();
    } else {
        // set increment categories count
        Category.setCount({
            category: category,
            value: 1
        }, function(err) {
            if (err) {
                return next(err);
            }
            next();
        });

    }
});

BlogSchema.post('save', function(doc) {
    var self = this;
    var oriCategory = this._oriCategory;
    var category = this.category;

    // set decrement previous categories count
    if (this._oriCategory && !_.isEqual(oriCategory, category)) {
        Category.setCount({
            category: oriCategory,
            value: -1
        }, function(err) {
            if (err) {
                return res.json(500, 'Error set decrement count on previous category : ' + self._oriCategory);
            }
        });
    }
});

/**
 * Pre remove hook
 */

BlogSchema.pre('remove', function(next) {
    var category = this.category;
    if (!category) next();

    Category.setCount({
        category: category,
        value: -1
    }, function(err) {
        if (err) {
            return next(err);
        }
        next();
    });
});

/**
 * Methods
 */

BlogSchema.methods = {

    uploadAndSave: function(images, cb) {
        if (!images || !images.length) return this.save(cb);

        // var self = this;

        // var imager = new Imager(imagerConfig, 'Local');
        // imager.upload(images, function(err, cdnUri, files) {
        //     if (err) {
        //         return handleError(err, res);
        //     }

        //     if (files.length) {
        //         if (!cdnUri) {
        //             cdnUri = '/images';
        //         }
        //         self.image = {
        //             cdnUri: cdnUri,
        //             files: files
        //         }
        //     }

        //     self.save(cb);
        // }, 'blog');
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
        options = _.extend({
            page: 1,
            perPage: 5,
            sort: {
                "comments.createdAt": -1
            }
        }, options);

        var limit = options.perPage,
            skip = options.perPage * options.page;

        this.aggregate([{
            $match: {
                _id: ObjectId(id)
            }
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
        { $group : { _id : "$tags", number : { $sum : 1 } } } ,
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
     * get count comments 
     *
    db.blogs.aggregate( 
    [
      { $unwind : "$comments" },
      { $group : { _id : null, number : { $sum : 1 } } }
    ]
    );
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

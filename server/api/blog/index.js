'use strict';

var express = require('express');
var controller = require('./blog.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.param('id', controller.load);
router.param('commentId', controller.loadComments);

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:id/comments', controller.showComments);
router.get('/:id/comments/:commentId', controller.showComment);
router.get('/:id/tags', controller.tags);

router.post('/', auth.isAuthenticated(), controller.create);
// router.post('/', controller.create);
router.post('/:id/comments', auth.isAuthenticated(), controller.addComment);
router.post('/:id/tags', auth.isAuthenticated(), controller.addTag);

router.put('/:id', auth.isAuthenticated(), controller.update);
// router.put('/:id', controller.update);
router.put('/:id/comments/:commentId', auth.isAuthenticated(), controller.updateComment);
router.put('/:id/tags/:tagIndex', auth.isAuthenticated(), controller.updateTag);

router.delete('/:id/tags/:tagIndex', auth.isAuthenticated(), controller.deleteTag);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;


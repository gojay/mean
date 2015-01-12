'use strict';

var express = require('express');
var controller = require('./product.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.param('id', controller.load);
router.param('reviewId', controller.loadReview);

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

router.get('/:id/reviews', controller.showReviews);
router.post('/:id/reviews', auth.isAuthenticated(), controller.addReview);
router.delete('/:id/reviews/:reviewId', controller.removeReview);

module.exports = router;
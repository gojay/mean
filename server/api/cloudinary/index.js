'use strict';

var express = require('express');
var controller = require('./cloudinary.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

router.post('/:id/tags', controller.addTag);
router.put('/:id/tags', controller.updateTag);
router.delete('/:id/tags/:tag', controller.removeTag);

router.post('/hooks', controller.hooks);

module.exports = router;
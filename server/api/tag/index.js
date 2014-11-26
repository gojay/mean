'use strict';

var express = require('express');
var controller = require('../blog/blog.controller');

var router = express.Router();

router.get('/', controller.showAllTags);
router.get('/most', controller.showMostUsedTags);

module.exports = router;
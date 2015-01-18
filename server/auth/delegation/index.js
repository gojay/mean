'use strict';

var express = require('express');
var jwt = require('jsonwebtoken');
var auth = require('../auth.service');

var router = express.Router();

router.get('/decode', auth.isAuthenticated(), function(req, res) {
    var token;
    // get the token
    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length == 2) {
            var scheme = parts[0];
            var credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            }
        } else {
            return res.send(404);
        }
    }
    // allow access_token to be passed through query parameter as well
    else if (req.query && req.query.hasOwnProperty('access_token')) {
        token = req.query.access_token;
    } else {
        return res.send(404);
    }

    var decoded = jwt.decode(token);
    res.json(decoded);
});

router.post('/refresh_token', auth.isAuthenticated(), auth.refreshToken);

module.exports = router;
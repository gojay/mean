/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below  
  app.use('/api/examples', require('./api/example'));
  app.use('/api/seeds', require('./api/seed'));

  app.use('/api/categories', require('./api/category'));
  app.use('/api/blogs', require('./api/blog'));
  app.use('/api/tags', require('./api/tag'));
  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/creators', require('./api/creator'));

  app.use('/auth', require('./auth'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};

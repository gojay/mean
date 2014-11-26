/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Blog = require('./blog.model');

exports.register = function(socket) {
  Blog.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Blog.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('blog:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('blog:remove', doc);
}
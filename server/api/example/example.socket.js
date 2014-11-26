/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Example = require('./example.model').BlogPost;

exports.register = function(socket) {
  Example.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Example.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('example:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('example:remove', doc);
}
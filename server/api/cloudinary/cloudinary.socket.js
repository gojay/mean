/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Cloudinary = require('./cloudinary.model');

exports.register = function(socket) {
  Cloudinary.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Cloudinary.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('cloudinary:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('cloudinary:remove', doc);
}
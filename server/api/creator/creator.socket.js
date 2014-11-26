/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Creator = require('./creator.model');

exports.register = function(socket) {
  Creator.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Creator.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
	console.info('socket emit on creator saved..');
  socket.emit('creator:save', doc);
}

function onRemove(socket, doc, cb) {
	console.info('socket emit on creator removed..');
  socket.emit('creator:remove', doc);
}
'use strict';

angular.module('socketMock', [])
  .factory('socket', function($rootScope) {
    return {
      socket: {
        events: {},
        emits: {},
        connect: function() {},
        on: function(eventName, callback){
          if(!this.events[eventName]) this.events[eventName] = []
          this.events[eventName].push(callback)
        },
        emit: function(eventName){
          var args = Array.prototype.slice.call(arguments,1)

          if(!this.emits[eventName])
            this.emits[eventName] = []
          this.emits[eventName].push(args)
        },
        receive: function(eventName){
          var args = Array.prototype.slice.call(arguments,1)

          if(this.events[eventName]){

            angular.forEach(this.events[eventName], function(callback){
              $rootScope.$apply(function() {

                callback.apply(this, args)
              })
            })
          }
        }
      },

      syncUpdates: function (modelName, data, cb) {
        cb = cb || angular.noop;

        var array = _.isObject(data) && _.has(data, 'data') ? data.data : data ;

        /**
         * Syncs item creation/updates on 'model:save'
         */
        this.socket.on(modelName + ':save', function (item) {
          
          var oldItem = _.find(array, item);
          var index = array.indexOf(oldItem);
          var event = 'created';

          // replace oldItem if it exists
          // otherwise just add item to the collection
          if (oldItem) {
            array.splice(index, 1, item);
            event = 'updated';
          } else {
            array.push(item);
          }

          cb(event, item, array);
        });

        /**
         * Syncs removed items on 'model:remove'
         */
        this.socket.on(modelName + ':remove', function (item) {
          var event = 'deleted';
          _.remove(array, function(value) { return value == item });
          cb(event, item, array);
        });
      },
      unsyncUpdates: function (modelName) {
        this.socket.removeAllListeners(modelName + ':save');
        this.socket.removeAllListeners(modelName + ':remove');
      },

      fire: function(modelName, item) {
        this.socket.receive(modelName, item);
      }
    };
  });
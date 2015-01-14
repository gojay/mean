'use strict';

angular.module('exampleAppApp')
  .factory('Auth', function Auth($location, $rootScope, $http, User, $cookieStore, $q) {
    var currentUser = {};
    if($cookieStore.get('token')) {
      currentUser = User.get();
    }

    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function(user, callback) {
        var self = this;
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        $http.post('/auth/local', {
          email: user.email,
          password: user.password
        })
        .success(function(data) {
          $cookieStore.put('token', data.token);
          currentUser = User.get();
          deferred.resolve(data);
          return cb();
        })
        .error(function(err) {
          self.logout();
          deferred.reject(err);
          return cb(err);
        });

        return deferred.promise;
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function() {
        $cookieStore.remove('token');
        currentUser = {};
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      createUser: function(user, callback) {
        var self = this;
        
        var cb = callback || angular.noop;

        return User.save(user,
          function(data) {
            $cookieStore.put('token', data.token);
            currentUser = User.get();
            return cb(user);
          },
          function(err) {
            self.logout();
            return cb(err);
          }).$promise;
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;

        return User.changePassword({ id: currentUser._id }, {
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function(user) {
          return cb(user);
        }, function(err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      getCurrentUser: function() {
        return currentUser;
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function() {
        return currentUser.hasOwnProperty('role');
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function(cb) {
        if(currentUser.hasOwnProperty('$promise')) {
          currentUser.$promise.then(function() {
            cb(true);
          }).catch(function() {
            cb(false);
          });
        } else if(currentUser.hasOwnProperty('role')) {
          cb(true);
        } else {
          cb(false);
        }
      },

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
      isAdmin: function() {
        return currentUser.role === 'admin';
      },

      /**
       * Get auth token
       */
      getToken: function() {
        return $cookieStore.get('token');
      },

      /**
       * Get user in asynchronus
       *
       * Called after login oauth success with modal
       * 
       * @return {Promise}
       */
      getUserInAsync: function() {
        var deferred = $q.defer();
        if(this.getToken()) {
          if(_.isEmpty(currentUser)) {
            currentUser = User.get();
          }
          deferred.resolve();
        } else {
          deferred.reject({ message: 'Authorization Failed'});
        }
        return deferred.promise;
      },

      /**
       * Refresh token
       */
      refreshToken: function() {
        var deferred = $q.defer();
        $http.post('/auth/delegation/refresh_token')
          .success(function(data) {
            var token = data.token;
            $cookieStore.put('token', token);
            deferred.resolve(token);
          })
          .error(function(error) {
            deferred.reject(error);
          })
        return deferred.promise;
      }
    };
  })
  /* based on angular satelizer popup */
  .factory('Oauth.window', function(){
    return {
      facebook: { 
        width: 481, 
        height: 269 
      },
      google: { 
        width: 580, 
        height: 400 
      },
      twitter: { 
        width: 495, 
        height: 645 
      },
      github: {
        width: 1020,
        height: 618
      }
    };
  })
  .factory('Oauth.popup', [
    '$q', 
    '$interval', 
    '$window', 
    '$location',
    'Oauth.window',
    function($q, $interval, $window, $location, providerWindow) {
      var popupWindow = null;
      var polling = null;

      var popup = {};

      popup.popupWindow = popupWindow;

      popup.open = function(url, provider) {
          this.provider = provider;

          var deferred = $q.defer();
          var optionsString = popup.stringifyOptions(popup.prepareOptions(provider));

          popupWindow = $window.open(url, '_blank', optionsString);

          if (popupWindow && popupWindow.focus) {
              popupWindow.focus();
          }

          popup.pollPopup(deferred);

          return deferred.promise;
      };

      popup.pollPopup = function(deferred) {
          popupWindow.document.title = 'Connect with ' + this.provider;
          polling = $interval(function() {
              try {
                  if (popupWindow.oauthSuccess) {
                      deferred.resolve();
                      popupWindow.close();
                      $interval.cancel(polling);
                  }
              } catch (error) {}

              if (popupWindow.closed) {
                  $interval.cancel(polling);
                  deferred.reject({ message: 'Authorization Failed' });
              }
          }, 100);
      };

      popup.prepareOptions = function(provider) {
        var options = providerWindow[provider];
        var width = options.width || 500;
        var height = options.height || 500;
        return angular.extend({
            width: width,
            height: height,
            left: $window.screenX + (($window.outerWidth - width) / 2),
            top: $window.screenY + (($window.outerHeight - height) / 2.5)
        }, options);
      };

      popup.stringifyOptions = function(options) {
          var parts = [];
          angular.forEach(options, function(value, key) {
              parts.push(key + '=' + value);
          });
          return parts.join(',');
      };

      return popup;
  }]);

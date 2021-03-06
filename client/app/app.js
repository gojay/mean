'use strict';

angular.module('exampleAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngAnimate',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'ui.tinymce',
  'angular-data.DSCacheFactory',
  'angular-spinkit',
  'angular-jwt',
  'angularFileUpload',
  'cloudinary',
  'uiSlider',
  'ngToast',
  'angular-scroll-complete'
])
  .constant('CLOUDINARY_CONFIG', {
    // cloud_name: 'doztst1iv',
    // upload_preset: 'q4atozxl',
    // api_key: '714114529258881'
    cloud_name: 'digi-co-id',
    api_key: '665793913584278',
  })
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {

    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);

    /* http interceptors */

    // angular-jwt
    jwtInterceptorProvider.tokenGetter = ['Auth', 'jwtHelper', function(Auth, jwtHelper) {
      var token = Auth.getToken();
      if(token && jwtHelper.isTokenExpired(token)) {
        Auth.refreshToken().then(function(newToken) {
          return newToken;
        });
      } else {
        return token; 
      }
    }];
    $httpProvider.interceptors.push('jwtInterceptor');
  })
  .run(function ($rootScope, $state, $location, $http, $compile, $window, Auth, Modal, DSCacheFactory) {
    /* set HTTP defaults cache
    DSCacheFactory('appHTTPCache', {
        maxAge: 900000, // Items added to this cache expire after 15 minutes.
        cacheFlushInterval: 3600000, // This cache will clear itself every hour.
        deleteOnExpire: 'aggressive', // Items will be deleted from this cache right when they expire.
        storageMode: 'localStorage' // This cache will sync itself with `localStorage`.
    });
    $http.defaults.cache = DSCacheFactory.get('appHTTPCache');  */

    window.$rootScope = $rootScope;

    // Redirect to login if route requires auth and you're not logged in
    var t1;
    $rootScope.$on('$stateChangeStart', function (event, next) {
      t1 = $window.performace ? $window.performance.now() : Date.now();
      // set state
      $rootScope.$state = $state;
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          console.log('$stateChangeStart', next, loggedIn, Modal);
          // $location.path('/login');
          Modal.auth(function close() {
              /* on close */
          }, function cancel() {
              /* on cancel */
          })();
        }
      });
    });
    
    var url, oldUrl;
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      /* Emitted every time the content is reloaded. */
      $rootScope.$on('$viewContentLoaded', function() {
          url = $location.path();
          if(oldUrl == url) return;

          var t2 = $window.performace ? $window.performance.now() : Date.now();
          var userAgent = $window.navigator.userAgent;
          var response = (t2 - t1).toFixed(2);
          // console.info('\n-----------------------\n');
          // console.group('$viewContentLoaded:%s', url);
          // console.info('userAgent', userAgent);
          // console.info('response', response);
          // console.info('userip', userip);
          // console.groupEnd();
          oldUrl = url;
      });
    });

    // Emitted when unauthenticated
    $rootScope.$on('unauthenticated', function(event, err) {
      Auth.logout();
      // redirect to login page / show modal login
      // $location.path('/login');
      Modal.auth(function close() {
          /* on close */
      }, function cancel() {
          /* on cancel */
      })();
    });
  });
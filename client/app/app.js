'use strict';

angular.module('Scope.safeApply',[]).run(function($rootScope){$rootScope.$safeApply=function(){var $scope,fn,force=false;if(arguments.length==1){var arg=arguments[0];if(typeof arg=='function'){fn=arg;}
else{$scope=arg;}}
else{$scope=arguments[0];fn=arguments[1];if(arguments.length==3){force=!!arguments[2];}}
$scope=$scope||this;fn=fn||function(){};if(force||!$scope.$$phase){$scope.$apply?$scope.$apply(fn):$scope.apply(fn);}
else{fn();}};});

angular.module('exampleAppApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngAnimate-animate.css',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'ui.utils',
  'angular-data.DSCacheFactory',
  'angular-spinkit',
  'angular-paging',
  'uiSlider',
  'Scope.safeApply'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $urlMatcherFactoryProvider) {
    /* https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-make-a-trailing-slash-optional-for-all-routes */
    /*$urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.url();
      // check to see if the path already has a slash where it should be
      if (path[path.length - 1] === '/' || path.indexOf('/?') > -1) {
        return;
      }
      if (path.indexOf('?') > -1) {
        return path.replace('?', '/?');
      }
      return path + '/';
    });*/
    
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };  
  })

  .run(function ($rootScope, $state, $location, $http, $compile, Auth, DSCacheFactory) {
    // set HTTP defaults cache
    DSCacheFactory('appHTTPCache', {
        maxAge: 900000, // Items added to this cache expire after 15 minutes.
        cacheFlushInterval: 3600000, // This cache will clear itself every hour.
        deleteOnExpire: 'aggressive', // Items will be deleted from this cache right when they expire.
        storageMode: 'localStorage' // This cache will sync itself with `localStorage`.
    });
    // $http.defaults.cache = DSCacheFactory.get('appHTTPCache');

    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      // set state
      $rootScope.$state = $state;
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  });
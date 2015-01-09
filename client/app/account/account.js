'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'app/account/login/login.html',
        // controller: 'LoginCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/account/signup/signup.html',
        // controller: 'SignupCtrl'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .state('oauth', {
        url: '/oauth',
        template: '<div class="spinner-wrapper-primary"><wandering-cubes-spinner></wandering-cubes-spinner></div>',
        controller: function($rootScope, $timeout, $window) {
          // $timeout(function() {
            $window.oauthSuccess = true;
          // }, 2000);
        },
      });
  });
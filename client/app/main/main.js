'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl',
        data: {
          title: 'Home'
        }
      })
      .state('dev', {
        url: '/',
        templateUrl: 'app/main/dev.html',
        controller: 'DevCtrl',
        data: {
        	title: 'Dev'
        }
      });
  });
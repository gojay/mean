'use strict';

angular.module('exampleAppApp')
  .filter('checkmark', function () {
    return function (input) {
      return input ? '\u2713' : '\u2718';
    };
  });

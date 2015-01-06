'use strict';

angular.module('exampleAppApp')
  .directive('loginForm', function (Auth, $location, $window) {
    return {
      templateUrl: 'components/loginForm/loginForm.html',
      restrict: 'EA',
      link: function ($scope, element, attrs) {
      	var referrer;
      	if(attrs.loginReferrer) {
      		referrer = attrs.loginReferrer;
      	}

      	$scope.user = {};
	    $scope.errors = {};

	    $scope.login = function(form) {
	      $scope.submitted = true;

	      if(form.$valid) {
	        Auth.login({
	          email: $scope.user.email,
	          password: $scope.user.password
	        })
	        .then( function() {
	          // Logged in, redirect to home\
	          var path = ( referrer ) ? referrer : '/' ;
	          $location.path(path);
	        })
	        .catch( function(err) {
	          $scope.errors.other = err.message;
	        });
	      }
	    };

	    $scope.loginOauth = function(provider) {
	      var href = '/auth/' + provider;
	      if( referrer ) {
	      	href += '?referrer=' + referrer ;
	      }
	      $window.location.href = href;
	    };
      }
    };
  });
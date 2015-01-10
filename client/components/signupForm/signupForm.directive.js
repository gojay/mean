'use strict';

/**
 * signupForm directive
 * 
 * @example
 * <signup-form 
 * 		signup-referrer="/path/redirect"
 * 		signup-success="signupSuccess()"
 * 		signup-dialog="true"></signup-form>
 */
angular.module('exampleAppApp')
    .directive('signupForm', [
        '$q', 
        '$location', 
        '$window', 
        '$parse', 
        '$timeout', 
        'Auth', 
        'Oauth.popup', 
    	function($q, $location, $window, $parse, $timeout, Auth, popup) {
            return {
                templateUrl: 'components/signupForm/signupForm.html',
                restrict: 'EA',
                link: function($scope, element, attrs) {
                    var referrer;
                    if (attrs.signupReferrer) {
                        referrer = attrs.signupReferrer;
                    }

                    var signupSuccessFn;
                    if (attrs.signupSuccess) {
                        signupSuccessFn = $parse(attrs.signupSuccess);
                    }

                    $scope.showDialog = attrs.signupDialog && attrs.signupDialog === 'true';
                    $scope.oauthLoading = false;

                    $scope.user = {};
                    $scope.errors = {};

                    $scope.register = function(form) {
                        $scope.submitted = true;

                        if (form.$valid) {
                            Auth.createUser({
                                name: $scope.user.name,
                                email: $scope.user.email,
                                password: $scope.user.password
                            })
                            .then(function() {
                                if (angular.isDefined(signupSuccessFn)) {
                                    signupSuccessFn($scope);
                                } else {
                                    var path = (referrer) ? referrer : '/';
                                    $location.path(path);
                                }
                            })
                            .catch(function(err) {
                                err = err.data;
                                $scope.errors = {};

                                // Update validity of form fields that match the mongoose errors
                                angular.forEach(err.errors, function(error, field) {
                                    form[field].$setValidity('mongoose', false);
                                    $scope.errors[field] = error.message;
                                });
                            });
                        }
                    }

                    $scope.loginOauth = function(provider) {
                        var url = '/auth/' + provider;
                        if( !$scope.showDialog || angular.isUndefined(signupSuccessFn) ) {
                            if (referrer) {
                                url += '?referrer=' + referrer;
                            }
                            return $window.location.href = url;
                        }
                        
                        var deferred = $q.defer();

                        url += '?referrer=/oauth';

                        popup.open(url, provider)
                            .then(function() {
                                Auth.getUserInAsync().then(function() {
                                    $scope.oauthLoading = true;
                                    $timeout(function() {
                                        $scope.oauthLoading = false;
                                        signupSuccessFn($scope);
                                    }, 2000);
                                }).catch(function(error) {
                                    signupSuccessFn($scope);
                                    $scope.errors.other = error.message;
                                });
                            }).catch(function(error) {
                                signupSuccessFn($scope);
                                $scope.errors.other = error.message;
                            });

                        return deferred.promise;
                    };
                }
            }
        }
    ]);

'use strict';

/**
 * loginForm directive
 *
 * @example
 * <login-form 
 *     login-referrer="/path/redirect" 
 *     login-success="loginSuccess()"
 *     login-dialog="true">
 * </login-form>
 */
angular.module('exampleAppApp')
    .directive('loginForm', [
        '$q', 
        '$location', 
        '$window', 
        '$parse', 
        '$timeout', 
        'Auth', 
        'Oauth.popup', 
        function($q, $location, $window, $parse, $timeout, Auth, popup) {
            return {
                templateUrl: 'components/loginForm/loginForm.html',
                restrict: 'EA',
                link: function($scope, element, attrs) {
                    var referrer, loginSuccessFn;

                    if (attrs.loginReferrer) {
                        referrer = attrs.loginReferrer;
                    }

                    if (attrs.loginSuccess) {
                        loginSuccessFn = $parse(attrs.loginSuccess);
                    }

                    $scope.showDialog = attrs.loginDialog && attrs.loginDialog === 'true';
                    $scope.oauthLoading = false;

                    $scope.user = {};
                    $scope.errors = {};

                    $scope.login = function(form) {
                        $scope.submitted = true;

                        if (form.$valid) {
                            Auth.login({
                                email: $scope.user.email,
                                password: $scope.user.password
                            })
                            .then(function() {
                                if (angular.isDefined(loginSuccessFn)) {
                                    loginSuccessFn($scope);
                                } else {
                                    var path = (referrer) ? referrer : '/';
                                    $location.path(path);
                                }
                            })
                            .catch(function(err) {
                                $scope.errors.other = err.message;
                            });
                        }
                    };

                    $scope.loginOauth = function(provider) {
                        var url = '/auth/' + provider;
                        if( !$scope.showDialog || angular.isUndefined(loginSuccessFn) ) {
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
                                        loginSuccessFn($scope);
                                    }, 2000);
                                }).catch(function(error) {
                                    loginSuccessFn($scope);
                                    $scope.errors.other = error.message;
                                });
                            }).catch(function(error) {
                                loginSuccessFn($scope);
                                $scope.errors.other = error.message;
                            });

                        return deferred.promise;
                    };
                }
            };
        }
    ]);

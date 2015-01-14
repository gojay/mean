'use strict';

angular.module('exampleAppApp')
    .controller('ProductsDetailCtrl', function($scope, /*$state, */ $stateParams, $log, /*product, */productService, Auth, Modal) {
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.loading = true;

        /* get product */
        productService.get($stateParams.productId).$promise.then(function(product){
            $scope.product = product;
            $scope.loading = false;
        }).catch(function(error) {
            $scope.error = error;
        });

        /* set active thumbnail */
        $scope.activeThumb = 0;
        $scope.setThumb = function(index) {
            $scope.activeThumb = index;
        };

        /* reviews */

        $scope.reviews = {
            errors: null,
            loading: false,
            firstTime: true,
            list: null,
            data: {
                body: '',
                rate: 0
            },
            add: function(review) {
                review.createdAt = moment(review.createdAt).fromNow();
                this.list.data.unshift(review);
                this.clear();
                this.loading = false;
            },
            clear: function() {
                $scope.submitted = false;
                this.data.body = '';
                this.data.rate = 0;
            }
        };

        // get reviews
        $scope.reviews.get = function(options, isPaging) {
            var self = this;
            if(!self.firstTime && (_.isUndefined(isPaging) || !isPaging)) return;

            var params = angular.extend({ 
                id: $scope.product._id,
                sort: 'createdAt',
                page: 1
            }, options);

            self.firstTime = false;
            self.loading = true;
            productService.getReviews(params).$promise.then(function(reviews) {
                self.firstTime = false;
                // convert createdAt with moment.js
                _.map(reviews.data, function(review){
                    review.createdAt = moment(review.createdAt).fromNow();
                    return review;
                });
                self.list = reviews;
                self.loading = false;
            }).catch(function(error) {
                $log.error('get:reviews', error);
                self.errors = { get: error };
            });
        };
        // check has more reviews
        $scope.reviews.hasMore = function() {
            return !_.isEmpty(this.list) && this.list.currentPage < Math.round(this.list.pages);
        };
        // load more reviews
        $scope.reviews.loadMore = function() {
            var self = this;
            if(!self.hasMore()) return;

            var params = { 
                id: $scope.product._id,
                sort: 'createdAt',
                page: self.list.currentPage + 1,
            };

            self.loading = true;
            productService.getReviews(params).$promise.then(function(reviews){
                self.loading = false;

                var attrs = _.pick(reviews, function(value, key) {
                    return _.indexOf(['total', 'limit', 'skip', 'currentPage'], key) > -1;
                });
                angular.extend(self.list, attrs);

                // convert createdAt with moment.js
                _.map(reviews.data, function(review){
                    review.createdAt = moment(review.createdAt).fromNow();
                    return review;
                });
                angular.forEach(reviews.data, function(review) {
                    self.list.data.push(review);
                });
            }).catch(function(error) {
                $log.error('load:reviews', error);
                self.errors = { load: error };
            });
        };
        // user send review
        $scope.reviews.send = function(form) {
            var self = this;
            $scope.submitted = true;
            if(form.$valid && Auth.isLoggedIn()) {
                self.loading = true;
                productService.sendReview($scope.product._id, self.data).$promise.then(function(review){
                    self.add(review);
                }).catch(function(error) {
                    err = err.data;
                    self.errors.form = {};
                    // Update validity of form fields that match the mongoose errors
                    angular.forEach(err.errors, function(error, field) {
                        form[field].$setValidity('mongoose', false);
                        self.errors.form[field] = error.message;
                    });
                });
            }
        };

        // rating on-hover
        $scope.hoveringOver = function(value) {
            $scope.overStar = value;
            $scope.percent = 100 * (value / 5);
        };

        /* open modal login user */
        $scope.showLoginDialog = Modal.auth(function close() {
            /* on close */
        }, function cancel() {
            /* on cancel */
        });
    })
    // modal controller
	.controller('ModalInstanceCtrl', function($scope, $modalInstance) {
    	// modal close
        $scope.close = function() {
            $modalInstance.close();
        };
        // cancel 
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    });

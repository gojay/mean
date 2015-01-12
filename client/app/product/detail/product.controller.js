'use strict';

angular.module('exampleAppApp')
    .controller('ProductsDetailCtrl', function($scope, /*$state, */ $stateParams, $modal, $log, /*product, */productService, Auth) {
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
            error: null,
            loading: false,
            firstTime: true,
            list: null,
            data: {
                // user: Auth.getCurrentUser()._id,
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
                    self.error = error;
                });
            }
        };

        // rating on-hover
        $scope.hoveringOver = function(value) {
            $scope.overStar = value;
            $scope.percent = 100 * (value / 5);
        };

        /* open modal login user */
        $scope.showLoginDialog = function() {
            if(Auth.isLoggedIn()) return;

            // var referrer = $state.href($state.current.name, $state.params);
            var referrer = '/oauth';
            $scope.modalInstance = $modal.open({
                // size: 'lg',
                template: '<div class="modal-header" style="border-bottom:0">' +
                    '<h3 class="modal-title">Authentication</h3>' +
                '</div>' +
                '<div class="modal-body" style="padding:0">' +
                    '<tabset justified="true">'+
                        '<tab>' +
                            '<tab-heading>Sign in</tab-heading>' +
                            '<div style="padding:20px">' +
                                '<login-form login-dialog="true" login-success="close()"></login-form>' +
                            '</div>' +
                        '</tab>' +
                        '<tab>' +
                            '<tab-heading>Sign up</tab-heading>' +
                            '<div style="padding:20px">' +
                                '<signup-form signup-dialog="true" signup-success="close()"></signup-form>' +
                            '</div>' +
                        '</tab>' +
                    '</tabset>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
                '</div>',
                controller: 'ModalInstanceCtrl'
            });

            $scope.modalInstance.result.then(function close() {
                // $scope.reviews.data.user = Auth.getCurrentUser()._id;
            }, function cancel() {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

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

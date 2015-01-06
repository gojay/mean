'use strict';

angular.module('exampleAppApp')
    .controller('ProductsContentCtrl',
        function($scope, $rootScope, $location, productData, productService, socket) {
            var params = $location.search();

            $scope.loading = true;

            /* get all products */

            productService.query(params).$promise.then(function(products) {
                $scope.products = products;
                $scope.products.title = 'All Products';
                $rootScope.$broadcast('products:loaded', { filters: productData.filters.data });

                $scope.loading = false;
	        	socket.syncUpdates('product', $scope.products);
            });

            /* products pagination */

            $scope.doPaging = function(page) {
                // $location.search('page', page);
                $scope.loading = true;
                params['page'] = page;
    			productService.query(params).$promise.then(function(products) {
                    $scope.products = products;
                    $scope.products.title = 'All Products';
                    $scope.loading = false;
                });
            }

	        $scope.$on('destroy', function() {
	            socket.unSyncUpdates('product');
	        });
        }
    )
	.controller('ProductsQueryContentCtrl', 
    	function($scope, $rootScope, $state, $stateParams, productService, socket) {
          	$scope.loading = true;

			/* set breadcrumbs */

			$scope.breadcrumb.set($stateParams);

			var title = null;
			var params = _.mapValues($stateParams, function(value) {
			    return value && /\_/.test(value) ? value.split('_') : value;
			});

			/* get products query */

			productService.all(params)
				.then(function(results) {
				    $scope.products = results.products.data;
				    $scope.products['title'] = title = $scope.breadcrumb.getTitle();

				    $rootScope.$broadcast('products:loaded', {
				        params: params,
				        filters: results.filters.data
				    });
				    $scope.loading = false;

				    $state.current.data.title = title;
		        	socket.syncUpdates('product', $scope.products);
				});

			/* products pagination */

			$scope.doPaging = function(page) {
			    // $location.search('page', page);
			    $scope.loading = true;
				productService
    				.setParam('page', page)
					.all()
					.then(function(results) {
				        $scope.products = results.products.data;
				        $scope.products['title'] = title;
				        $scope.loading = false;
				    });
			}

	        $scope.$on('destroy', function() {
	            socket.unSyncUpdates('product');
	        });

		}
    );

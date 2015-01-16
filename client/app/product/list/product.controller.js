'use strict';

angular.module('exampleAppApp')
    .controller('ProductsContentCtrl',
        function($scope, $rootScope, $location, filterFilter, productService, socket) {
            var params = $location.search();

            $scope.loading = true;

            /* get all products */

            productService.all(params).then(function(results) {
                $scope.products = results.products.data;
                $scope.products.title = 'All Products';
                $rootScope.$broadcast('products:loaded', { 
                    categories: results.categories.data,
                    filters: results.filters.data 
                });

                $scope.loading = false;
	        	socket.syncUpdates('product', $scope.products, function(event, item) {
                    if(event == 'created') {
                        $scope.products.total++;
                    } else if(event == 'deleted') {
                        $scope.products.total--;
                    }
                    // update product pages
                    $scope.products.pages = Math.ceil($scope.products.total/$scope.products.perPage);
                    // brodcast product loaded
                    $rootScope.$broadcast('products:loaded', item.data);
	        	});
            });

            /* products pagination */

            $scope.doPaging = function() {
                // $location.search('page', page);
                $scope.loading = true;
                params['page'] = $scope.products.currentPage;
    			productService.query(params).$promise.then(function(products) {
                    $scope.products = products;
                    $scope.products.title = 'All Products';
                    $scope.loading = false;
                });
            };

            /*$scope.$watchCollection('filters.search.query', function(newCollection, oldCollection, scope) {
            	if(!_.isEqual(newCollection, oldCollection)) {
	            	console.log('filters', newCollection, oldCollection)
	            	console.log('filters', filterFilter($scope.products.data, newCollection).length)
            	}
            });*/

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
                        categories: results.categories.data,
				        filters: results.filters.data
				    });
				    $scope.loading = false;

				    $state.current.data.title = title;
		        	socket.syncUpdates('product', $scope.products);
				});

			/* products pagination */

			$scope.doPaging = function() {
			    // $location.search('page', page);
			    $scope.loading = true;
				productService
    				.setParam('page', $scope.products.currentPage)
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

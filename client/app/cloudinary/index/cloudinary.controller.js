'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryCtrl', function($scope, $state, $log, $q, $timeout, $loading, CloudinaryService) {
    	$scope.tag = 'example';

    	/* tabs */

    	$scope.tabs = [
    		{ active: true, state: 'cloudinary' },
    		{ active: false, state: 'cloudinary.resources' },
    		{ active: false, state: 'cloudinary.url' }
    	];

    	$scope.setActiveTab = function(selected) {
    		_.forEach($scope.tabs, function(tab) {
    			tab.active = false;
    		});
    		$scope.tabs[selected].active = true;
			$state.go($scope.tabs[selected].state);
    		if(selected == 1) {
    			$scope.getImages();
    		}
    	}

    	/* Resources object */

        $scope.resources = CloudinaryService.resources; 

    	$scope.promiseResources;   
    	$scope.getResources = function(dummy) {
    		$loading.start('Getting resources..');

    		var deferred = $q.defer();

    		if( $scope.resources.data.length ) {
    			$loading.stop();
    			deferred.resolve($scope.resources.data);
    		}

    		if( dummy === true ) {

	    		$timeout(function() {
	    			var data = CloudinaryService.dummy();
	    			$loading.stop();
	    			deferred.resolve(data);
	    		}, 3000);

    		} else {

		    	CloudinaryService.api.query({ tags: true, /*searchByTag: $scope.tag*/ }).$promise.then(function(data) {
		    		var resources = _.map(data.resources, function(item) {
		    			item.tags = item.tags.join(', ');
		    			item.size = Math.round(item.bytes/1024);
		    			return item;
		    		});
	    			$loading.stop();
		    		deferred.resolve(resources);
		    	});
    		}

    		return deferred.promise;
    	};

    	$scope.getImages = function(dummy) {
    		// return if promise resources is defined ('getResources' have been called)
    		if( $scope.promiseResources ) return;
    		$scope.getResources(dummy).then(function(data) {
        		$scope.resources.data = data;
    		});
    	}

    });

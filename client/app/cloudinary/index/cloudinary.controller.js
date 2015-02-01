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

    	$scope.setActiveTab = function(selected, requestRequired) {
    		_.forEach($scope.tabs, function(tab) {
    			tab.active = false;
    		});
    		$scope.tabs[selected].active = true;
			$state.go($scope.tabs[selected].state);
			// get resources
			requestRequired = _.isUndefined(requestRequired) ? true : requestRequired;
    		if(selected == 1 && requestRequired) {
    			$scope.getResources();
    		}
    	}

    	/* Resources */

        $scope.resources = CloudinaryService.resources; 

    	$scope.getResources = function() {
    		$scope.resources.populate().then(function(data) {
        		$scope.resources.data = data;
    		});
    	}

    });

'use strict';

angular.module('exampleAppApp')
  .factory('$loading', function ($rootScope) {
    var loading = {
		active: false,
		message: '',
		start: function(message) {
			message = message || 'Please wait...';
			if(this.active) {
				this.message = message;
				return;
			}
			this.active = true;
			this.message = message;
		},
		stop: function() {
			this.active = false;
			this.message = '';
		}
	};

	$rootScope.$loading = loading;

	return loading;
  });

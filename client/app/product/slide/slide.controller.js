'use strict';

angular.module('exampleAppApp')
  .controller('ProductSlideCtrl', function($scope, $window, $state, $stateParams) {
	  var width = parseInt(angular.element('.carousel').width(), 10), 
	      height = 200;

	  $scope.slides = {
	    interval: 5000,
	    data: [
	      {
	        image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/1',
	        title: 'Example headline.',
	        description: 'Note: If you\'re viewing this page via a <code>file://</code> URL, the "next" and "previous" Glyphicon buttons on the left and right might not load/display properly due to web browser security rules.',
	        link: $state.href('products.query({ productId:\'motorola\'})')
	      },
	      {
	        image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/2',
	        title: 'Another example headline.',
	        description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
	        link: $state.href('products.query({ productId:\'samsung\'})')
	      },
	      {
	        image: '//lorempixel.com/'+ width +'/'+ height +'/fashion/3',
	        title: 'Another example headline.',
	        description: 'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.',
	        link: $state.href('products.query({ productId:\'t-mobile\'})')
	      }
	    ]
	  };
	});

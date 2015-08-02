'use strict';

/**
 * loading spinkit
 * @example
 * <loading-spinkit wrapper-class="primary|info|success|danger|warning" spinkit="wave-spinner"></loading-spinkit>
 *
 * loading spinkit options:
 * http://jsfiddle.net/Urigo/638AA/18/
 * 
 * rotating-plane-spinner
 * double-bounce-spinner
 * wave-spinner
 * wandering-cubes-spinner
 * pulse-spinner
 * chasing-dots-spinner
 * circle-spinner
 * three-bounce-spinner
 * cube-grid-spinner (default)
 * word-press-spinner
 * fading-circle-spinner
 */
angular.module('exampleAppApp')
  .directive('loadingSpinkit', function($injector, $compile, $rootScope) {
      return {
      	scope: {
      		spinkit: '@',
      		wrapperClass: '@'
      	},
      	replace: true,
          template: '<div class="spinner-inline" ng-show="$root.$loading.active"></div>',
          restrict: 'EA',
          link: function(scope, element, attrs) {
          	var className = scope.wrapperClass || 'primary';

          	var wrapperClass = 'spinner-wrapper-' + className;
		    element.addClass(wrapperClass);

              // Check for the existence of the spinkit-directive
		    if(!scope.spinkit || !$injector.has(attrs.$normalize(scope.spinkit) + 'Directive'))
		        scope.spinkit = 'cube-grid-spinner';

		    var spinner = $compile('<' + scope.spinkit + '/>')(scope);
		    element.append(spinner);

		    var textEl = $compile('<p>{{$root.$loading.message}}</p>')(scope);
          	var textClass = 'text-primary text-center text-' + className;
		    textEl.addClass(textClass).css('padding-top', '10px');
		    element.append(textEl);
          }
      };
  })
	.directive('loadingSpinkitClass', function ($compile) {
	    return {
	        restrict: 'A',        
	        compile: function(element, attrs) {
	        	var className = attrs.loadingSpinkitClass || 'loading';
	            attrs.$set('ng-class', '{\''+ className+'\' : $root.$loading.active}');
	            return {
	               post: function postLink(scope, iElement, iAttrs, controller) { 
	               		// before using $compile remove the attribute 'loadingSpinkitClass' to the element to prevent infinite compilation.
	                 	iElement.removeAttr('loading-spinkit-class');
						$compile(iElement)(scope);
	               }
	            }
	        }
	    }
	});

'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryResourcesListCtrl', function($scope, $log, $loading, $timeout, Modal, CloudinaryService) {
        var resources = CloudinaryService.resources;

    	$scope.select = function($event, $index, item) {
            // check this item is selected
            // yes, set active selected item. if already active, remove it.
			if( item.selected ) {
                // force unset, if element 'i'(icon) on clicked
				var forceUnset = $event.target.localName == 'i';
				if( item.active || forceUnset ) {
					resources.unSelected(item, forceUnset);
				} else {
					resources.setActive($index);
				}
			} 
            // no, added this is new item to selected data
            else {
                // ctrl key pressed : add multiple item one by one
				if ($event.ctrlKey) {
    				resources.addSelected(item);
                // shift key pressed : add multiple item by range
                } else if ($event.shiftKey) {
                    var data = resources.getSelected();
                    
                    var start = 0;
                    var end = $index;

                    var hasSelected = false;
                    // if have selected data, find index last selected item
                    if( data.length ) {
                        hasSelected = true;
                        // get last selected item
                        var last = _.last(data);
                        // get last index
                        start = _.findIndex(resources.data, { 'public_id': last['public_id'] });
                    }
                    // create range until index selected
                    var min = _.min([start, end]);
                    var max = _.max([start, end]) + 1;
                    var isReverse = false;
                    if( hasSelected ) {
                        if(start > end) { // reverse
                            max -= 1;
                            isReverse = true;
                        } else {
                            min += 1
                        }
                    }

                    var range = (min == 0) ? _.range(max) : _.range(min, max);
                    // get data from index range 
                    var selected = _.filter(resources.data, function(item, key){ return ~_.indexOf(range, key); });
                    // add selected
                    _.forEach(selected, function(item) {
                        resources.addSelected(item);
                    });

                    // is reverse ? set active last selected item
                    if( isReverse ) {
                        resources.setActive(min);
                    }

    			} else {
                    // set single selected item
    				resources.setSelected(item);
    			}
			}
    	};

        /* Dispatch to parent (CloudinaryCtrl) delete resource */
        
        $scope.delete = function(){
            $scope.$emit('resources:delete', 'selected');
        };
    });

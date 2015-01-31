'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryResourcesListCtrl', function($scope, $log, $loading, Modal, CloudinaryService) {
        var resources = CloudinaryService.resources;

        $scope.delete = Modal.confirm.delete(function(selected) {
            var selectedIds, isClearAll;
            var message = 'Deleting ';
            if(_.isArray(selected)) {
                selectedIds = _.pluck(selected, 'public_id');
                isClearAll = true;
                message += 'selected resources';
            } else {
                selectedIds = [selected['public_id']];
                isClearAll = false;
                message += selected[public_id];
            }
            var id = selectedIds.join('|');

            $loading.start(message + '...');

            CloudinaryService.api.remove({ id: id }).$promise.then(function() {
                // remove resources data by selected ids
                _.remove(resources.data, function(item) { 
                    return ~_.indexOf(selectedIds, item.public_id); 
                });
                // clear selected items
                if(isClearAll)
                    resources.clear();
                else
                    resources.selected.unset(selected, true);
                $loading.stop();
            });
        });

    	$scope.select = function($event, $index, item) {
            // set focus item
    		resources.setFocus(item);
            // check this item on selected data
			var index = resources.selected.data.indexOf(item);
            // yes, set active selected item. if already active, remove it.
			if(~index) {
                // force unset, if element 'i'(icon) is focused
				var forceUnset = $event.target.localName == 'i';
				if(resources.selected.isActive(index) || forceUnset) {
					resources.selected.unset(item, forceUnset);
				} else {
					resources.selected.setActive(index);
				}
			} 
            // no, added this is new item to selected data
            else {
                // ctrl key pressed : add multiple item one by one
				if ($event.ctrlKey) {
    				resources.selected.add(item);
                // shift key pressed : add multiple item by range
                } else if ($event.shiftKey) {
                    var start = 0;
                    var end = $index;

                    var hasSelected = false;

                    // if have selected data, find last index
                    if(resources.selected.data.length) {
                        hasSelected = true;
                        // get last selected item
                        var last = _.last(resources.selected.data);
                        // get last index
                        start = _.findIndex(resources.data, { 'public_id': last['public_id'] });
                    }
                    // create range until index selected
                    var min = _.min([start, end]);
                    var max = _.max([start, end]) + 1;
                    if( hasSelected ) {
                        if(start > end) { // reverse
                            max -= 1;
                        } else {
                            min += 1
                        }
                    }

                    var range = (min == 0) ? _.range(max) : _.range(min, max);
                    // get data from index range 
                    var selected = _.filter(resources.data, function(item, key){ return ~_.indexOf(range, key); });
                    // add selected
                    _.forEach(selected, function(item) {
                        resources.selected.add(item);
                    });

    			} else {
    				resources.setSelected(item);
    				resources.selected.set(item);
    			}
			}
    	}
    });
